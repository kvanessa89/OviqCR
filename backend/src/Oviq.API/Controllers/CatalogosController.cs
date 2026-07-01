using FluentValidation;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Oviq.Application.Catalogos;
using Oviq.Application.Catalogos.Dtos;
using Oviq.Application.Common.Interfaces;
using Oviq.Domain.Entities.Catalogos;
using Oviq.Infrastructure.Identity;

namespace Oviq.API.Controllers;

[Route("api/estados-cliente")]
public class EstadosClienteController : CatalogoControllerBase<EstadoCliente>
{
    private readonly IApplicationDbContext _context;

    public EstadosClienteController(
        ICatalogoService<EstadoCliente> service,
        IValidator<CrearCatalogoDto> crearValidator,
        IValidator<ActualizarCatalogoDto> actualizarValidator,
        IApplicationDbContext context)
        : base(service, crearValidator, actualizarValidator)
    {
        _context = context;
    }

    protected override async Task<bool> EstaEnUsoAsync(int id, CancellationToken ct)
        => await _context.Clientes.AnyAsync(c => c.EstadoId == id, ct);
}

[Route("api/estados-proyecto")]
public class EstadosProyectoController : CatalogoControllerBase<EstadoProyecto>
{
    private readonly IApplicationDbContext _context;

    public EstadosProyectoController(
        ICatalogoService<EstadoProyecto> service,
        IValidator<CrearCatalogoDto> crearValidator,
        IValidator<ActualizarCatalogoDto> actualizarValidator,
        IApplicationDbContext context)
        : base(service, crearValidator, actualizarValidator)
    {
        _context = context;
    }

    protected override async Task<bool> EstaEnUsoAsync(int id, CancellationToken ct)
        => await _context.Proyectos.AnyAsync(p => p.EstadoId == id, ct);
}

[Route("api/prioridades-ticket")]
public class PrioridadesTicketController : CatalogoControllerBase<PrioridadTicket>
{
    private readonly IApplicationDbContext _context;

    public PrioridadesTicketController(
        ICatalogoService<PrioridadTicket> service,
        IValidator<CrearCatalogoDto> crearValidator,
        IValidator<ActualizarCatalogoDto> actualizarValidator,
        IApplicationDbContext context)
        : base(service, crearValidator, actualizarValidator)
    {
        _context = context;
    }

    protected override async Task<bool> EstaEnUsoAsync(int id, CancellationToken ct)
        => await _context.Tickets.AnyAsync(t => t.PrioridadId == id, ct);
}

[Route("api/estados-ticket")]
public class EstadosTicketController : CatalogoControllerBase<EstadoTicket>
{
    private readonly IApplicationDbContext _context;

    public EstadosTicketController(
        ICatalogoService<EstadoTicket> service,
        IValidator<CrearCatalogoDto> crearValidator,
        IValidator<ActualizarCatalogoDto> actualizarValidator,
        IApplicationDbContext context)
        : base(service, crearValidator, actualizarValidator)
    {
        _context = context;
    }

    protected override async Task<bool> EstaEnUsoAsync(int id, CancellationToken ct)
        => await _context.Tickets.AnyAsync(t => t.EstadoId == id, ct);
}

[Route("api/formas-pago")]
public class FormasPagoController : CatalogoControllerBase<FormaPago>
{
    private readonly IApplicationDbContext _context;

    public FormasPagoController(
        ICatalogoService<FormaPago> service,
        IValidator<CrearCatalogoDto> crearValidator,
        IValidator<ActualizarCatalogoDto> actualizarValidator,
        IApplicationDbContext context)
        : base(service, crearValidator, actualizarValidator)
    {
        _context = context;
    }

    protected override async Task<bool> EstaEnUsoAsync(int id, CancellationToken ct)
        => await _context.PerfilesTrabajador.AnyAsync(p => p.FormaPagoId == id, ct);
}

[Route("api/monedas")]
public class MonedasController : CatalogoControllerBase<Moneda>
{
    private readonly IApplicationDbContext _context;

    public MonedasController(
        ICatalogoService<Moneda> service,
        IValidator<CrearCatalogoDto> crearValidator,
        IValidator<ActualizarCatalogoDto> actualizarValidator,
        IApplicationDbContext context)
        : base(service, crearValidator, actualizarValidator)
    {
        _context = context;
    }

