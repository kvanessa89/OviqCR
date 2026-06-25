using Microsoft.EntityFrameworkCore;
using Oviq.Application.Catalogos.Dtos;
using Oviq.Application.Common.Interfaces;
using Oviq.Domain.Common;

namespace Oviq.Application.Catalogos;

// Un solo servicio sirve para EstadoCliente, EstadoProyecto, PrioridadTicket,
// EstadoTicket, FormaPago y Moneda — todos comparten exactamente esta forma
// (id, codigo, nombre, activo, orden).
public class CatalogoService<T> : ICatalogoService<T> where T : CatalogoBase, IOrdenable, new()
{
    private readonly IApplicationDbContext _context;

    public CatalogoService(IApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<List<CatalogoDto>> ObtenerActivosAsync(CancellationToken cancellationToken = default)
    {
        var items = await _context.Set<T>()
            .Where(c => c.Activo)
            .OrderBy(c => c.Orden)
            .ToListAsync(cancellationToken);

        return items.Select(MapToDto).ToList();
    }

    public async Task<CatalogoDto> CrearAsync(CrearCatalogoDto dto, CancellationToken cancellationToken = default)
    {
        var entidad = new T
        {
            Codigo = dto.Codigo,
            Nombre = dto.Nombre,
            Orden = dto.Orden,
            Activo = true
        };

        _context.Set<T>().Add(entidad);
        await _context.SaveChangesAsync(cancellationToken);

        return MapToDto(entidad);
    }

    public async Task ActualizarAsync(int id, ActualizarCatalogoDto dto, CancellationToken cancellationToken = default)
    {
        var entidad = await _context.Set<T>().FirstOrDefaultAsync(c => c.Id == id, cancellationToken)
            ?? throw new KeyNotFoundException($"{typeof(T).Name} {id} no encontrado");

        // Codigo NO se toca acá — es inmutable (regla de negocio #7)
        entidad.Nombre = dto.Nombre;
        entidad.Orden = dto.Orden;
        entidad.Activo = dto.Activo;

        await _context.SaveChangesAsync(cancellationToken);
    }

    public async Task DesactivarAsync(int id, CancellationToken cancellationToken = default)
    {
        var entidad = await _context.Set<T>().FirstOrDefaultAsync(c => c.Id == id, cancellationToken)
            ?? throw new KeyNotFoundException($"{typeof(T).Name} {id} no encontrado");

        entidad.Activo = false;
        await _context.SaveChangesAsync(cancellationToken);
    }

    private static CatalogoDto MapToDto(T entidad) => new()
    {
        Id = entidad.Id,
        Codigo = entidad.Codigo,
        Nombre = entidad.Nombre,
        Activo = entidad.Activo,
        Orden = entidad.Orden
    };
}
