using Microsoft.EntityFrameworkCore;
using Oviq.Application.Clientes.Dtos;
using Oviq.Application.Common.Interfaces;
using Oviq.Domain.Entities;

namespace Oviq.Application.Clientes;

public class ClienteService : IClienteService
{
    private readonly IApplicationDbContext _context;

    public ClienteService(IApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<List<ClienteDto>> ObtenerTodosAsync(CancellationToken cancellationToken = default)
    {
        var clientes = await _context.Clientes
            .Include(c => c.Estado)
            .Include(c => c.Clasificaciones)
            .Include(c => c.Subcuentas)
                .ThenInclude(s => s.Clasificacion)
            .ToListAsync(cancellationToken);

        return clientes.Select(MapToDto).ToList();
    }

    public async Task<ClienteDto?> ObtenerPorIdAsync(int id, CancellationToken cancellationToken = default)
    {
        var cliente = await _context.Clientes
            .Include(c => c.Estado)
            .Include(c => c.Clasificaciones)
            .Include(c => c.Subcuentas)
                .ThenInclude(s => s.Clasificacion)
            .FirstOrDefaultAsync(c => c.Id == id, cancellationToken);

        return cliente is null ? null : MapToDto(cliente);
    }

    public async Task<ClienteDto> CrearAsync(CrearClienteDto dto, CancellationToken cancellationToken = default)
    {
        var cliente = new Cliente
        {
            Nombre = dto.Nombre,
            EstadoId = dto.EstadoId,
            Contacto = dto.Contacto,
            Email = dto.Email,
            Telefono = dto.Telefono,
            Descripcion = dto.Descripcion
        };

        _context.Clientes.Add(cliente);

        // Mapa TempId -> entidad real, para resolver las referencias de
        // CrearSubcuentaDto.ClasificacionTempId más abajo (ver Dtos/ClienteDtos.cs).
        var clasificacionesPorTempId = new Dictionary<string, Clasificacion>();

        foreach (var clasifDto in dto.Clasificaciones)
        {
            var clasificacion = new Clasificacion
            {
                Nombre = clasifDto.Nombre,
                Cliente = cliente
            };
            _context.Clasificaciones.Add(clasificacion);
            clasificacionesPorTempId[clasifDto.TempId] = clasificacion;
        }

        foreach (var subDto in dto.Subcuentas)
        {
            var subcuenta = new Subcuenta
            {
                Nombre = subDto.Nombre,
                Cliente = cliente
            };

            if (subDto.ClasificacionTempId is not null &&
                clasificacionesPorTempId.TryGetValue(subDto.ClasificacionTempId, out var clasificacion))
            {
                subcuenta.Clasificacion = clasificacion;
            }

            _context.Subcuentas.Add(subcuenta);
        }

        await _context.SaveChangesAsync(cancellationToken);

        return (await ObtenerPorIdAsync(cliente.Id, cancellationToken))!;
    }

    public async Task ActualizarAsync(int id, ActualizarClienteDto dto, CancellationToken cancellationToken = default)
    {
        var cliente = await _context.Clientes.FirstOrDefaultAsync(c => c.Id == id, cancellationToken)
            ?? throw new KeyNotFoundException($"Cliente {id} no encontrado");

        cliente.Nombre = dto.Nombre;
        cliente.EstadoId = dto.EstadoId;
        cliente.Contacto = dto.Contacto;
        cliente.Email = dto.Email;
        cliente.Telefono = dto.Telefono;
        cliente.Descripcion = dto.Descripcion;

        await _context.SaveChangesAsync(cancellationToken);
    }

    public async Task EliminarAsync(int id, CancellationToken cancellationToken = default)
    {
        var cliente = await _context.Clientes
            .Include(c => c.Subcuentas)
            .FirstOrDefaultAsync(c => c.Id == id, cancellationToken)
            ?? throw new KeyNotFoundException($"Cliente {id} no encontrado");

        var tieneProyectos = await _context.Proyectos
            .AnyAsync(p => p.ClienteId == id, cancellationToken);

        if (tieneProyectos)
            throw new InvalidOperationException(
                "No se puede eliminar un cliente que tiene proyectos asociados");

        _context.Clientes.Remove(cliente);
        await _context.SaveChangesAsync(cancellationToken);
    }

    // ── Clasificaciones ────────────────────────────────────────────────

    public async Task<ClasificacionDto> AgregarClasificacionAsync(int clienteId, CrearClasificacionClienteDto dto, CancellationToken cancellationToken = default)
    {
        var existe = await _context.Clientes.AnyAsync(c => c.Id == clienteId, cancellationToken);
        if (!existe) throw new KeyNotFoundException($"Cliente {clienteId} no encontrado");

        var clasif = new Clasificacion { Nombre = dto.Nombre.Trim(), ClienteId = clienteId };
        _context.Clasificaciones.Add(clasif);
        await _context.SaveChangesAsync(cancellationToken);

        return new ClasificacionDto { Id = clasif.Id, Nombre = clasif.Nombre };
    }

    public async Task RenombrarClasificacionAsync(int clienteId, int id, ActualizarClasificacionClienteDto dto, CancellationToken cancellationToken = default)
    {
        var clasif = await _context.Clasificaciones
            .FirstOrDefaultAsync(c => c.Id == id && c.ClienteId == clienteId, cancellationToken)
            ?? throw new KeyNotFoundException("Clasificación no encontrada");

        clasif.Nombre = dto.Nombre.Trim();
        await _context.SaveChangesAsync(cancellationToken);
    }

    public async Task EliminarClasificacionAsync(int clienteId, int id, CancellationToken cancellationToken = default)
    {
        var clasif = await _context.Clasificaciones
            .Include(c => c.Subcuentas)
            .FirstOrDefaultAsync(c => c.Id == id && c.ClienteId == clienteId, cancellationToken)
            ?? throw new KeyNotFoundException("Clasificación no encontrada");

        foreach (var sub in clasif.Subcuentas)
            sub.ClasificacionId = null;

        _context.Clasificaciones.Remove(clasif);
        await _context.SaveChangesAsync(cancellationToken);
    }

    // ── Subcuentas ─────────────────────────────────────────────────────

    public async Task<SubcuentaDto> AgregarSubcuentaAsync(int clienteId, CrearSubcuentaClienteDto dto, CancellationToken cancellationToken = default)
    {
        var existe = await _context.Clientes.AnyAsync(c => c.Id == clienteId, cancellationToken);
        if (!existe) throw new KeyNotFoundException($"Cliente {clienteId} no encontrado");

        if (dto.ClasificacionId.HasValue)
        {
            var clasifExiste = await _context.Clasificaciones
                .AnyAsync(c => c.Id == dto.ClasificacionId && c.ClienteId == clienteId, cancellationToken);
            if (!clasifExiste)
                throw new InvalidOperationException("La clasificación no pertenece a este cliente");
        }

        var sub = new Subcuenta { Nombre = dto.Nombre.Trim(), ClienteId = clienteId, ClasificacionId = dto.ClasificacionId };
        _context.Subcuentas.Add(sub);
        await _context.SaveChangesAsync(cancellationToken);

        string? clasifNombre = null;
        if (sub.ClasificacionId.HasValue)
            clasifNombre = (await _context.Clasificaciones
                .FirstOrDefaultAsync(c => c.Id == sub.ClasificacionId.Value, cancellationToken))?.Nombre;

        return new SubcuentaDto { Id = sub.Id, Nombre = sub.Nombre, ClasificacionId = sub.ClasificacionId, ClasificacionNombre = clasifNombre };
    }

    public async Task ActualizarSubcuentaAsync(int clienteId, int id, ActualizarSubcuentaClienteDto dto, CancellationToken cancellationToken = default)
    {
        var sub = await _context.Subcuentas
            .FirstOrDefaultAsync(s => s.Id == id && s.ClienteId == clienteId, cancellationToken)
            ?? throw new KeyNotFoundException("Subcuenta no encontrada");

        if (dto.ClasificacionId.HasValue)
        {
            var clasifExiste = await _context.Clasificaciones
                .AnyAsync(c => c.Id == dto.ClasificacionId && c.ClienteId == clienteId, cancellationToken);
            if (!clasifExiste)
                throw new InvalidOperationException("La clasificación no pertenece a este cliente");
        }

        sub.Nombre = dto.Nombre.Trim();
        sub.ClasificacionId = dto.ClasificacionId;
        await _context.SaveChangesAsync(cancellationToken);
    }

    public async Task EliminarSubcuentaAsync(int clienteId, int id, CancellationToken cancellationToken = default)
    {
        var sub = await _context.Subcuentas
            .Include(s => s.Proyectos)
            .FirstOrDefaultAsync(s => s.Id == id && s.ClienteId == clienteId, cancellationToken)
            ?? throw new KeyNotFoundException("Subcuenta no encontrada");

        if (sub.Proyectos.Any())
            throw new InvalidOperationException("No se puede eliminar una subcuenta que tiene proyectos asociados");

        _context.Subcuentas.Remove(sub);
        await _context.SaveChangesAsync(cancellationToken);
    }

    private static ClienteDto MapToDto(Cliente c) => new()
    {
        Id = c.Id,
        Nombre = c.Nombre,
        EstadoId = c.EstadoId,
        EstadoCodigo = c.Estado.Codigo,
        EstadoNombre = c.Estado.Nombre,
        Contacto = c.Contacto,
        Email = c.Email,
        Telefono = c.Telefono,
        Descripcion = c.Descripcion,
        Clasificaciones = c.Clasificaciones
            .Select(cl => new ClasificacionDto { Id = cl.Id, Nombre = cl.Nombre })
            .ToList(),
        Subcuentas = c.Subcuentas
            .Select(s => new SubcuentaDto
            {
                Id = s.Id,
                Nombre = s.Nombre,
                ClasificacionId = s.ClasificacionId,
                ClasificacionNombre = s.Clasificacion?.Nombre
            })
            .ToList()
    };
}
