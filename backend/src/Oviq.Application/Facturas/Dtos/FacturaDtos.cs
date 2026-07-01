namespace Oviq.Application.Facturas.Dtos;

public class FacturaDto
{
    public int Id { get; set; }
    public string Numero { get; set; } = string.Empty;
    public int ProyectoId { get; set; }
    public string ProyectoNombre { get; set; } = string.Empty;
    public int ClienteId { get; set; }
    public string ClienteNombre { get; set; } = string.Empty;
    public int? SubcuentaId { get; set; }
    public string? SubcuentaNombre { get; set; }
    public int MonedaId { get; set; }
    public string MonedaCodigo { get; set; } = string.Empty;
    public string MonedaNombre { get; set; } = string.Empty;
    public decimal Monto { get; set; }
    public bool SinIva { get; set; }
    public DateTime FechaEmision { get; set; }
    public DateTime FechaEstimadaPago { get; set; }
    public string EstadoCodigo { get; set; } = string.Empty;
    public string EstadoNombre { get; set; } = string.Empty;
    public bool EstaVencida { get; set; }
    public DateTime? FechaPago { get; set; }
    public string? Notas { get; set; }
    public string? ArchivoUrl { get; set; }
}

public class CrearFacturaDto
{
    public string Numero { get; set; } = string.Empty;
    public int ProyectoId { get; set; }
    public int? SubcuentaId { get; set; }
    public int MonedaId { get; set; }
    public decimal Monto { get; set; }
    public bool SinIva { get; set; }
    public DateTime FechaEmision { get; set; }
    public DateTime FechaEstimadaPago { get; set; }
    public int EstadoId { get; set; }
    public string? Notas { get; set; }
}

public class ActualizarFacturaDto
{
    public string Numero { get; set; } = string.Empty;
    public int ProyectoId { get; set; }
    public int? SubcuentaId { get; set; }
    public int MonedaId { get; set; }
    public decimal Monto { get; set; }
    public bool SinIva { get; set; }
    public DateTime FechaEmision { get; set; }
    public DateTime FechaEstimadaPago { get; set; }
    public int EstadoId { get; set; }
    public string? Notas { get; set; }
}
