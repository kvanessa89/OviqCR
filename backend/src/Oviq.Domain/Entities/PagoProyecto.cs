using Oviq.Domain.Common;

namespace Oviq.Domain.Entities;

public class PagoProyecto : BaseEntity
{
    public int ProyectoId { get; set; }
    public Proyecto Proyecto { get; set; } = null!;

    public int? FacturaId { get; set; }
    public Factura? Factura { get; set; }

    public decimal Monto { get; set; }
    public DateTime FechaPago { get; set; }
}
