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

    private static ClienteDto MapToDto(Cliente c) => new()
    {
        Id = c.Id,
        Nombre = c.Nombre,
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
