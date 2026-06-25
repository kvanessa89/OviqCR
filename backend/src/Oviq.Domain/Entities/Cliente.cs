using Oviq.Domain.Common;
using Oviq.Domain.Entities.Catalogos;

namespace Oviq.Domain.Entities;

public class Cliente : BaseEntity
{
    public string Nombre { get; set; } = string.Empty;

    public int EstadoId { get; set; }
    public EstadoCliente Estado { get; set; } = null!;

    public string? Contacto { get; set; }
    public string? Email { get; set; }
    public string? Telefono { get; set; }
    public string? Descripcion { get; set; }

    public ICollection<Clasificacion> Clasificaciones { get; set; } = new List<Clasificacion>();
    public ICollection<Subcuenta> Subcuentas { get; set; } = new List<Subcuenta>();
    public ICollection<Proyecto> Proyectos { get; set; } = new List<Proyecto>();
}
