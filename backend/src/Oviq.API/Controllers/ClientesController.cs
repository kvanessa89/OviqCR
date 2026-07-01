using FluentValidation;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Oviq.Application.Clientes;
using Oviq.Application.Clientes.Dtos;

namespace Oviq.API.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize] // cualquier usuario autenticado puede leer
public class ClientesController : ControllerBase
{
    private readonly IClienteService _clienteService;
    private readonly IValidator<CrearClienteDto> _crearValidator;
    private readonly IValidator<ActualizarClienteDto> _actualizarValidator;

    public ClientesController(
        IClienteService clienteService,
        IValidator<CrearClienteDto> crearValidator,
        IValidator<ActualizarClienteDto> actualizarValidator)
    {
        _clienteService = clienteService;
        _crearValidator = crearValidator;
        _actualizarValidator = actualizarValidator;
    }

    [HttpGet]
    public async Task<ActionResult<List<ClienteDto>>> ObtenerTodos(CancellationToken cancellationToken)
    {
        return Ok(await _clienteService.ObtenerTodosAsync(cancellationToken));
    }

    [HttpGet("{id}")]
    public async Task<ActionResult<ClienteDto>> ObtenerPorId(int id, CancellationToken cancellationToken)
    {
        var cliente = await _clienteService.ObtenerPorIdAsync(id, cancellationToken);
        return cliente is null ? NotFound() : Ok(cliente);
    }

    [HttpPost]
    [Authorize(Roles = "Administrador")]
    public async Task<ActionResult<ClienteDto>> Crear(CrearClienteDto dto, CancellationToken cancellationToken)
    {
        await _crearValidator.ValidateAndThrowAsync(dto, cancellationToken);
        var cliente = await _clienteService.CrearAsync(dto, cancellationToken);
        return CreatedAtAction(nameof(ObtenerPorId), new { id = cliente.Id }, cliente);
    }

    [HttpPut("{id}")]
    [Authorize(Roles = "Administrador")]
    public async Task<IActionResult> Actualizar(int id, ActualizarClienteDto dto, CancellationToken cancellationToken)
    {
        await _actualizarValidator.ValidateAndThrowAsync(dto, cancellationToken);
        await _clienteService.ActualizarAsync(id, dto, cancellationToken);
        return NoContent();
    }

    [HttpDelete("{id}")]
    [Authorize(Roles = "Administrador")]
    public async Task<IActionResult> Eliminar(int id, CancellationToken cancellationToken)
    {
        await _clienteService.EliminarAsync(id, cancellationToken);
        return NoContent();
    }

    // ── Clasificaciones ────────────────────────────────────────────────

    [HttpPost("{clienteId}/clasificaciones")]
    [Authorize(Roles = "Administrador")]
    public async Task<ActionResult<ClasificacionDto>> AgregarClasificacion(int clienteId, CrearClasificacionClienteDto dto, CancellationToken cancellationToken)
    {
        var result = await _clienteService.AgregarClasificacionAsync(clienteId, dto, cancellationToken);
        return Ok(result);
    }

    [HttpPut("{clienteId}/clasificaciones/{id}")]
    [Authorize(Roles = "Administrador")]
    public async Task<IActionResult> RenombrarClasificacion(int clienteId, int id, ActualizarClasificacionClienteDto dto, CancellationToken cancellationToken)
    {
        await _clienteService.RenombrarClasificacionAsync(clienteId, id, dto, cancellationToken);
        return NoContent();
    }

    [HttpDelete("{clienteId}/clasificaciones/{id}")]
    [Authorize(Roles = "Administrador")]
    public async Task<IActionResult> EliminarClasificacion(int clienteId, int id, CancellationToken cancellationToken)
    {
        await _clienteService.EliminarClasificacionAsync(clienteId, id, cancellationToken);
        return NoContent();
    }

    // ── Subcuentas ─────────────────────────────────────────────────────

    [HttpPost("{clienteId}/subcuentas")]
    [Authorize(Roles = "Administrador")]
    public async Task<ActionResult<SubcuentaDto>> AgregarSubcuenta(int clienteId, CrearSubcuentaClienteDto dto, CancellationToken cancellationToken)
    {
        var result = await _clienteService.AgregarSubcuentaAsync(clienteId, dto, cancellationToken);
        return Ok(result);
    }

    [HttpPut("{clienteId}/subcuentas/{id}")]
    [Authorize(Roles = "Administrador")]
    public async Task<IActionResult> ActualizarSubcuenta(int clienteId, int id, ActualizarSubcuentaClienteDto dto, CancellationToken cancellationToken)
    {
        await _clienteService.ActualizarSubcuentaAsync(clienteId, id, dto, cancellationToken);
        return NoContent();
    }

    [HttpDelete("{clienteId}/subcuentas/{id}")]
    [Authorize(Roles = "Administrador")]
    public async Task<IActionResult> EliminarSubcuenta(int clienteId, int id, CancellationToken cancellationToken)
    {
        await _clienteService.EliminarSubcuentaAsync(clienteId, id, cancellationToken);
        return NoContent();
    }
}
