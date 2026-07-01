using Microsoft.EntityFrameworkCore;
using Oviq.Application.Common.Interfaces;
using Oviq.Application.Facturas.Dtos;
using Oviq.Domain.Entities;

namespace Oviq.Application.Facturas;

public class FacturaService : IFacturaService
{
    private readonly IApplicationDbContext _context;

    public FacturaService(IApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<List<FacturaDto>> ObtenerTodasAsync(CancellationToken cancellationToken = default)
    {
        var facturas = await ConsultaBase().ToListAsync(cancellationToken);
        return facturas.Select(MapToDto).ToList();
    }

    public async Task<List<FacturaDto>> ObtenerPorProyectoAsync(int proyectoId, CancellationToken cancellationToken = default)
    {
        var facturas = await ConsultaBase()
            .Where(f => f.ProyectoId == proyectoId)
            .ToListAsync(cancellationToken);
        return facturas.Select(MapToDto).ToList();
    }

    public async Task<FacturaDto?> ObtenerPorIdAsync(int id, CancellationToken cancellationToken = default)
    {
        var factura = await ConsultaBase().FirstOrDefaultAsync(f => f.Id == id, cancellationToken);
        return factura is null ? null : MapToDto(factura);
    }

    public async Task<FacturaDto> CrearAsync(CrearFacturaDto dto, CancellationToken cancellationToken = default)
    {
        var proyecto = await _context.Proyectos.FirstOrDefaultAsync(p => p.Id == dto.ProyectoId, cancellationToken)
            ?? throw new KeyNotFoundException($"Proyecto {dto.ProyectoId} no encontrado");

        if (dto.SubcuentaId.HasValue)
        {
            var subcuenta = await _context.Subcuentas.FirstOrDefaultAsync(s => s.Id == dto.SubcuentaId, cancellationToken);
            if (subcuenta is null || subcuenta.ClienteId != proyecto.ClienteId)
                throw new InvalidOperationException("La subcuenta no pertenece al cliente del proyecto");
        }

        var factura = new Factura
        {
            Numero            = dto.Numero,
            ProyectoId        = dto.ProyectoId,
            ClienteId         = proyecto.ClienteId,
            SubcuentaId       = dto.SubcuentaId,
            MonedaId          = dto.MonedaId,
            Monto             = dto.Monto,
            SinIva            = dto.SinIva,
            FechaEmision      = dto.FechaEmision,
            FechaEstimadaPago = dto.FechaEstimadaPago,
            EstadoId          = dto.EstadoId,
            Notas             = dto.Notas,
        };

        _context.Facturas.Add(factura);
        await _context.SaveChangesAsync(cancellationToken);

        await ActualizarEstadoFinancieroPorNuevaFacturaAsync(dto.ProyectoId, cancellationToken);
        await ActualizarEstadoFinancieroSiEmitidaAsync(proyecto, dto.EstadoId, cancellationToken);
        await SincronizarEstadoFinancieroPorFacturasAsync(dto.ProyectoId, cancellationToken);
        await ActualizarResumenFacturadoAsync(dto.ProyectoId, cancellationToken);

        return (await ObtenerPorIdAsync(factura.Id, cancellationToken))!;
    }

    public async Task ActualizarAsync(int id, ActualizarFacturaDto dto, CancellationToken cancellationToken = default)
    {
        var factura = await _context.Facturas.FirstOrDefaultAsync(f => f.Id == id, cancellationToken)
            ?? throw new KeyNotFoundException($"Factura {id} no encontrada");

        var proyecto = await _context.Proyectos.FirstOrDefaultAsync(p => p.Id == dto.ProyectoId, cancellationToken)
            ?? throw new KeyNotFoundException($"Proyecto {dto.ProyectoId} no encontrado");

        if (dto.SubcuentaId.HasValue)
        {
            var subcuenta = await _context.Subcuentas.FirstOrDefaultAsync(s => s.Id == dto.SubcuentaId, cancellationToken);
            if (subcuenta is null || subcuenta.ClienteId != proyecto.ClienteId)
                throw new InvalidOperationException("La subcuenta no pertenece al cliente del proyecto");
        }

        factura.Numero            = dto.Numero;
        factura.ProyectoId        = dto.ProyectoId;
        factura.ClienteId         = proyecto.ClienteId;
        factura.SubcuentaId       = dto.SubcuentaId;
        factura.MonedaId          = dto.MonedaId;
        factura.Monto             = dto.Monto;
        factura.SinIva            = dto.SinIva;
        factura.FechaEmision      = dto.FechaEmision;
        factura.FechaEstimadaPago = dto.FechaEstimadaPago;
        factura.EstadoId          = dto.EstadoId;
        factura.Notas             = dto.Notas;

        // Auto-asignar FechaPago cuando el estado pasa a "pagada"
        var estadoPagada = await _context.EstadosFactura
            .FirstOrDefaultAsync(e => e.Codigo == "pagada", cancellationToken);
        var marcandoPagada = estadoPagada is not null && dto.EstadoId == estadoPagada.Id;
        if (marcandoPagada)
            factura.FechaPago ??= DateTime.UtcNow;
        else
            factura.FechaPago = null;

        await _context.SaveChangesAsync(cancellationToken);

        // Registrar el pago y actualizar estado financiero cuando la factura pasa a "pagada"
        if (marcandoPagada)
        {
            var pagoExistente = await _context.PagosProyecto
                .AnyAsync(p => p.FacturaId == factura.Id, cancellationToken);

            if (!pagoExistente)
            {
                _context.PagosProyecto.Add(new Domain.Entities.PagoProyecto
                {
                    ProyectoId = factura.ProyectoId,
                    FacturaId  = factura.Id,
                    Monto      = factura.Monto,
                    FechaPago  = factura.FechaPago!.Value,
                });
                await _context.SaveChangesAsync(cancellationToken);
            }

            // Determinar estado financiero según si todas las facturas del proyecto están pagadas
            var facturasProyecto = await _context.Facturas
                .Include(f => f.Estado)
                .Where(f => f.ProyectoId == factura.ProyectoId)
                .ToListAsync(cancellationToken);

            var codigoEF = facturasProyecto.All(f => f.Estado.Codigo == "pagada")
                ? "pagado"
                : "pagado_parcialmente";

            var estadoEF = await _context.EstadosFinancieroProyecto
                .FirstOrDefaultAsync(e => e.Codigo == codigoEF, cancellationToken);

            if (estadoEF is not null)
            {
                var proyectoEF = await _context.Proyectos
                    .FirstOrDefaultAsync(p => p.Id == factura.ProyectoId, cancellationToken);

                if (proyectoEF is not null && proyectoEF.EstadoFinancieroId != estadoEF.Id)
                {
                    proyectoEF.EstadoFinancieroId = estadoEF.Id;
                    await _context.SaveChangesAsync(cancellationToken);
                }
            }
        }

        await ActualizarEstadoFinancieroSiEmitidaAsync(proyecto, dto.EstadoId, cancellationToken);
        await SincronizarEstadoFinancieroPorFacturasAsync(factura.ProyectoId, cancellationToken);
        await ActualizarResumenFacturadoAsync(factura.ProyectoId, cancellationToken);
    }

    public async Task<string> SubirArchivoAsync(int id, Stream archivo, string nombreArchivo, CancellationToken cancellationToken = default)
    {
        var factura = await _context.Facturas.FirstOrDefaultAsync(f => f.Id == id, cancellationToken)
            ?? throw new KeyNotFoundException($"Factura {id} no encontrada");

        var wwwroot = Path.Combine(Directory.GetCurrentDirectory(), "wwwroot");
        var carpeta = Path.Combine(wwwroot, "facturas");
        Directory.CreateDirectory(carpeta);

        var ext      = Path.GetExtension(nombreArchivo);
        var fileName = $"factura-{id}-{Guid.NewGuid():N}{ext}";
        var rutaFull = Path.Combine(carpeta, fileName);

        if (!string.IsNullOrWhiteSpace(factura.ArchivoUrl))
        {
            var anterior = Path.Combine(wwwroot, factura.ArchivoUrl.TrimStart('/'));
            if (File.Exists(anterior)) File.Delete(anterior);
        }

        await using var fs = File.Create(rutaFull);
        await archivo.CopyToAsync(fs, cancellationToken);

        factura.ArchivoUrl = $"/facturas/{fileName}";
        await _context.SaveChangesAsync(cancellationToken);

        return factura.ArchivoUrl;
    }

    public async Task EliminarAsync(int id, CancellationToken cancellationToken = default)
    {
        var factura = await _context.Facturas.FirstOrDefaultAsync(f => f.Id == id, cancellationToken)
            ?? throw new KeyNotFoundException($"Factura {id} no encontrada");

        if (!string.IsNullOrWhiteSpace(factura.ArchivoUrl))
        {
            var ruta = Path.Combine(Directory.GetCurrentDirectory(), "wwwroot", factura.ArchivoUrl.TrimStart('/'));
            if (File.Exists(ruta)) File.Delete(ruta);
        }

        var proyectoId = factura.ProyectoId;
        _context.Facturas.Remove(factura);
        await _context.SaveChangesAsync(cancellationToken);

        await ActualizarResumenFacturadoAsync(proyectoId, cancellationToken);
    }

    private static readonly HashSet<string> _estadosFacturaRelacionados =
        ["facturado", "pendiente_de_pago", "pagado_parcialmente", "pagado"];

    private async Task SincronizarEstadoFinancieroPorFacturasAsync(int proyectoId, CancellationToken cancellationToken)
    {
        var proyecto = await _context.Proyectos
            .Include(p => p.EstadoFinanciero)
            .FirstOrDefaultAsync(p => p.Id == proyectoId, cancellationToken);

        if (proyecto?.EstadoFinanciero?.Codigo is null) return;
        if (!_estadosFacturaRelacionados.Contains(proyecto.EstadoFinanciero.Codigo)) return;

        var facturas = await _context.Facturas
            .Include(f => f.Estado)
            .Where(f => f.ProyectoId == proyectoId)
            .ToListAsync(cancellationToken);

        if (!facturas.Any()) return;

        var total   = facturas.Count;
        var pagadas = facturas.Count(f => f.Estado.Codigo == "pagada");
        var emitidas = facturas.Count(f => f.Estado.Codigo == "emitida");

        string? codigoNuevo = null;
        if (pagadas == total)
            codigoNuevo = "pagado";
        else if (pagadas > 0)
            codigoNuevo = "pagado_parcialmente";
        else if (emitidas == total)
            codigoNuevo = "facturado";

        if (codigoNuevo is null) return;

        var estadoFinanciero = await _context.EstadosFinancieroProyecto
            .FirstOrDefaultAsync(e => e.Codigo == codigoNuevo, cancellationToken);

        if (estadoFinanciero is null || proyecto.EstadoFinancieroId == estadoFinanciero.Id) return;

        proyecto.EstadoFinancieroId = estadoFinanciero.Id;
        await _context.SaveChangesAsync(cancellationToken);
    }

    private async Task ActualizarEstadoFinancieroPorNuevaFacturaAsync(int proyectoId, CancellationToken cancellationToken)
    {
        var proyecto = await _context.Proyectos
            .Include(p => p.EstadoFinanciero)
            .FirstOrDefaultAsync(p => p.Id == proyectoId, cancellationToken);

        if (proyecto?.EstadoFinanciero?.Codigo != "pendiente_de_facturar") return;

        var estadoFacturado = await _context.EstadosFinancieroProyecto
            .FirstOrDefaultAsync(e => e.Codigo == "facturado", cancellationToken);

        if (estadoFacturado is null) return;

        proyecto.EstadoFinancieroId = estadoFacturado.Id;
        await _context.SaveChangesAsync(cancellationToken);
    }

    private async Task ActualizarResumenFacturadoAsync(int proyectoId, CancellationToken cancellationToken)
    {
        var totalFacturado = await _context.Facturas
            .Where(f => f.ProyectoId == proyectoId)
            .SumAsync(f => f.Monto, cancellationToken);

        var resumen = await _context.ProyectosResumenFinanciero
            .FirstOrDefaultAsync(r => r.ProyectoId == proyectoId, cancellationToken);

        if (resumen is null)
        {
            resumen = new Domain.Entities.ProyectoResumenFinanciero { ProyectoId = proyectoId };
            _context.ProyectosResumenFinanciero.Add(resumen);
        }

        resumen.TotalFacturado = totalFacturado;
        resumen.UtilidadNeta   = totalFacturado - resumen.TotalCostos;

        await _context.SaveChangesAsync(cancellationToken);
    }

    private async Task ActualizarEstadoFinancieroSiEmitidaAsync(Proyecto proyecto, int nuevoEstadoFacturaId, CancellationToken cancellationToken)
    {
        if (!proyecto.RequiereFactura) return;

        var estadoEmitida = await _context.EstadosFactura
            .FirstOrDefaultAsync(e => e.Codigo == "emitida", cancellationToken);

        if (estadoEmitida is null || nuevoEstadoFacturaId != estadoEmitida.Id) return;

        var estadoFinanciero = await _context.EstadosFinancieroProyecto
            .FirstOrDefaultAsync(e => e.Codigo == "facturado", cancellationToken);

        if (estadoFinanciero is null) return;

        // Recarga el proyecto para modificarlo sin conflicto de tracking
        var proyectoTracked = await _context.Proyectos
            .FirstOrDefaultAsync(p => p.Id == proyecto.Id, cancellationToken);

        if (proyectoTracked is not null && proyectoTracked.EstadoFinancieroId != estadoFinanciero.Id)
        {
            proyectoTracked.EstadoFinancieroId = estadoFinanciero.Id;
            await _context.SaveChangesAsync(cancellationToken);
        }
    }

    private IQueryable<Factura> ConsultaBase() =>
        _context.Facturas
            .Include(f => f.Proyecto)
            .Include(f => f.Cliente)
            .Include(f => f.Subcuenta)
            .Include(f => f.Moneda)
            .Include(f => f.Estado);

    private static FacturaDto MapToDto(Factura f)
    {
        var estaVencida = f.Estado.Codigo == "emitida"
            && f.FechaEstimadaPago.Date < DateTime.UtcNow.Date;
        return new FacturaDto
        {
            Id                = f.Id,
            Numero            = f.Numero,
            ProyectoId        = f.ProyectoId,
            ProyectoNombre    = f.Proyecto.Nombre,
            ClienteId         = f.ClienteId,
            ClienteNombre     = f.Cliente.Nombre,
            SubcuentaId       = f.SubcuentaId,
            SubcuentaNombre   = f.Subcuenta?.Nombre,
            MonedaId          = f.MonedaId,
            MonedaCodigo      = f.Moneda.Codigo,
            MonedaNombre      = f.Moneda.Nombre,
            Monto             = f.Monto,
            SinIva            = f.SinIva,
            FechaEmision      = f.FechaEmision,
            FechaEstimadaPago = f.FechaEstimadaPago,
            EstadoCodigo      = estaVencida ? "vencida" : f.Estado.Codigo,
            EstadoNombre      = estaVencida ? "Vencida" : f.Estado.Nombre,
            EstaVencida       = estaVencida,
            FechaPago         = f.FechaPago,
            Notas             = f.Notas,
            ArchivoUrl        = f.ArchivoUrl,
        };
    }
}
