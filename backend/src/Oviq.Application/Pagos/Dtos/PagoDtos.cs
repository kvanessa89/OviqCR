namespace Oviq.Application.Pagos.Dtos;

public class PagoProyectoDto
{
    public int Id { get; set; }
    public int ProyectoId { get; set; }
    public int? FacturaId { get; set; }
    public decimal Monto { get; set; }
    public DateTime FechaPago { get; set; }
    public DateTime CreadoEn { get; set; }
}

public class CrearPagoProyectoDto
{
    public int? FacturaId { get; set; }
    public decimal Monto { get; set; }
    public DateTime FechaPago { get; set; }
}

public class ActualizarPagoProyectoDto
{
    public int? FacturaId { get; set; }
    public decimal Monto { get; set; }
    public DateTime FechaPago { get; set; }
}
