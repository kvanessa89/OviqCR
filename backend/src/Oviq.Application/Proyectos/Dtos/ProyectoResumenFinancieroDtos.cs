namespace Oviq.Application.Proyectos.Dtos;

public class ProyectoResumenFinancieroDto
{
    public int Id { get; set; }
    public int ProyectoId { get; set; }
    public decimal TotalFacturado { get; set; }
    public decimal TotalCostos { get; set; }
    public decimal UtilidadNeta { get; set; }
}

public class GuardarResumenFinancieroDto
{
    public decimal TotalFacturado { get; set; }
    public decimal TotalCostos { get; set; }
    public decimal UtilidadNeta { get; set; }
}

public class RegistrarPagoClienteDto
{
    public decimal Monto { get; set; }
}
