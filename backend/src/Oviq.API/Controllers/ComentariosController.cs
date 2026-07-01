using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Oviq.Application.Comentarios;
using Oviq.Application.Comentarios.Dtos;
using Oviq.Application.Common.Interfaces;

namespace Oviq.API.Controllers;

[ApiController]
[Authorize]
public class ComentariosController : ControllerBase
{
    private readonly IComentarioProyectoService _comentarioProyecto;
    private readonly IComentarioTicketService _comentarioTicket;
    private readonly ICurrentUserService _currentUser;

    public ComentariosController(
        IComentarioProyectoService comentarioProyecto,
        IComentarioTicketService comentarioTicket,
        ICurrentUserService currentUser)
    {
        _comentarioProyecto = comentarioProyecto;
        _comentarioTicket   = comentarioTicket;
        _currentUser        = currentUser;
    }

    // ── Proyecto ──────────────────────────────────────────────────────

    [HttpGet("api/proyectos/{proyectoId}/comentarios")]
    public async Task<ActionResult<List<ComentarioDto>>> ObtenerPorProyecto(
        int proyectoId, CancellationToken cancellationToken)
    {
        return Ok(await _comentarioProyecto.ObtenerPorProyectoAsync(proyectoId, cancellationToken));
    }

    [HttpPost("api/proyectos/{proyectoId}/comentarios")]
    public async Task<ActionResult<ComentarioDto>> CrearEnProyecto(
        int proyectoId, CrearComentarioDto dto, CancellationToken cancellationToken)
    {
        var usuarioId = _currentUser.UsuarioId
            ?? throw new UnauthorizedAccessException("No se pudo obtener el usuario actual");

        var comentario = await _comentarioProyecto.CrearAsync(proyectoId, usuarioId, dto, cancellationToken);
        return Ok(comentario);
    }

    // ── Ticket ────────────────────────────────────────────────────────

    [HttpGet("api/tickets/{ticketId}/comentarios")]
    public async Task<ActionResult<List<ComentarioDto>>> ObtenerPorTicket(
        int ticketId, CancellationToken cancellationToken)
    {
        return Ok(await _comentarioTicket.ObtenerPorTicketAsync(ticketId, cancellationToken));
    }

    [HttpPost("api/tickets/{ticketId}/comentarios")]
    public async Task<ActionResult<ComentarioDto>> CrearEnTicket(
        int ticketId, CrearComentarioDto dto, CancellationToken cancellationToken)
    {
        var usuarioId = _currentUser.UsuarioId
            ?? throw new UnauthorizedAccessException("No se pudo obtener el usuario actual");

        var comentario = await _comentarioTicket.CrearAsync(ticketId, usuarioId, dto, cancellationToken);
        return Ok(comentario);
    }
}
