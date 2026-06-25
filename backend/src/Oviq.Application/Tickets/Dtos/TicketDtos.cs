namespace Oviq.Application.Tickets.Dtos;

public class TicketDto
{
    public int Id { get; set; }
    public string Codigo { get; set; } = string.Empty;
    public string Titulo { get; set; } = string.Empty;
    public string? Descripcion { get; set; }
    public int ProyectoId { get; set; }
    public string ProyectoNombre { get; set; } = string.Empty;
    public int? UsuarioId { get; set; }
    public string UsuarioNombre { get; set; } = "Sin asignar";
    public string PrioridadCodigo { get; set; } = string.Empty;
    public string PrioridadNombre { get; set; } = string.Empty;
    public string EstadoCodigo { get; set; } = string.Empty;
    public string EstadoNombre { get; set; } = string.Empty;
    public DateTime? FechaInicio { get; set; }
    public DateTime? FechaFin { get; set; }
}

// Codigo y NumeroSecuencial NO están acá — los calcula TicketService.CrearAsync
public class CrearTicketDto
{
    public string Titulo { get; set; } = string.Empty;
    public string? Descripcion { get; set; }
    public int ProyectoId { get; set; }
    public int? UsuarioId { get; set; }
    public int PrioridadId { get; set; }
    public int EstadoId { get; set; }
    public DateTime? FechaInicio { get; set; }
    public DateTime? FechaFin { get; set; }
}

// No incluye ProyectoId: un ticket no cambia de proyecto una vez creado
// (rompería la secuencia de Codigo, que se reinicia por proyecto).
public class ActualizarTicketDto
{
    public string Titulo { get; set; } = string.Empty;
    public string? Descripcion { get; set; }
    public int? UsuarioId { get; set; }
    public int PrioridadId { get; set; }
    public int EstadoId { get; set; }
    public DateTime? FechaInicio { get; set; }
    public DateTime? FechaFin { get; set; }
}
