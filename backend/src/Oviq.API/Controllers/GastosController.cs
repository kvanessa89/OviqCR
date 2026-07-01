using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Oviq.Application.Gastos;
using Oviq.Application.Gastos.Dtos;

namespace Oviq.API.Controllers;

[ApiController]
[Authorize]
public class GastosController : ControllerBase
{
    private readonly IGastoProyectoService _gastoService;

    public GastosController(IGastoProyectoService gastoService)
    {
        _gastoService = gastoService;
    }

    [HttpGet("api/proyectos/{proyectoId}/gastos")]
    public async Task<ActionResult<List<GastoDto>>> ObtenerPorProyecto(
        int proyectoId, CancellationToken cancellationToken)
    {
        return Ok(await _gastoService.ObtenerPorProyectoAsync(proyectoId, cancellationToken));
    }

    [HttpPost("api/proyectos/{proyectoId}/gastos")]
    [Authorize(Roles = "Administrador")]
    public async Task<ActionResult<GastoDto>> Crear(
        int proyectoId, CrearGastoDto dto, CancellationToken cancellationToken)
    {
        var gasto = await _gastoService.CrearAsync(proyectoId, dto, cancellationToken);
        return Ok(gasto);
    }

    [HttpPut("api/gastos/{id}")]
    [Authorize(Roles = "Administrador")]
    public async Task<IActionResult> Actualizar(
        int id, ActualizarGastoDto dto, CancellationToken cancellationToken)
    {
        await _gastoService.ActualizarAsync(id, dto, cancellationToken);
        return NoContent();
    }

    [HttpDelete("api/gastos/{id}")]
    [Authorize(Roles = "Administrador")]
    public async Task<IActionResult> Eliminar(int id, CancellationToken cancellationToken)
    {
        await _gastoService.EliminarAsync(id, cancellationToken);
        return NoContent();
    }
}
