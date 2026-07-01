namespace Oviq.Application.Gastos.Dtos;

public class GastoDto
{
    public int Id { get; set; }
    public int ProyectoId { get; set; }
    public string Rubro { get; set; } = string.Empty;
    public decimal Monto { get; set; }
    public DateTime CreadoEn { get; set; }
}

public class CrearGastoDto
{
    public string Rubro { get; set; } = string.Empty;
    public decimal Monto { get; set; }
}

public class ActualizarGastoDto
{
    public string Rubro { get; set; } = string.Empty;
    public decimal Monto { get; set; }
}
