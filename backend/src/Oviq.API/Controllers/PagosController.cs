using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Oviq.Application.Pagos;
using Oviq.Application.Pagos.Dtos;

namespace Oviq.API.Controllers;

[ApiController]
[Authorize]
public class PagosController : ControllerBase
{
    private readonly IPagoProyectoService _service;

    public PagosController(IPagoProyectoService service)
    {
        _service = service;
    }

    [HttpGet("api/proyectos/{proyectoId}/pagos")]
    public async Task<IActionResult> ObtenerPorProyecto(int proyectoId, CancellationToken ct)
    {
        var pagos = await _service.ObtenerPorProyectoAsync(proyectoId, ct);
        return Ok(pagos);
    }

    [HttpPost("api/proyectos/{proyectoId}/pagos")]
    [Authorize(Roles = "Administrador")]
    public async Task<IActionResult> Crear(int proyectoId, [FromBody] CrearPagoProyectoDto dto, CancellationToken ct)
    {
        var pago = await _service.CrearAsync(proyectoId, dto, ct);
        return Created(string.Empty, pago);
    }

    [HttpPut("api/pagos/{id}")]
    [Authorize(Roles = "Administrador")]
    public async Task<IActionResult> Actualizar(int id, [FromBody] ActualizarPagoProyectoDto dto, CancellationToken ct)
    {
        await _service.ActualizarAsync(id, dto, ct);
        return NoContent();
    }

    [HttpDelete("api/pagos/{id}")]
    [Authorize(Roles = "Administrador")]
    public async Task<IActionResult> Eliminar(int id, CancellationToken ct)
    {
        await _service.EliminarAsync(id, ct);
        return NoContent();
    }
}
