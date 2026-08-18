using FluentValidation;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Oviq.Application.Common.Interfaces;
using Oviq.Application.Tickets;
using Oviq.Application.Tickets.Dtos;

namespace Oviq.API.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize] // Administrador y Trabajador pueden crear/editar tickets — ambos se asignan
public class TicketsController : ControllerBase
{
    private readonly ITicketService _ticketService;
    private readonly ICurrentUserService _currentUser;
    private readonly IValidator<CrearTicketDto> _crearValidator;
    private readonly IValidator<ActualizarTicketDto> _actualizarValidator;

    public TicketsController(
        ITicketService ticketService,
        ICurrentUserService currentUser,
        IValidator<CrearTicketDto> crearValidator,
        IValidator<ActualizarTicketDto> actualizarValidator)
    {
        _ticketService = ticketService;
        _currentUser = currentUser;
        _crearValidator = crearValidator;
        _actualizarValidator = actualizarValidator;
    }

    // Un Trabajador ve todos los tickets de los proyectos donde tiene al menos
    // un ticket asignado (no solo los suyos) — tablero, listado y calendario
    // comparten este endpoint. Un Administrador ve todos.
    private int? UsuarioIdFiltro => User.IsInRole("Trabajador") ? _currentUser.UsuarioId : null;

    [HttpGet]
    public async Task<ActionResult<List<TicketDto>>> ObtenerTodos(CancellationToken cancellationToken)
    {
        return Ok(await _ticketService.ObtenerTodosAsync(UsuarioIdFiltro, cancellationToken));
    }

    [HttpGet("proyecto/{proyectoId}")]
    public async Task<ActionResult<List<TicketDto>>> ObtenerPorProyecto(int proyectoId, CancellationToken cancellationToken)
    {
        return Ok(await _ticketService.ObtenerPorProyectoAsync(proyectoId, UsuarioIdFiltro, cancellationToken));
    }

    [HttpGet("{id}")]
    public async Task<ActionResult<TicketDto>> ObtenerPorId(int id, CancellationToken cancellationToken)
    {
        var ticket = await _ticketService.ObtenerPorIdAsync(id, cancellationToken);
        if (ticket is null) return NotFound();

        if (User.IsInRole("Trabajador"))
        {
            var usuarioId = _currentUser.UsuarioId;
            if (usuarioId is null || !await _ticketService.TieneAccesoAlProyectoAsync(usuarioId.Value, ticket.ProyectoId, cancellationToken))
                return NotFound();
        }

        return Ok(ticket);
    }

    [HttpPost]
    public async Task<ActionResult<TicketDto>> Crear(CrearTicketDto dto, CancellationToken cancellationToken)
    {
        await _crearValidator.ValidateAndThrowAsync(dto, cancellationToken);
        var ticket = await _ticketService.CrearAsync(dto, cancellationToken);
        return CreatedAtAction(nameof(ObtenerPorId), new { id = ticket.Id }, ticket);
    }

    [HttpPut("{id}")]
    public async Task<IActionResult> Actualizar(int id, ActualizarTicketDto dto, CancellationToken cancellationToken)
    {
        await _actualizarValidator.ValidateAndThrowAsync(dto, cancellationToken);
        await _ticketService.ActualizarAsync(id, dto, cancellationToken);
        return NoContent();
    }

    [HttpPatch("{id}/estado")]
    public async Task<IActionResult> CambiarEstado(int id, [FromBody] CambiarEstadoTicketDto dto, CancellationToken cancellationToken)
    {
        await _ticketService.CambiarEstadoAsync(id, dto.EstadoId, cancellationToken);
        return NoContent();
    }

    [HttpDelete("{id}")]
    [Authorize(Roles = "Administrador")]
    public async Task<IActionResult> Eliminar(int id, CancellationToken cancellationToken)
    {
        await _ticketService.EliminarAsync(id, cancellationToken);
        return NoContent();
    }
}
