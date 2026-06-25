using FluentValidation;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Oviq.Application.Usuarios;
using Oviq.Application.Usuarios.Dtos;

namespace Oviq.API.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize(Roles = "Administrador")] // solo el Administrador gestiona usuarios
public class UsuariosController : ControllerBase
{
    private readonly IUsuarioService _usuarioService;
    private readonly IValidator<CrearUsuarioDto> _crearValidator;
    private readonly IValidator<ActualizarUsuarioDto> _actualizarValidator;

    public UsuariosController(
        IUsuarioService usuarioService,
        IValidator<CrearUsuarioDto> crearValidator,
        IValidator<ActualizarUsuarioDto> actualizarValidator)
    {
        _usuarioService = usuarioService;
        _crearValidator = crearValidator;
        _actualizarValidator = actualizarValidator;
    }

    [HttpGet]
    public async Task<ActionResult<List<UsuarioDto>>> ObtenerTodos(CancellationToken cancellationToken)
    {
        return Ok(await _usuarioService.ObtenerTodosAsync(cancellationToken));
    }

    [HttpGet("{id}")]
    public async Task<ActionResult<UsuarioDto>> ObtenerPorId(int id, CancellationToken cancellationToken)
    {
        var usuario = await _usuarioService.ObtenerPorIdAsync(id, cancellationToken);
        return usuario is null ? NotFound() : Ok(usuario);
    }

    [HttpPost]
    public async Task<ActionResult<UsuarioDto>> Crear(CrearUsuarioDto dto, CancellationToken cancellationToken)
    {
        await _crearValidator.ValidateAndThrowAsync(dto, cancellationToken);
        var usuario = await _usuarioService.CrearAsync(dto, cancellationToken);
        return CreatedAtAction(nameof(ObtenerPorId), new { id = usuario.Id }, usuario);
    }

    [HttpPut("{id}")]
    public async Task<IActionResult> Actualizar(int id, ActualizarUsuarioDto dto, CancellationToken cancellationToken)
    {
        await _actualizarValidator.ValidateAndThrowAsync(dto, cancellationToken);
        await _usuarioService.ActualizarAsync(id, dto, cancellationToken);
        return NoContent();
    }

    // Endpoint útil para que el Trabajador vea/edite su propia info sin
    // necesitar conocer su Id — lo saca del JWT vía ICurrentUserService.
    [HttpGet("me")]
    [Authorize] // cualquier rol puede ver su propio perfil
    public async Task<ActionResult<UsuarioDto>> ObtenerPerfil(
        [FromServices] Oviq.Application.Common.Interfaces.ICurrentUserService currentUser,
        CancellationToken cancellationToken)
    {
        if (currentUser.UsuarioId is null) return Unauthorized();
        var usuario = await _usuarioService.ObtenerPorIdAsync(currentUser.UsuarioId.Value, cancellationToken);
        return usuario is null ? NotFound() : Ok(usuario);
    }
}
