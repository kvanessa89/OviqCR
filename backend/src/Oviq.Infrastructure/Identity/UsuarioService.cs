using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Oviq.Application.Common.Interfaces;
using Oviq.Application.Usuarios;
using Oviq.Application.Usuarios.Dtos;
using Oviq.Domain.Entities;

namespace Oviq.Infrastructure.Identity;

public class UsuarioService : IUsuarioService
{
    private readonly UserManager<ApplicationUser> _userManager;
    private readonly IApplicationDbContext _context;

    public UsuarioService(UserManager<ApplicationUser> userManager, IApplicationDbContext context)
    {
        _userManager = userManager;
        _context = context;
    }

    public async Task<List<UsuarioDto>> ObtenerTodosAsync(CancellationToken cancellationToken = default)
    {
        var usuarios = await _userManager.Users.ToListAsync(cancellationToken);

        var perfiles = await _context.PerfilesTrabajador
            .Include(p => p.FormaPago)
            .ToDictionaryAsync(p => p.UsuarioId, cancellationToken);

        var resultado = new List<UsuarioDto>();
        foreach (var usuario in usuarios)
        {
            var roles = await _userManager.GetRolesAsync(usuario);
            perfiles.TryGetValue(usuario.Id, out var perfil);
            resultado.Add(MapToDto(usuario, roles.FirstOrDefault() ?? string.Empty, perfil));
        }

        return resultado;
    }

    public async Task<UsuarioDto?> ObtenerPorIdAsync(int id, CancellationToken cancellationToken = default)
    {
        var usuario = await _userManager.Users.FirstOrDefaultAsync(u => u.Id == id, cancellationToken);
        if (usuario is null) return null;

        var roles = await _userManager.GetRolesAsync(usuario);
        var perfil = await _context.PerfilesTrabajador
            .Include(p => p.FormaPago)
            .FirstOrDefaultAsync(p => p.UsuarioId == id, cancellationToken);

        return MapToDto(usuario, roles.FirstOrDefault() ?? string.Empty, perfil);
    }

    public async Task<UsuarioDto> CrearAsync(CrearUsuarioDto dto, CancellationToken cancellationToken = default)
    {
        var usuario = new ApplicationUser
        {
            UserName = dto.Email,
            Email = dto.Email,
            Nombre = dto.Nombre,
            Activo = dto.Activo
        };

        var resultado = await _userManager.CreateAsync(usuario, dto.Password);
        if (!resultado.Succeeded)
        {
            var errores = string.Join("; ", resultado.Errors.Select(e => e.Description));
            throw new InvalidOperationException($"No se pudo crear el usuario: {errores}");
        }

        await _userManager.AddToRoleAsync(usuario, dto.Rol);

        if (dto.PerfilTrabajador is not null)
        {
            var perfil = new PerfilTrabajador
            {
                UsuarioId = usuario.Id,
                FormaPagoId = dto.PerfilTrabajador.FormaPagoId,
                Cargo = dto.PerfilTrabajador.Cargo,
                EmailContacto = dto.PerfilTrabajador.EmailContacto,
                Telefono = dto.PerfilTrabajador.Telefono
            };
            _context.PerfilesTrabajador.Add(perfil);
            await _context.SaveChangesAsync(cancellationToken);
        }

        return (await ObtenerPorIdAsync(usuario.Id, cancellationToken))!;
    }

    public async Task ActualizarAsync(int id, ActualizarUsuarioDto dto, CancellationToken cancellationToken = default)
    {
        var usuario = await _userManager.Users.FirstOrDefaultAsync(u => u.Id == id, cancellationToken)
            ?? throw new KeyNotFoundException($"Usuario {id} no encontrado");

        // Datos básicos
        usuario.Nombre = dto.Nombre;
        usuario.Activo = dto.Activo;
        await _userManager.UpdateAsync(usuario);

        // Cambio de email
        if (!string.Equals(usuario.Email, dto.Email, StringComparison.OrdinalIgnoreCase))
        {
            var setEmail = await _userManager.SetEmailAsync(usuario, dto.Email);
            if (!setEmail.Succeeded)
            {
                var errores = string.Join("; ", setEmail.Errors.Select(e => e.Description));
                throw new InvalidOperationException($"No se pudo cambiar el email: {errores}");
            }
            await _userManager.SetUserNameAsync(usuario, dto.Email);
        }

        // Cambio de contraseña
        if (!string.IsNullOrEmpty(dto.Password))
        {
            var token = await _userManager.GeneratePasswordResetTokenAsync(usuario);
            var resultado = await _userManager.ResetPasswordAsync(usuario, token, dto.Password);
            if (!resultado.Succeeded)
            {
                var errores = string.Join("; ", resultado.Errors.Select(e => e.Description));
                throw new InvalidOperationException($"No se pudo cambiar la contraseña: {errores}");
            }
        }

        // Cambio de rol
        var rolesActuales = await _userManager.GetRolesAsync(usuario);
        var rolActual = rolesActuales.FirstOrDefault();
        if (rolActual != dto.Rol)
        {
            if (rolActual is not null)
                await _userManager.RemoveFromRoleAsync(usuario, rolActual);

            await _userManager.AddToRoleAsync(usuario, dto.Rol);

            // Si dejó de ser Trabajador: eliminar su perfil
            if (rolActual == "Trabajador" && dto.Rol != "Trabajador")
            {
                var perfilAntiguo = await _context.PerfilesTrabajador
                    .FirstOrDefaultAsync(p => p.UsuarioId == id, cancellationToken);
                if (perfilAntiguo is not null)
                    _context.PerfilesTrabajador.Remove(perfilAntiguo);
                await _context.SaveChangesAsync(cancellationToken);
            }
        }

        // Actualizar / crear perfil de trabajador
        if (dto.PerfilTrabajador is not null)
        {
            var perfil = await _context.PerfilesTrabajador
                .FirstOrDefaultAsync(p => p.UsuarioId == id, cancellationToken);

            if (perfil is null)
            {
                perfil = new PerfilTrabajador { UsuarioId = id };
                _context.PerfilesTrabajador.Add(perfil);
            }

            perfil.FormaPagoId = dto.PerfilTrabajador.FormaPagoId;
            perfil.Cargo = dto.PerfilTrabajador.Cargo;
            perfil.EmailContacto = dto.PerfilTrabajador.EmailContacto;
            perfil.Telefono = dto.PerfilTrabajador.Telefono;

            await _context.SaveChangesAsync(cancellationToken);
        }
    }

    private static UsuarioDto MapToDto(ApplicationUser usuario, string rol, PerfilTrabajador? perfil) => new()
    {
        Id = usuario.Id,
        Nombre = usuario.Nombre,
        Email = usuario.Email ?? string.Empty,
        Rol = rol,
        Activo = usuario.Activo,
        PerfilTrabajador = perfil is null ? null : new PerfilTrabajadorDto
        {
            Id = perfil.Id,
            FormaPagoId = perfil.FormaPagoId,
            FormaPagoCodigo = perfil.FormaPago.Codigo,
            FormaPagoNombre = perfil.FormaPago.Nombre,
            Cargo = perfil.Cargo,
            EmailContacto = perfil.EmailContacto,
            Telefono = perfil.Telefono
        }
    };
}
