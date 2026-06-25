namespace Oviq.Application.Proyectos.Dtos;

// ── Lectura ────────────────────────────────────────────────────────────

public class ProyectoDto
{
    public int Id { get; set; }
    public string Nombre { get; set; } = string.Empty;
    public int ClienteId { get; set; }
    public string ClienteNombre { get; set; } = string.Empty;
    public int? SubcuentaId { get; set; }
    public string? SubcuentaNombre { get; set; }
    public string EstadoCodigo { get; set; } = string.Empty;
    public string EstadoNombre { get; set; } = string.Empty;
    public DateTime? FechaInicio { get; set; }
    public DateTime? FechaFin { get; set; }
    public string? Descripcion { get; set; }
    public OrdenCompraDto? OrdenCompra { get; set; }
}

public class OrdenCompraDto
{
    public int Id { get; set; }
    public string? NumeroOc { get; set; }
    public string? AQuienFacturar { get; set; }
    public string? Detalle { get; set; }
    public decimal MontoTotal { get; set; }
    public string MonedaCodigo { get; set; } = string.Empty;
}

// ── Creación ───────────────────────────────────────────────────────────

public class CrearProyectoDto
{
    public string Nombre { get; set; } = string.Empty;
    public int ClienteId { get; set; }
    public int? SubcuentaId { get; set; }
    public int EstadoId { get; set; }
    public DateTime? FechaInicio { get; set; }
    public DateTime? FechaFin { get; set; }
    public string? Descripcion { get; set; }
    public CrearOrdenCompraDto? OrdenCompra { get; set; }
}

public class CrearOrdenCompraDto
{
    public string? NumeroOc { get; set; }
    public string? AQuienFacturar { get; set; }
    public string? Detalle { get; set; }
    public decimal MontoTotal { get; set; }
    public int MonedaId { get; set; }
}

// ── Edición ────────────────────────────────────────────────────────────
// No incluye ClienteId: cambiar el cliente de un proyecto ya creado no tiene
// sentido de negocio (afectaría tickets/facturas históricas). Si hace falta,
// se borra y se crea de nuevo.

public class ActualizarProyectoDto
{
    public string Nombre { get; set; } = string.Empty;
    public int? SubcuentaId { get; set; }
    public int EstadoId { get; set; }
    public DateTime? FechaInicio { get; set; }
    public DateTime? FechaFin { get; set; }
    public string? Descripcion { get; set; }
    public CrearOrdenCompraDto? OrdenCompra { get; set; }
}
