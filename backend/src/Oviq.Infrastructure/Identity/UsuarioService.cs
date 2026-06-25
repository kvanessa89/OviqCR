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
            Nombre = dto.Nombre
        };

        // UserManager.CreateAsync hashea la contraseña y aplica la política de Identity
        // (RequiredLength, etc., configurada en Program.cs) — no se hashea a mano acá.
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
                TarifaHora = dto.PerfilTrabajador.TarifaHora,
                MontoContrato = dto.PerfilTrabajador.MontoContrato
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

        usuario.Nombre = dto.Nombre;
        await _userManager.UpdateAsync(usuario);

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
            perfil.TarifaHora = dto.PerfilTrabajador.TarifaHora;
            perfil.MontoContrato = dto.PerfilTrabajador.MontoContrato;

            await _context.SaveChangesAsync(cancellationToken);
        }
    }

    private static UsuarioDto MapToDto(ApplicationUser usuario, string rol, PerfilTrabajador? perfil) => new()
    {
        Id = usuario.Id,
        Nombre = usuario.Nombre,
        Email = usuario.Email ?? string.Empty,
        Rol = rol,
        PerfilTrabajador = perfil is null ? null : new PerfilTrabajadorDto
        {
            Id = perfil.Id,
            FormaPagoCodigo = perfil.FormaPago.Codigo,
            FormaPagoNombre = perfil.FormaPago.Nombre,
            TarifaHora = perfil.TarifaHora,
            MontoContrato = perfil.MontoContrato
        }
    };
}
