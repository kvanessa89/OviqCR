using Oviq.Domain.Common;

namespace Oviq.Domain.Entities;

public class GastoProyecto : BaseEntity
{
    public int ProyectoId { get; set; }
    public Proyecto Proyecto { get; set; } = null!;

    public string Rubro { get; set; } = string.Empty;
    public decimal Monto { get; set; }
}
