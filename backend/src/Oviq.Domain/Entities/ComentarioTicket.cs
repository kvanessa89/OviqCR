using Oviq.Domain.Common;

namespace Oviq.Domain.Entities;

public class ComentarioTicket : BaseEntity
{
    public int TicketId { get; set; }
    public Ticket Ticket { get; set; } = null!;

    // Sin navigation property hacia ApplicationUser — mismo motivo que en Ticket.
    public int UsuarioId { get; set; }

    public string Texto { get; set; } = string.Empty;
}