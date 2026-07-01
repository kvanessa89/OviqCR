using Microsoft.EntityFrameworkCore;
using Oviq.Application.Common.Interfaces;
using Oviq.Application.Gastos.Dtos;
using Oviq.Domain.Entities;

namespace Oviq.Application.Gastos;

public class GastoProyectoService : IGastoProyectoService
{
    private readonly IApplicationDbContext _context;

    public GastoProyectoService(IApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<List<GastoDto>> ObtenerPorProyectoAsync(int proyectoId, CancellationToken cancellationToken = default)
    {
        var gastos = await _context.GastosProyecto
            .Where(g => g.ProyectoId == proyectoId)
            .OrderBy(g => g.CreadoEn)
            .ToListAsync(cancellationToken);

        return gastos.Select(MapToDto).ToList();
    }

    public async Task<GastoDto> CrearAsync(int proyectoId, CrearGastoDto dto, CancellationToken cancellationToken = default)
    {
        if (!await _context.Proyectos.AnyAsync(p => p.Id == proyectoId, cancellationToken))
            throw new KeyNotFoundException($"Proyecto {proyectoId} no encontrado");

        var gasto = new GastoProyecto
        {
            ProyectoId = proyectoId,
            Rubro      = dto.Rubro.Trim(),
            Monto      = dto.Monto,
        };

        _context.GastosProyecto.Add(gasto);
        await _context.SaveChangesAsync(cancellationToken);

        return MapToDto(gasto);
    }

    public async Task ActualizarAsync(int id, ActualizarGastoDto dto, CancellationToken cancellationToken = default)
    {
        var gasto = await _context.GastosProyecto.FirstOrDefaultAsync(g => g.Id == id, cancellationToken)
            ?? throw new KeyNotFoundException($"Gasto {id} no encontrado");

        gasto.Rubro = dto.Rubro.Trim();
        gasto.Monto = dto.Monto;

        await _context.SaveChangesAsync(cancellationToken);
    }

    public async Task EliminarAsync(int id, CancellationToken cancellationToken = default)
    {
        var gasto = await _context.GastosProyecto.FirstOrDefaultAsync(g => g.Id == id, cancellationToken)
            ?? throw new KeyNotFoundException($"Gasto {id} no encontrado");

        _context.GastosProyecto.Remove(gasto);
        await _context.SaveChangesAsync(cancellationToken);
    }

    private static GastoDto MapToDto(GastoProyecto g) => new()
    {
        Id         = g.Id,
        ProyectoId = g.ProyectoId,
        Rubro      = g.Rubro,
        Monto      = g.Monto,
        CreadoEn   = g.CreadoEn,
    };
}
