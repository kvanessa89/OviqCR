using Microsoft.EntityFrameworkCore;
using Oviq.Application.Common.Interfaces;
using Oviq.Application.Proyectos.Dtos;
using Oviq.Domain.Entities;

namespace Oviq.Application.Proyectos;

public class ProyectoResumenFinancieroService : IProyectoResumenFinancieroService
{
    private readonly IApplicationDbContext _context;

    public ProyectoResumenFinancieroService(IApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<ProyectoResumenFinancieroDto?> ObtenerPorProyectoAsync(int proyectoId, CancellationToken cancellationToken = default)
    {
        var resumen = await _context.ProyectosResumenFinanciero
            .FirstOrDefaultAsync(r => r.ProyectoId == proyectoId, cancellationToken);

        var totalPagado = await _context.PagosProyecto
            .Where(p => p.ProyectoId == proyectoId)
            .SumAsync(p => p.Monto, cancellationToken);

        if (resumen is null)
        {
            if (totalPagado == 0) return null;
            return new ProyectoResumenFinancieroDto { ProyectoId = proyectoId, TotalPagado = totalPagado };
        }

        return MapToDto(resumen, totalPagado);
    }

    public async Task<ProyectoResumenFinancieroDto> GuardarAsync(int proyectoId, GuardarResumenFinancieroDto dto, CancellationToken cancellationToken = default)
    {
        if (!await _context.Proyectos.AnyAsync(p => p.Id == proyectoId, cancellationToken))
            throw new KeyNotFoundException($"Proyecto {proyectoId} no encontrado");

        var resumen = await _context.ProyectosResumenFinanciero
            .FirstOrDefaultAsync(r => r.ProyectoId == proyectoId, cancellationToken);

        if (resumen is null)
        {
            resumen = new ProyectoResumenFinanciero { ProyectoId = proyectoId };
            _context.ProyectosResumenFinanciero.Add(resumen);
        }

        resumen.TotalFacturado = dto.TotalFacturado;
        resumen.TotalCostos = dto.TotalCostos;
        resumen.UtilidadNeta = dto.UtilidadNeta;

        await _context.SaveChangesAsync(cancellationToken);

        await ActualizarEstadoFinancieroPendientePagoAsync(proyectoId, cancellationToken);

        return MapToDto(resumen);
    }

    public async Task RegistrarPagoClienteAsync(int proyectoId, RegistrarPagoClienteDto dto, CancellationToken cancellationToken = default)
    {
        var proyecto = await _context.Proyectos
            .Include(p => p.EstadoFinanciero)
            .FirstOrDefaultAsync(p => p.Id == proyectoId, cancellationToken)
            ?? throw new KeyNotFoundException($"Proyecto {proyectoId} no encontrado");

        var resumen = await _context.ProyectosResumenFinanciero
            .FirstOrDefaultAsync(r => r.ProyectoId == proyectoId, cancellationToken)
            ?? throw new InvalidOperationException("El proyecto no tiene resumen financiero registrado");

        // Registrar el pago sin factura asociada
        _context.PagosProyecto.Add(new Domain.Entities.PagoProyecto
        {
            ProyectoId = proyectoId,
            FacturaId  = null,
            Monto      = dto.Monto,
            FechaPago  = DateTime.UtcNow,
        });

        // Sumar pagos anteriores + el nuevo para determinar el estado
        var totalPagadoAnterior = await _context.PagosProyecto
            .Where(p => p.ProyectoId == proyectoId)
            .SumAsync(p => p.Monto, cancellationToken);

        var totalPagadoAcumulado = totalPagadoAnterior + dto.Monto;

        var codigoNuevoEstado = totalPagadoAcumulado >= resumen.TotalFacturado ? "pagado" : "pagado_parcialmente";

        var estadoFinanciero = await _context.EstadosFinancieroProyecto
            .FirstOrDefaultAsync(e => e.Codigo == codigoNuevoEstado, cancellationToken)
            ?? throw new InvalidOperationException($"No existe el estado financiero '{codigoNuevoEstado}'");

        proyecto.EstadoFinancieroId = estadoFinanciero.Id;

        await _context.SaveChangesAsync(cancellationToken);
    }

    private async Task ActualizarEstadoFinancieroPendientePagoAsync(int proyectoId, CancellationToken cancellationToken)
    {
        var proyecto = await _context.Proyectos
            .Include(p => p.EstadoFinanciero)
            .FirstOrDefaultAsync(p => p.Id == proyectoId, cancellationToken);

        if (proyecto is null || proyecto.EstadoFinanciero?.Codigo != "pendiente_de_cobro") return;

        var estadoPendientePago = await _context.EstadosFinancieroProyecto
            .FirstOrDefaultAsync(e => e.Codigo == "pendiente_de_pago", cancellationToken);

        if (estadoPendientePago is null) return;

        proyecto.EstadoFinancieroId = estadoPendientePago.Id;
        await _context.SaveChangesAsync(cancellationToken);
    }

    private static ProyectoResumenFinancieroDto MapToDto(ProyectoResumenFinanciero r, decimal totalPagado = 0) => new()
    {
        Id = r.Id,
        ProyectoId = r.ProyectoId,
        TotalFacturado = r.TotalFacturado,
        TotalCostos = r.TotalCostos,
        UtilidadNeta = r.UtilidadNeta,
        TotalPagado = totalPagado,
    };
}
