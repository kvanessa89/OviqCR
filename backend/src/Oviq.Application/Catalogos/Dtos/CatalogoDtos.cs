namespace Oviq.Application.Catalogos.Dtos;

public class CatalogoDto
{
    public int Id { get; set; }
    public string Codigo { get; set; } = string.Empty;
    public string Nombre { get; set; } = string.Empty;
    public bool Activo { get; set; }
    public int Orden { get; set; }
}

public class CrearCatalogoDto
{
    public string Codigo { get; set; } = string.Empty;
    public string Nombre { get; set; } = string.Empty;
    public int Orden { get; set; }
}

// Codigo NO está acá a propósito: es inmutable una vez creado
// (ver regla de negocio #7 del modelo de datos).
public class ActualizarCatalogoDto
{
    public string Nombre { get; set; } = string.Empty;
    public int Orden { get; set; }
    public bool Activo { get; set; } = true;
}
