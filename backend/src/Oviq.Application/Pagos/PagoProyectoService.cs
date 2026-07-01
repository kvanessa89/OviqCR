using Microsoft.EntityFrameworkCore;
using Oviq.Application.Common.Interfaces;
using Oviq.Application.Pagos.Dtos;
using Oviq.Domain.Entities;

namespace Oviq.Application.Pagos;

public class PagoProyectoService : IPagoProyectoService
{
    private readonly IApplicationDbContext _context;

    public PagoProyectoService(IApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<List<PagoProyectoDto>> ObtenerPorProyectoAsync(int proyectoId, CancellationToken cancellationToken = default)
    {
        return await _context.PagosProyecto
            .Where(p => p.ProyectoId == proyectoId)
            .OrderByDescending(p => p.FechaPago)
            .Select(p => MapToDto(p))
            .ToListAsync(cancellationToken);
    }

    public async Task<PagoProyectoDto> CrearAsync(int proyectoId, CrearPagoProyectoDto dto, CancellationToken cancellationToken = default)
    {
        if (!await _context.Proyectos.AnyAsync(p => p.Id == proyectoId, cancellationToken))
            throw new KeyNotFoundException($"Proyecto {proyectoId} no encontrado");

        var pago = new PagoProyecto
        {
            ProyectoId = proyectoId,
            FacturaId = dto.FacturaId,
            Monto = dto.Monto,
            FechaPago = dto.FechaPago,
        };

        _context.PagosProyecto.Add(pago);
        await _context.SaveChangesAsync(cancellationToken);

        return MapToDto(pago);
    }

    public async Task ActualizarAsync(int id, ActualizarPagoProyectoDto dto, CancellationToken cancellationToken = default)
    {
        var pago = await _context.PagosProyecto.FirstOrDefaultAsync(p => p.Id == id, cancellationToken)
            ?? throw new KeyNotFoundException($"Pago {id} no encontrado");

        pago.FacturaId = dto.FacturaId;
        pago.Monto = dto.Monto;
        pago.FechaPago = dto.FechaPago;

        await _context.SaveChangesAsync(cancellationToken);
    }

    public async Task EliminarAsync(int id, CancellationToken cancellationToken = default)
    {
        var pago = await _context.PagosProyecto.FirstOrDefaultAsync(p => p.Id == id, cancellationToken)
            ?? throw new KeyNotFoundException($"Pago {id} no encontrado");

        _context.PagosProyecto.Remove(pago);
        await _context.SaveChangesAsync(cancellationToken);
    }

    private static PagoProyectoDto MapToDto(PagoProyecto p) => new()
    {
        Id = p.Id,
        ProyectoId = p.ProyectoId,
        FacturaId = p.FacturaId,
        Monto = p.Monto,
        FechaPago = p.FechaPago,
        CreadoEn = p.CreadoEn,
    };
}