    protected override async Task<bool> EstaEnUsoAsync(int id, CancellationToken ct)
        => await _context.OrdenesCompra.AnyAsync(o => o.MonedaId == id, ct)
        || await _context.Facturas.AnyAsync(f => f.MonedaId == id, ct);
}

[Route("api/estados-factura")]
public class EstadosFacturaController : CatalogoControllerBase<EstadoFactura>
{
    private readonly IApplicationDbContext _context;

    public EstadosFacturaController(
        ICatalogoService<EstadoFactura> service,
        IValidator<CrearCatalogoDto> crearValidator,
        IValidator<ActualizarCatalogoDto> actualizarValidator,
        IApplicationDbContext context)
        : base(service, crearValidator, actualizarValidator)
    {
        _context = context;
    }

    protected override async Task<bool> EstaEnUsoAsync(int id, CancellationToken ct)
        => await _context.Facturas.AnyAsync(f => f.EstadoId == id, ct);
}

[Route("api/cargos")]
public class CargosController : CatalogoControllerBase<Cargo>
{
    public CargosController(
        ICatalogoService<Cargo> service,
        IValidator<CrearCatalogoDto> crearValidator,
        IValidator<ActualizarCatalogoDto> actualizarValidator)
        : base(service, crearValidator, actualizarValidator) { }
    // Cargo es string en PerfilTrabajador — sin FK, no se puede verificar uso
}

[ApiController]
[Route("api/roles")]
[Authorize]
public class RolesController : ControllerBase
{
    private readonly RoleManager<ApplicationRole> _roleManager;
    private readonly UserManager<ApplicationUser> _userManager;

    public RolesController(
        RoleManager<ApplicationRole> roleManager,
        UserManager<ApplicationUser> userManager)
    {
        _roleManager = roleManager;
        _userManager = userManager;
    }

    [HttpGet]
    public async Task<IActionResult> GetAll()
    {
        var roles = await _roleManager.Roles.OrderBy(r => r.Name).ToListAsync();

        var dtos = roles.Select((r, i) => new CatalogoDto
        {
            Id     = r.Id,
            Codigo = r.Name?.ToLowerInvariant() ?? string.Empty,
            Nombre = r.Name ?? string.Empty,
            Activo = true,
            Orden  = i + 1,
        }).ToList();

        return Ok(dtos);
    }

    [HttpPost]
    [Authorize(Roles = "Administrador")]
    public async Task<IActionResult> Crear([FromBody] CrearCatalogoDto dto)
    {
        var result = await _roleManager.CreateAsync(new ApplicationRole { Name = dto.Nombre });
        if (!result.Succeeded)
            return BadRequest(new { mensaje = string.Join(", ", result.Errors.Select(e => e.Description)) });

        var rol = await _roleManager.FindByNameAsync(dto.Nombre);
        return Ok(new CatalogoDto
        {
            Id     = rol!.Id,
            Codigo = rol.Name?.ToLowerInvariant() ?? string.Empty,
            Nombre = rol.Name ?? string.Empty,
            Activo = true,
            Orden  = 1,
        });
    }

    [HttpPut("{id}")]
    [Authorize(Roles = "Administrador")]
    public async Task<IActionResult> Actualizar(int id, [FromBody] ActualizarCatalogoDto dto)
    {
        var rol = await _roleManager.FindByIdAsync(id.ToString());
        if (rol is null) return NotFound(new { mensaje = "Rol no encontrado." });

        rol.Name = dto.Nombre;
        var result = await _roleManager.UpdateAsync(rol);
        if (!result.Succeeded)
            return BadRequest(new { mensaje = string.Join(", ", result.Errors.Select(e => e.Description)) });

        return NoContent();
    }

    [HttpDelete("{id}")]
    [Authorize(Roles = "Administrador")]
    public async Task<IActionResult> Eliminar(int id)
    {
        var rol = await _roleManager.FindByIdAsync(id.ToString());
        if (rol is null) return NotFound(new { mensaje = "Rol no encontrado." });

        var usuariosConRol = await _userManager.GetUsersInRoleAsync(rol.Name!);
        if (usuariosConRol.Count > 0)
            return Conflict(new { mensaje = $"No se puede eliminar porque hay {usuariosConRol.Count} usuario(s) con este rol." });

        var result = await _roleManager.DeleteAsync(rol);
        if (!result.Succeeded)
            return BadRequest(new { mensaje = string.Join(", ", result.Errors.Select(e => e.Description)) });

        return NoContent();
    }
}
