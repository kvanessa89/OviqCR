using Oviq.Domain.Common;

namespace Oviq.Domain.Entities;

public class ProyectoResumenFinanciero : BaseEntity
{
    public int ProyectoId { get; set; }
    public Proyecto Proyecto { get; set; } = null!;

    public decimal TotalFacturado { get; set; }
    public decimal TotalCostos { get; set; }
    public decimal UtilidadNeta { get; set; }
}
