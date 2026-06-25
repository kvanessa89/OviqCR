using Oviq.Domain.Common;
using Oviq.Domain.Entities.Catalogos;

namespace Oviq.Domain.Entities;

public class Ticket : BaseEntity
{
    // Visible al usuario, ej. "OVQ-101". Prefijo fijo para todo el sistema (OVQ) +
    // NumeroSecuencial que se reinicia en cada proyecto.
    public string Codigo { get; set; } = string.Empty;
    public int NumeroSecuencial { get; set; }

    public string Titulo { get; set; } = string.Empty;
    public string? Descripcion { get; set; }

    public int ProyectoId { get; set; }
    public Proyecto Proyecto { get; set; } = null!;

    // Referencia a ApplicationUser (ASP.NET Core Identity, vive en Infrastructure).
    // Sin navigation property a propósito: Domain no puede depender de Infrastructure.
    // El join se configura del lado de Infrastructure/Persistence/Configurations.
    // Nullable: "Sin asignar" por defecto.
    public int? UsuarioId { get; set; }

    public int PrioridadId { get; set; }
    public PrioridadTicket Prioridad { get; set; } = null!;

    public int EstadoId { get; set; }
    public EstadoTicket Estado { get; set; } = null!;

    public DateTime? FechaInicio { get; set; }
    public DateTime? FechaFin { get; set; }

    public ICollection<ComentarioTicket> Comentarios { get; set; } = new List<ComentarioTicket>();
}
