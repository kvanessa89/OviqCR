namespace Oviq.Application.Usuarios.Dtos;

public class UsuarioDto
{
    public int Id { get; set; }
    public string Nombre { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string Rol { get; set; } = string.Empty;
    public PerfilTrabajadorDto? PerfilTrabajador { get; set; }
}

public class PerfilTrabajadorDto
{
    public int Id { get; set; }
    public string FormaPagoCodigo { get; set; } = string.Empty;
    public string FormaPagoNombre { get; set; } = string.Empty;
    public decimal? TarifaHora { get; set; }
    public decimal? MontoContrato { get; set; }
}

public class CrearUsuarioDto
{
    public string Nombre { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string Password { get; set; } = string.Empty;
    public string Rol { get; set; } = string.Empty; // "Administrador" o "Trabajador"

    // Requerido si Rol = "Trabajador", debe ser null si Rol = "Administrador"
    // (ver CrearUsuarioValidator).
    public CrearPerfilTrabajadorDto? PerfilTrabajador { get; set; }
}

public class CrearPerfilTrabajadorDto
{
    public int FormaPagoId { get; set; }

    // Mutuamente excluyentes según FormaPago.Codigo — validado en CrearUsuarioValidator
    // (regla de negocio #9 del modelo de datos).
    public decimal? TarifaHora { get; set; }
    public decimal? MontoContrato { get; set; }
}

// No incluye Email/Password/Rol — cambiar credenciales o rol de un usuario
// existente necesita su propio flujo, fuera de alcance por ahora.
public class ActualizarUsuarioDto
{
    public string Nombre { get; set; } = string.Empty;
    public CrearPerfilTrabajadorDto? PerfilTrabajador { get; set; }
}
