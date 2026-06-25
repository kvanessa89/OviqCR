namespace Oviq.Application.Comentarios.Dtos;

public class ComentarioDto
{
    public int Id { get; set; }
    public string Texto { get; set; } = string.Empty;
    public int UsuarioId { get; set; }
    public string UsuarioNombre { get; set; } = string.Empty;

    // CreadoEn viene de BaseEntity — acá lo exponemos como campo de lectura
    public DateTime CreadoEn { get; set; }
}

public class CrearComentarioDto
{
    public string Texto { get; set; } = string.Empty;
}