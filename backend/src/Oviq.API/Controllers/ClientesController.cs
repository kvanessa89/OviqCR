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
}
