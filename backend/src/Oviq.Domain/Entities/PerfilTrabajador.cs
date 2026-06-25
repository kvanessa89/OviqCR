using Oviq.Domain.Common;
using Oviq.Domain.Entities.Catalogos;

namespace Oviq.Domain.Entities;

// Relación 1 a 1 con ApplicationUser. Solo existe el registro si el usuario tiene rol Trabajador.
public class PerfilTrabajador : BaseEntity
{
    // Referencia a ApplicationUser (Infrastructure) — sin navigation property, mismo motivo que en Ticket.
    public int UsuarioId { get; set; }

    public int FormaPagoId { get; set; }
    public FormaPago FormaPago { get; set; } = null!;

    // Mutuamente excluyentes según FormaPago.Codigo ("horas" / "contrato").
    // Se valida en la capa Application, no acá.
    public decimal? TarifaHora { get; set; }
    public decimal? MontoContrato { get; set; }
}
