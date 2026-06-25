using FluentValidation;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Oviq.Application.Catalogos;
using Oviq.Application.Catalogos.Dtos;
using Oviq.Domain.Common;

namespace Oviq.API.Controllers;

[ApiController]
[Authorize]
public abstract class CatalogoControllerBase<T> : ControllerBase where T : CatalogoBase, IOrdenable, new()
{
    private readonly ICatalogoService<T> _service;
    private readonly IValidator<CrearCatalogoDto> _crearValidator;
    private readonly IValidator<ActualizarCatalogoDto> _actualizarValidator;

    protected CatalogoControllerBase(
        ICatalogoService<T> service,
        IValidator<CrearCatalogoDto> crearValidator,
        IValidator<ActualizarCatalogoDto> actualizarValidator)
    {
        _service = service;
        _crearValidator = crearValidator;
        _actualizarValidator = actualizarValidator;
    }

    // Lectura abierta a cualquier rol autenticado — ambos roles llenan dropdowns con esto
    [HttpGet]
    public async Task<ActionResult<List<CatalogoDto>>> ObtenerActivos(CancellationToken cancellationToken)
    {
        return Ok(await _service.ObtenerActivosAsync(cancellationToken));
    }

    [HttpPost]
    [Authorize(Roles = "Administrador")]
    public async Task<ActionResult<CatalogoDto>> Crear(CrearCatalogoDto dto, CancellationToken cancellationToken)
    {
        await _crearValidator.ValidateAndThrowAsync(dto, cancellationToken);
        return Ok(await _service.CrearAsync(dto, cancellationToken));
    }

    [HttpPut("{id}")]
    [Authorize(Roles = "Administrador")]
    public async Task<IActionResult> Actualizar(int id, ActualizarCatalogoDto dto, CancellationToken cancellationToken)
    {
        await _actualizarValidator.ValidateAndThrowAsync(dto, cancellationToken);
        await _service.ActualizarAsync(id, dto, cancellationToken);
        return NoContent();
    }

    // Desactivar, no eliminar — preserva integridad de datos históricos (ver CatalogoBase)
    [HttpDelete("{id}")]
    [Authorize(Roles = "Administrador")]
    public async Task<IActionResult> Desactivar(int id, CancellationToken cancellationToken)
    {
        await _service.DesactivarAsync(id, cancellationToken);
        return NoContent();
    }
}
