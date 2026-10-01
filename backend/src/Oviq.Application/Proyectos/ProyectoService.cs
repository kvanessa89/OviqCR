using Microsoft.EntityFrameworkCore;
using Oviq.Application.Common;
using Oviq.Application.Common.Interfaces;
using Oviq.Application.Proyectos.Dtos;
using Oviq.Domain.Entities;

namespace Oviq.Application.Proyectos;

public class ProyectoService : IProyectoService
{
    private readonly IApplicationDbContext _context;

    public ProyectoService(IApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<List<ProyectoDto>> ObtenerTodosAsync(CancellationToken cancellationToken = default)
    {
        var proyectos = await ConsultaBase().ToListAsync(cancellationToken);
        return proyectos.Select(MapToDto).ToList();
    }

    public async Task<ProyectoDto?> ObtenerPorIdAsync(int id, CancellationToken cancellationToken = default)
    {
        var proyecto = await ConsultaBase().FirstOrDefaultAsync(p => p.Id == id, cancellationToken);
        return proyecto is null ? null : MapToDto(proyecto);
    }

    public async Task<ProyectoDto> CrearAsync(CrearProyectoDto dto, CancellationToken cancellationToken = default)
    {
        var proyecto = new Proyecto
        {
            Nombre = dto.Nombre,
            ClienteId = dto.ClienteId,
            SubcuentaId = dto.SubcuentaId,
            EstadoId = dto.EstadoId,
            FechaInicio = dto.FechaInicio,
            FechaFin = dto.FechaFin,
            Descripcion = dto.Descripcion,
            RequiereFactura = dto.RequiereFactura,
            PresupuestoInicial = dto.PresupuestoInicial,
        };

        if (dto.OrdenCompra is not null)
        {
            proyecto.OrdenCompra = new OrdenCompra
            {
                NumeroOc = dto.OrdenCompra.NumeroOc,
                AQuienFacturar = dto.OrdenCompra.AQuienFacturar,
                Detalle = dto.OrdenCompra.Detalle,
                MontoTotal = dto.OrdenCompra.MontoTotal,
                MonedaId = dto.OrdenCompra.MonedaId
            };
        }

        // Nota: la consistencia ClienteId <-> Subcuenta.ClienteId (regla #5) se valida
        // en CrearProyectoValidator, ANTES de llegar acá — no se repite la validación.
        _context.Proyectos.Add(proyecto);
        await _context.SaveChangesAsync(cancellationToken);

        // Si se crea directo con estado "Finalizado" (proyecto histórico ya
        // completado), debe comportarse igual que "Marcar finalizado": fecha
        // de finalización, monto total (CrearProyectoValidator ya exige
        // PresupuestoInicial en este caso) y estado financiero.
        var estadoSeleccionado = await _context.EstadosProyecto
            .FirstOrDefaultAsync(e => e.Id == dto.EstadoId, cancellationToken);

        if (estadoSeleccionado?.Codigo == "finalizado")
        {
            await FinalizarProyectoAsync(proyecto, dto.PresupuestoInicial, cancellationToken);
            await _context.SaveChangesAsync(cancellationToken);
        }

        return (await ObtenerPorIdAsync(proyecto.Id, cancellationToken))!;
    }

    public async Task ActualizarAsync(int id, ActualizarProyectoDto dto, CancellationToken cancellationToken = default)
    {
        var proyecto = await _context.Proyectos
            .Include(p => p.OrdenCompra)
            .FirstOrDefaultAsync(p => p.Id == id, cancellationToken)
            ?? throw new KeyNotFoundException($"Proyecto {id} no encontrado");

        // Regla de negocio #5: si se asigna subcuenta, debe pertenecer al MISMO
        // cliente que ya tiene el proyecto (el cliente no se edita acá, ver
        // ActualizarProyectoDto). No se valida en FluentValidation porque
        // necesita el ClienteId del proyecto existente, no algo que venga en el DTO.
        if (dto.SubcuentaId.HasValue)
        {
            var subcuenta = await _context.Subcuentas
                .FirstOrDefaultAsync(s => s.Id == dto.SubcuentaId, cancellationToken);

            if (subcuenta is null || subcuenta.ClienteId != proyecto.ClienteId)
                throw new InvalidOperationException(
                    "La subcuenta seleccionada no pertenece al cliente del proyecto");
        }

        proyecto.Nombre = dto.Nombre;
        proyecto.SubcuentaId = dto.SubcuentaId;
        proyecto.EstadoId = dto.EstadoId;
        proyecto.FechaInicio = dto.FechaInicio;
        proyecto.FechaFin = dto.FechaFin;
        proyecto.Descripcion = dto.Descripcion;
        proyecto.RequiereFactura = dto.RequiereFactura;
        proyecto.PresupuestoInicial = dto.PresupuestoInicial;

        if (dto.OrdenCompra is not null)
        {
            if (proyecto.OrdenCompra is null)
            {
                proyecto.OrdenCompra = new OrdenCompra { ProyectoId = proyecto.Id };
                _context.OrdenesCompra.Add(proyecto.OrdenCompra);
            }

            proyecto.OrdenCompra.NumeroOc = dto.OrdenCompra.NumeroOc;
            proyecto.OrdenCompra.AQuienFacturar = dto.OrdenCompra.AQuienFacturar;
            proyecto.OrdenCompra.Detalle = dto.OrdenCompra.Detalle;
            proyecto.OrdenCompra.MontoTotal = dto.OrdenCompra.MontoTotal;
            proyecto.OrdenCompra.MonedaId = dto.OrdenCompra.MonedaId;
        }

        await _context.SaveChangesAsync(cancellationToken);
    }

    public async Task MarcarFinalizadoAsync(int id, MarcarFinalizadoDto dto, CancellationToken cancellationToken = default)
    {
        var proyecto = await _context.Proyectos
            .Include(p => p.Facturas).ThenInclude(f => f.Estado)
            .FirstOrDefaultAsync(p => p.Id == id, cancellationToken)
            ?? throw new KeyNotFoundException($"Proyecto {id} no encontrado");

        await FinalizarProyectoAsync(proyecto, dto.MontoTotal, cancellationToken);
        await _context.SaveChangesAsync(cancellationToken);
    }

    // Lógica compartida entre MarcarFinalizadoAsync (botón "Marcar finalizado")
    // y CrearAsync (cuando el proyecto se crea directo con estado "Finalizado",
    // por ejemplo al cargar un proyecto histórico) — ambos caminos deben dejar
    // el proyecto en el mismo estado: FechaFinalizado poblada, monto total
    // (si no requiere factura) y estado financiero correctos. Sin esto, un
    // proyecto creado ya "Finalizado" queda con FechaFinalizado en null para
    // siempre y nunca aparece en el resumen mensual.
    private async Task FinalizarProyectoAsync(Proyecto proyecto, decimal? montoTotal, CancellationToken cancellationToken)
    {
        var estadoFinalizado = await _context.EstadosProyecto
            .FirstOrDefaultAsync(e => e.Codigo == "finalizado", cancellationToken)
            ?? throw new InvalidOperationException("No existe el estado 'finalizado' en el catálogo EstadoProyecto");

        proyecto.EstadoId = estadoFinalizado.Id;
        // Solo la primera vez que finaliza — no se pisa en llamados posteriores.
        proyecto.FechaFinalizado ??= DateTime.UtcNow;

        string codigoEF;
        if (!proyecto.RequiereFactura)
        {
            // Sin facturas no hay de dónde derivar el monto total — se exige acá,
            // al finalizar, en vez de dejarlo editable libremente antes de tiempo.
            if (montoTotal is null || montoTotal <= 0)
                throw new InvalidOperationException("Debe ingresar el monto total del proyecto para finalizarlo");

            var resumen = await _context.ProyectosResumenFinanciero
                .FirstOrDefaultAsync(r => r.ProyectoId == proyecto.Id, cancellationToken);

            if (resumen is null)
            {
                resumen = new ProyectoResumenFinanciero { ProyectoId = proyecto.Id };
                _context.ProyectosResumenFinanciero.Add(resumen);
            }

            resumen.TotalFacturado = montoTotal.Value;
            resumen.UtilidadNeta = montoTotal.Value - resumen.TotalCostos;

            codigoEF = "pendiente_de_pago";
        }
        else if (!proyecto.Facturas.Any(f => f.Estado.Codigo == "emitida"))
        {
            codigoEF = "pendiente_de_facturar";
        }
        else
        {
            // Ya tiene facturas emitidas — el estado financiero fue asignado al emitir la factura
            return;
        }

        var estadoFinanciero = await _context.EstadosFinancieroProyecto
            .FirstOrDefaultAsync(e => e.Codigo == codigoEF, cancellationToken);

        if (estadoFinanciero is not null)
            proyecto.EstadoFinancieroId = estadoFinanciero.Id;
    }

    public async Task EliminarAsync(int id, CancellationToken cancellationToken = default)
    {
        var proyecto = await _context.Proyectos
            .Include(p => p.Facturas)
            .FirstOrDefaultAsync(p => p.Id == id, cancellationToken)
            ?? throw new KeyNotFoundException($"Proyecto {id} no encontrado");

        foreach (var factura in proyecto.Facturas)
            ArchivoUtils.EliminarArchivoSeguro(factura.ArchivoUrl);

        // Factura -> Proyecto usa DeleteBehavior.Restrict para proteger los datos
        // fuera de este caso de negocio, por lo que las facturas se eliminan
        // explícitamente antes del proyecto. Los demás dependientes conservan
        // sus cascadas configuradas en EF Core.
        _context.Facturas.RemoveRange(proyecto.Facturas);
        _context.Proyectos.Remove(proyecto);
        await _context.SaveChangesAsync(cancellationToken);
    }

    private IQueryable<Proyecto> ConsultaBase() =>
        _context.Proyectos
            .Include(p => p.Cliente)
            .Include(p => p.Subcuenta)
            .Include(p => p.Estado)
            .Include(p => p.EstadoFinanciero)
            .Include(p => p.OrdenCompra)
                .ThenInclude(o => o!.Moneda)
            .Include(p => p.Facturas)
                .ThenInclude(f => f.Estado);

    private static ProyectoDto MapToDto(Proyecto p) => new()
    {
        Id = p.Id,
        Nombre = p.Nombre,
        ClienteId = p.ClienteId,
        ClienteNombre = p.Cliente.Nombre,
        SubcuentaId = p.SubcuentaId,
        SubcuentaNombre = p.Subcuenta?.Nombre,
        EstadoCodigo = p.Estado.Codigo,
        EstadoNombre = p.Estado.Nombre,
        FechaInicio = p.FechaInicio,
        FechaFin = p.FechaFin,
        FechaFinalizado = p.FechaFinalizado,
        Descripcion = p.Descripcion,
        OrdenCompra = p.OrdenCompra is null ? null : new OrdenCompraDto
        {
            Id = p.OrdenCompra.Id,
            NumeroOc = p.OrdenCompra.NumeroOc,
            AQuienFacturar = p.OrdenCompra.AQuienFacturar,
            Detalle = p.OrdenCompra.Detalle,
            MontoTotal = p.OrdenCompra.MontoTotal,
            MonedaCodigo = p.OrdenCompra.Moneda.Codigo
        },
        CantidadFacturasEmitidas = p.Facturas.Count(f => f.Estado.Codigo == "emitida"),
        RequiereFactura = p.RequiereFactura,
        PresupuestoInicial = p.PresupuestoInicial,
        EstadoFinancieroId = p.EstadoFinancieroId,
        EstadoFinancieroCodigo = p.EstadoFinanciero?.Codigo,
        EstadoFinancieroNombre = p.EstadoFinanciero?.Nombre,
    };
}
