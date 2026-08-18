using FluentValidation;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Oviq.Application.Notas;
using Oviq.Application.Notas.Dtos;

namespace Oviq.API.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize(Roles = "Administrador")] // notas visibles y gestionables solo por Administradores
public class NotasController : ControllerBase
{
    private readonly INotaService _notaService;
    private readonly IValidator<CrearNotaDto> _crearValidator;
    private readonly IValidator<ActualizarNotaDto> _actualizarValidator;

    public NotasController(
        INotaService notaService,
        IValidator<CrearNotaDto> crearValidator,
        IValidator<ActualizarNotaDto> actualizarValidator)
    {
        _notaService = notaService;
        _crearValidator = crearValidator;
        _actualizarValidator = actualizarValidator;
    }

    [HttpGet]
    public async Task<ActionResult<List<NotaDto>>> ObtenerTodas(CancellationToken cancellationToken)
    {
        return Ok(await _notaService.ObtenerTodasAsync(cancellationToken));
    }

    [HttpPost]
    public async Task<ActionResult<NotaDto>> Crear(CrearNotaDto dto, CancellationToken cancellationToken)
    {
        await _crearValidator.ValidateAndThrowAsync(dto, cancellationToken);
        var nota = await _notaService.CrearAsync(dto, cancellationToken);
        return Ok(nota);
    }

    [HttpPut("{id}")]
    public async Task<IActionResult> Actualizar(int id, ActualizarNotaDto dto, CancellationToken cancellationToken)
    {
        await _actualizarValidator.ValidateAndThrowAsync(dto, cancellationToken);
        await _notaService.ActualizarAsync(id, dto, cancellationToken);
        return NoContent();
    }

    [HttpPatch("{id}/estado")]
    public async Task<IActionResult> CambiarEstado(int id, [FromBody] CambiarEstadoNotaDto dto, CancellationToken cancellationToken)
    {
        await _notaService.CambiarEstadoAsync(id, dto.Completada, cancellationToken);
        return NoContent();
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> Eliminar(int id, CancellationToken cancellationToken)
    {
        await _notaService.EliminarAsync(id, cancellationToken);
        return NoContent();
    }
}
