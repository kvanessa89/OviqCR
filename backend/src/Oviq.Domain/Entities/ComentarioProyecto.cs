using Oviq.Domain.Common;

namespace Oviq.Domain.Entities;

public class ComentarioProyecto : BaseEntity
{
    public int ProyectoId { get; set; }
    public Proyecto Proyecto { get; set; } = null!;

    // Referencia a ApplicationUser — mismo motivo que en Ticket: sin navigation property.
    public int UsuarioId { get; set; }

    public string Texto { get; set; } = string.Empty;
}
