using FluentValidation;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Oviq.Application.Proyectos;
using Oviq.Application.Proyectos.Dtos;

namespace Oviq.API.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class ProyectosController : ControllerBase
{
    private readonly IProyectoService _proyectoService;
    private readonly IValidator<CrearProyectoDto> _crearValidator;
    private readonly IValidator<ActualizarProyectoDto> _actualizarValidator;

    public ProyectosController(
        IProyectoService proyectoService,
        IValidator<CrearProyectoDto> crearValidator,
        IValidator<ActualizarProyectoDto> actualizarValidator)
    {
        _proyectoService = proyectoService;
        _crearValidator = crearValidator;
        _actualizarValidator = actualizarValidator;
    }

    [HttpGet]
    public async Task<ActionResult<List<ProyectoDto>>> ObtenerTodos(CancellationToken cancellationToken)
    {
        return Ok(await _proyectoService.ObtenerTodosAsync(cancellationToken));
    }

    [HttpGet("{id}")]
    public async Task<ActionResult<ProyectoDto>> ObtenerPorId(int id, CancellationToken cancellationToken)
    {
        var proyecto = await _proyectoService.ObtenerPorIdAsync(id, cancellationToken);
        return proyecto is null ? NotFound() : Ok(proyecto);
    }

    [HttpPost]
    [Authorize(Roles = "Administrador")]
    public async Task<ActionResult<ProyectoDto>> Crear(CrearProyectoDto dto, CancellationToken cancellationToken)
    {
        await _crearValidator.ValidateAndThrowAsync(dto, cancellationToken);
        var proyecto = await _proyectoService.CrearAsync(dto, cancellationToken);
        return CreatedAtAction(nameof(ObtenerPorId), new { id = proyecto.Id }, proyecto);
    }

    [HttpPut("{id}")]
    [Authorize(Roles = "Administrador")]
    public async Task<IActionResult> Actualizar(int id, ActualizarProyectoDto dto, CancellationToken cancellationToken)
    {
        await _actualizarValidator.ValidateAndThrowAsync(dto, cancellationToken);
        await _proyectoService.ActualizarAsync(id, dto, cancellationToken);
        return NoContent();
    }

    // Botón "Marcar finalizado" del mockup: en_curso -> completado
    [HttpPost("{id}/marcar-completado")]
    [Authorize(Roles = "Administrador")]
    public async Task<IActionResult> MarcarCompletado(int id, CancellationToken cancellationToken)
    {
        await _proyectoService.MarcarCompletadoAsync(id, cancellationToken);
        return NoContent();
    }
}
