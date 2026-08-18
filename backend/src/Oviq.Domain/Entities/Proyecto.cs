using Oviq.Domain.Common;
using Oviq.Domain.Entities.Catalogos;

namespace Oviq.Domain.Entities;

public class Proyecto : BaseEntity
{
    public string Nombre { get; set; } = string.Empty;

    public int ClienteId { get; set; }
    public Cliente Cliente { get; set; } = null!;

    // Opcional: solo se llena si el cliente tiene subcuentas.
    // IMPORTANTE: SubcuentaId.Cliente debe coincidir siempre con ClienteId.
    // No se garantiza por base de datos — se valida en la capa Application.
    public int? SubcuentaId { get; set; }
    public Subcuenta? Subcuenta { get; set; }

    public int EstadoId { get; set; }
    public EstadoProyecto Estado { get; set; } = null!;

    public DateTime? FechaInicio { get; set; }
    public DateTime? FechaFin { get; set; }
    public string? Descripcion { get; set; }

    // Se setea una única vez, la primera vez que el proyecto pasa a "finalizado"
    // (ver ProyectoService.MarcarFinalizadoAsync) — a diferencia de FechaFin
    // (estimada, editable a mano), esta es la fecha real de finalización.
    public DateTime? FechaFinalizado { get; set; }

    public bool RequiereFactura { get; set; } = true;
    public decimal? PresupuestoInicial { get; set; }

    public int? EstadoFinancieroId { get; set; }
    public EstadoFinancieroProyecto? EstadoFinanciero { get; set; }

    public OrdenCompra? OrdenCompra { get; set; }
    public ICollection<Ticket> Tickets { get; set; } = new List<Ticket>();
    public ICollection<ComentarioProyecto> Comentarios { get; set; } = new List<ComentarioProyecto>();
    public ICollection<Factura> Facturas { get; set; } = new List<Factura>();
    public ICollection<GastoProyecto> Gastos { get; set; } = new List<GastoProyecto>();
    public ICollection<PagoProyecto> Pagos { get; set; } = new List<PagoProyecto>();
    public ProyectoResumenFinanciero? ResumenFinanciero { get; set; }
}
