using FluentValidation;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Oviq.Application.Facturas;
using Oviq.Application.Facturas.Dtos;

namespace Oviq.API.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class FacturasController : ControllerBase
{
    private readonly IFacturaService _facturaService;
    private readonly IValidator<CrearFacturaDto> _crearValidator;
    private readonly IValidator<ActualizarFacturaDto> _actualizarValidator;

    public FacturasController(
        IFacturaService facturaService,
        IValidator<CrearFacturaDto> crearValidator,
        IValidator<ActualizarFacturaDto> actualizarValidator)
    {
        _facturaService     = facturaService;
        _crearValidator     = crearValidator;
        _actualizarValidator = actualizarValidator;
    }

    [HttpGet]
    public async Task<ActionResult<List<FacturaDto>>> ObtenerTodas(CancellationToken cancellationToken)
        => Ok(await _facturaService.ObtenerTodasAsync(cancellationToken));

    [HttpGet("proyecto/{proyectoId}")]
    public async Task<ActionResult<List<FacturaDto>>> ObtenerPorProyecto(int proyectoId, CancellationToken cancellationToken)
        => Ok(await _facturaService.ObtenerPorProyectoAsync(proyectoId, cancellationToken));

    [HttpGet("{id}")]
    public async Task<ActionResult<FacturaDto>> ObtenerPorId(int id, CancellationToken cancellationToken)
    {
        var factura = await _facturaService.ObtenerPorIdAsync(id, cancellationToken);
        return factura is null ? NotFound() : Ok(factura);
    }

    [HttpPost]
    [Authorize(Roles = "Administrador")]
    public async Task<ActionResult<FacturaDto>> Crear(CrearFacturaDto dto, CancellationToken cancellationToken)
    {
        await _crearValidator.ValidateAndThrowAsync(dto, cancellationToken);
        var factura = await _facturaService.CrearAsync(dto, cancellationToken);
        return CreatedAtAction(nameof(ObtenerPorId), new { id = factura.Id }, factura);
    }

    [HttpPut("{id}")]
    [Authorize(Roles = "Administrador")]
    public async Task<IActionResult> Actualizar(int id, ActualizarFacturaDto dto, CancellationToken cancellationToken)
    {
        await _actualizarValidator.ValidateAndThrowAsync(dto, cancellationToken);
        await _facturaService.ActualizarAsync(id, dto, cancellationToken);
        return NoContent();
    }

    [HttpPost("{id}/archivo")]
    [Authorize(Roles = "Administrador")]
    public async Task<ActionResult<string>> SubirArchivo(int id, IFormFile archivo, CancellationToken cancellationToken)
    {
        if (archivo is null || archivo.Length == 0)
            return BadRequest(new { mensaje = "Debés adjuntar un archivo" });

        var ext = Path.GetExtension(archivo.FileName).ToLower();
        if (!new[] { ".pdf", ".jpg", ".jpeg", ".png" }.Contains(ext))
            return BadRequest(new { mensaje = "Solo se permiten archivos PDF, JPG o PNG" });

        if (archivo.Length > 10 * 1024 * 1024)
            return BadRequest(new { mensaje = "El archivo no puede superar los 10 MB" });

        var url = await _facturaService.SubirArchivoAsync(id, archivo.OpenReadStream(), archivo.FileName, cancellationToken);
        return Ok(new { url });
    }

    [HttpDelete("{id}")]
    [Authorize(Roles = "Administrador")]
    public async Task<IActionResult> Eliminar(int id, CancellationToken cancellationToken)
    {
        await _facturaService.EliminarAsync(id, cancellationToken);
        return NoContent();
    }
}
