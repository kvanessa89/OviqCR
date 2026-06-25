using Oviq.Domain.Common;

namespace Oviq.Domain.Entities;

public class Subcuenta : BaseEntity
{
    public int ClienteId { get; set; }
    public Cliente Cliente { get; set; } = null!;

    public int? ClasificacionId { get; set; }
    public Clasificacion? Clasificacion { get; set; }

    public string Nombre { get; set; } = string.Empty;

    public ICollection<Proyecto> Proyectos { get; set; } = new List<Proyecto>();
}
