namespace Oviq.Application.Proyectos.Dtos;

public class ProyectoResumenFinancieroDto
{
    public int Id { get; set; }
    public int ProyectoId { get; set; }
    public decimal TotalFacturado { get; set; }
    public decimal TotalCostos { get; set; }
    public decimal UtilidadNeta { get; set; }
    public decimal TotalPagado { get; set; }
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

public class ResumenMensualDto
{
    public decimal ProyectosFacturados { get; set; }
    public int CantidadFacturasEmitidas { get; set; }
    public decimal ProyectosSinFactura { get; set; }
    public int CantidadProyectosSinFactura { get; set; }
    public decimal Pagado { get; set; }
    public decimal PendienteDeCobro { get; set; }
    public decimal Iva { get; set; }
    public decimal GastosProyectos { get; set; }
    public decimal Ganancia { get; set; }
}
