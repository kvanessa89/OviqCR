using Oviq.Domain.Common;

namespace Oviq.Domain.Entities;

// Agrupa subcuentas visualmente (ej: "ATO Juan Santamaría" en Café Britt).
// No tiene comportamiento ni afecta la facturación — es solo presentacional.
public class Clasificacion : BaseEntity
{
    public int ClienteId { get; set; }
    public Cliente Cliente { get; set; } = null!;

    public string Nombre { get; set; } = string.Empty;

    public ICollection<Subcuenta> Subcuentas { get; set; } = new List<Subcuenta>();
}
