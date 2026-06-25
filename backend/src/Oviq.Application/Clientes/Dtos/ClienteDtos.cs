namespace Oviq.Application.Clientes.Dtos;

// ── Lectura — lo que devuelve la API ──────────────────────────────────────

public class ClienteDto
{
    public int Id { get; set; }
    public string Nombre { get; set; } = string.Empty;
    public string EstadoCodigo { get; set; } = string.Empty;
    public string EstadoNombre { get; set; } = string.Empty;
    public string? Contacto { get; set; }
    public string? Email { get; set; }
    public string? Telefono { get; set; }
    public string? Descripcion { get; set; }
    public List<ClasificacionDto> Clasificaciones { get; set; } = new();
    public List<SubcuentaDto> Subcuentas { get; set; } = new();
}

public class ClasificacionDto
{
    public int Id { get; set; }
    public string Nombre { get; set; } = string.Empty;
}

public class SubcuentaDto
{
    public int Id { get; set; }
    public string Nombre { get; set; } = string.Empty;
    public int? ClasificacionId { get; set; }
    public string? ClasificacionNombre { get; set; }
}

// ── Creación — espeja el formulario "Nuevo cliente" ───────────────────────

public class CrearClienteDto
{
    public string Nombre { get; set; } = string.Empty;
    public int EstadoId { get; set; }
    public string? Contacto { get; set; }
    public string? Email { get; set; }
    public string? Telefono { get; set; }
    public string? Descripcion { get; set; }
    public List<CrearClasificacionDto> Clasificaciones { get; set; } = new();
    public List<CrearSubcuentaDto> Subcuentas { get; set; } = new();
}

public class CrearClasificacionDto
{
    // Id temporal generado en el frontend (ej. un GUID corto). Solo existe para
    // que CrearSubcuentaDto pueda referenciar una clasificación que todavía no
    // tiene Id real — se resuelve en ClienteService.CrearAsync.
    public string TempId { get; set; } = string.Empty;
    public string Nombre { get; set; } = string.Empty;
}

public class CrearSubcuentaDto
{
    public string Nombre { get; set; } = string.Empty;
    public string? ClasificacionTempId { get; set; }
}

// ── Edición — solo campos propios del Cliente ─────────────────────────────
// Clasificaciones y Subcuentas se editan con sus propios endpoints, no acá.

public class ActualizarClienteDto
{
    public string Nombre { get; set; } = string.Empty;
    public int EstadoId { get; set; }
    public string? Contacto { get; set; }
    public string? Email { get; set; }
    public string? Telefono { get; set; }
    public string? Descripcion { get; set; }
}
