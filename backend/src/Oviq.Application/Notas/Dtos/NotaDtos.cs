namespace Oviq.Application.Notas.Dtos;

public class NotaDto
{
    public int Id { get; set; }
    public string Descripcion { get; set; } = string.Empty;
    public bool Completada { get; set; }
    public int? CreadoPorId { get; set; }
    public string CreadoPorNombre { get; set; } = "—";
    public DateTime CreadoEn { get; set; }
}

public class CrearNotaDto
{
    public string Descripcion { get; set; } = string.Empty;
}

public class ActualizarNotaDto
{
    public string Descripcion { get; set; } = string.Empty;
}

public class CambiarEstadoNotaDto
{
    public bool Completada { get; set; }
}
