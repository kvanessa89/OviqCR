namespace Oviq.Domain.Common;

// Base compartida por los 6 catálogos editables (EstadoCliente, EstadoProyecto, Moneda,
// PrioridadTicket, EstadoTicket, FormaPago).
//
// Codigo es inmutable y es lo que usa el backend para comparaciones, ej.:
//   if (proyecto.Estado.Codigo == "facturado") { ... }
//
// Nombre es editable por el Administrador desde la UI sin romper esa lógica.
// Activo reemplaza el borrado: se desactiva un valor en uso en vez de eliminarlo,
// para no perder la integridad de los datos históricos que ya lo referencian.
public abstract class CatalogoBase : BaseEntity
{
    public string Codigo { get; set; } = string.Empty;
    public string Nombre { get; set; } = string.Empty;
    public bool Activo { get; set; } = true;
}
