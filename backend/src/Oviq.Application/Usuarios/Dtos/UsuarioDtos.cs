namespace Oviq.Application.Usuarios.Dtos;

public class UsuarioDto
{
    public int Id { get; set; }
    public string Nombre { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string Rol { get; set; } = string.Empty;
    public bool Activo { get; set; }
    public PerfilTrabajadorDto? PerfilTrabajador { get; set; }
}

public class PerfilTrabajadorDto
{
    public int Id { get; set; }
    public int FormaPagoId { get; set; }
    public string FormaPagoCodigo { get; set; } = string.Empty;
    public string FormaPagoNombre { get; set; } = string.Empty;
    public string Cargo { get; set; } = string.Empty;
    public string? EmailContacto { get; set; }
    public string? Telefono { get; set; }
}

public class CrearUsuarioDto
{
    public string Nombre { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string Password { get; set; } = string.Empty;
    public string Rol { get; set; } = string.Empty;
    public bool Activo { get; set; } = true;
    public CrearPerfilTrabajadorDto? PerfilTrabajador { get; set; }
}

public class CrearPerfilTrabajadorDto
{
    public int FormaPagoId { get; set; }
    public string Cargo { get; set; } = string.Empty;
    public string? EmailContacto { get; set; }
    public string? Telefono { get; set; }
}

public class ActualizarUsuarioDto
{
    public string Nombre { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string Rol { get; set; } = string.Empty;
    public bool Activo { get; set; } = true;
    public string? Password { get; set; }
    public CrearPerfilTrabajadorDto? PerfilTrabajador { get; set; }
}
