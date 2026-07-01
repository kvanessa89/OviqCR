using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Oviq.Application.Proyectos;
using Oviq.Application.Proyectos.Dtos;

namespace Oviq.API.Controllers;

[ApiController]
[Authorize]
public class ProyectoResumenFinancieroController : ControllerBase
{
    private readonly IProyectoResumenFinancieroService _service;

    public ProyectoResumenFinancieroController(IProyectoResumenFinancieroService service)
    {
        _service = service;
    }

    [HttpGet("api/proyectos/{proyectoId}/resumen-financiero")]
    public async Task<IActionResult> Obtener(int proyectoId, CancellationToken ct)
    {
        var resumen = await _service.ObtenerPorProyectoAsync(proyectoId, ct);
        if (resumen is null) return NoContent();
        return Ok(resumen);
    }

    [HttpPut("api/proyectos/{proyectoId}/resumen-financiero")]
    [Authorize(Roles = "Administrador")]
    public async Task<IActionResult> Guardar(int proyectoId, [FromBody] GuardarResumenFinancieroDto dto, CancellationToken ct)
    {
        var resumen = await _service.GuardarAsync(proyectoId, dto, ct);
        return Ok(resumen);
    }

    [HttpPost("api/proyectos/{proyectoId}/registrar-pago-cliente")]
    [Authorize(Roles = "Administrador")]
    public async Task<IActionResult> RegistrarPagoCliente(int proyectoId, [FromBody] RegistrarPagoClienteDto dto, CancellationToken ct)
    {
        await _service.RegistrarPagoClienteAsync(proyectoId, dto, ct);
        return NoContent();
    }
}
