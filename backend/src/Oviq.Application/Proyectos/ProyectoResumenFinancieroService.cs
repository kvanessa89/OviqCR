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

    public async Task<ResumenMensualDto> ObtenerResumenMensualAsync(int anio, int mes, CancellationToken cancellationToken = default)
    {
        var inicioMes = new DateTime(anio, mes, 1, 0, 0, 0, DateTimeKind.Utc);
        var inicioMesSiguiente = inicioMes.AddMonths(1);

        // Proyectos facturados: monto de todas las facturas (CRC) emitidas en el mes,
        // sin importar si ya se pagaron o no.
        var facturasDelMes = await _context.Facturas
            .Include(f => f.Moneda)
            .Include(f => f.Estado)
            .Where(f => f.Moneda.Codigo == "CRC"
                     && f.FechaEmision >= inicioMes
                     && f.FechaEmision < inicioMesSiguiente)
            .ToListAsync(cancellationToken);

        var proyectosFacturados = facturasDelMes.Sum(f => f.Monto);
        var pagadoFacturado = facturasDelMes.Where(f => f.Estado.Codigo == "pagada").Sum(f => f.Monto);
        var iva = facturasDelMes.Where(f => !f.SinIva).Sum(f => f.Monto * 0.13m);

        // Proyectos sin factura: monto total (ProyectoResumenFinanciero.TotalFacturado)
        // de los proyectos que no requieren factura y se finalizaron en el mes consultado.
        var proyectosSinFacturaIds = await _context.Proyectos
            .Where(p => !p.RequiereFactura
                     && p.FechaFinalizado != null
                     && p.FechaFinalizado >= inicioMes
                     && p.FechaFinalizado < inicioMesSiguiente)
            .Select(p => p.Id)
            .ToListAsync(cancellationToken);

        var proyectosSinFactura = await _context.ProyectosResumenFinanciero
            .Where(r => proyectosSinFacturaIds.Contains(r.ProyectoId))
            .SumAsync(r => r.TotalFacturado, cancellationToken);

        var pagadoSinFactura = await _context.PagosProyecto
            .Where(p => proyectosSinFacturaIds.Contains(p.ProyectoId))
            .SumAsync(p => p.Monto, cancellationToken);

        var pagado = pagadoFacturado + pagadoSinFactura;
        var pendienteDeCobro = Math.Max(0, (proyectosFacturados + proyectosSinFactura) - pagado);

        // Gastos de los proyectos facturados (según sus facturas emitidas este mes) y de
        // los proyectos sin factura finalizados este mes.
        var idsParaGastos = facturasDelMes.Select(f => f.ProyectoId)
            .Concat(proyectosSinFacturaIds)
            .Distinct()
            .ToList();

        var gastosProyectos = await _context.GastosProyecto
            .Where(g => idsParaGastos.Contains(g.ProyectoId))
            .SumAsync(g => g.Monto, cancellationToken);

        var ganancia = proyectosFacturados + proyectosSinFactura - iva - gastosProyectos;

        return new ResumenMensualDto
        {
            ProyectosFacturados = proyectosFacturados,
            CantidadFacturasEmitidas = facturasDelMes.Count,
            ProyectosSinFactura = proyectosSinFactura,
            CantidadProyectosSinFactura = proyectosSinFacturaIds.Count,
            Pagado = pagado,
            PendienteDeCobro = pendienteDeCobro,
            Iva = iva,
            GastosProyectos = gastosProyectos,
            Ganancia = ganancia,
        };
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
