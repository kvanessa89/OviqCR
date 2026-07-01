using Oviq.Domain.Common;
using Oviq.Domain.Entities.Catalogos;

namespace Oviq.Domain.Entities;

public class Factura : BaseEntity
{
    // Número ingresado manualmente por el usuario (viene del sistema externo de facturación)
    public string Numero { get; set; } = string.Empty;

    public int ProyectoId { get; set; }
    public Proyecto Proyecto { get; set; } = null!;

    // Redundante con Proyecto.ClienteId pero necesario para consultas directas — validado en Application
    public int ClienteId { get; set; }
    public Cliente Cliente { get; set; } = null!;

    // Destino de facturación: subcuenta si existe, cliente directo si es null
    public int? SubcuentaId { get; set; }
    public Subcuenta? Subcuenta { get; set; }

    public int MonedaId { get; set; }
    public Moneda Moneda { get; set; } = null!;

    public decimal Monto { get; set; }
    public bool SinIva { get; set; }
    public DateTime FechaEmision { get; set; }

    // Fecha acordada con el cliente para recibir el pago — base para calcular "vencida"
    public DateTime FechaEstimadaPago { get; set; }

    public int EstadoId { get; set; }
    public EstadoFactura Estado { get; set; } = null!;

    // Se auto-asigna cuando el estado pasa a "pagada"
    public DateTime? FechaPago { get; set; }

    public string? Notas { get; set; }

    // Ruta del PDF guardado en wwwroot/facturas/ — null si no se subió archivo
    public string? ArchivoUrl { get; set; }

    public ICollection<PagoProyecto> Pagos { get; set; } = new List<PagoProyecto>();
}
