using Oviq.Domain.Common;
using Oviq.Domain.Entities.Catalogos;

namespace Oviq.Domain.Entities;

// Relación 1 a 1 con Proyecto — cada proyecto tiene como máximo una orden de compra.
public class OrdenCompra : BaseEntity
{
    public int ProyectoId { get; set; }
    public Proyecto Proyecto { get; set; } = null!;

    public string? NumeroOc { get; set; }
    public string? AQuienFacturar { get; set; }
    public string? Detalle { get; set; }
    public decimal MontoTotal { get; set; }

    public int MonedaId { get; set; }
    public Moneda Moneda { get; set; } = null!;
}
