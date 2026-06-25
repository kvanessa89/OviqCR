using Microsoft.EntityFrameworkCore;
using Oviq.Application.Common.Interfaces;
using Oviq.Application.Proyectos.Dtos;
using Oviq.Domain.Entities;

namespace Oviq.Application.Proyectos;

public class ProyectoService : IProyectoService
{
    private readonly IApplicationDbContext _context;

    public ProyectoService(IApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<List<ProyectoDto>> ObtenerTodosAsync(CancellationToken cancellationToken = default)
    {
        var proyectos = await ConsultaBase().ToListAsync(cancellationToken);
        return proyectos.Select(MapToDto).ToList();
    }

    public async Task<ProyectoDto?> ObtenerPorIdAsync(int id, CancellationToken cancellationToken = default)
    {
        var proyecto = await ConsultaBase().FirstOrDefaultAsync(p => p.Id == id, cancellationToken);
        return proyecto is null ? null : MapToDto(proyecto);
    }

    public async Task<ProyectoDto> CrearAsync(CrearProyectoDto dto, CancellationToken cancellationToken = default)
    {
        var proyecto = new Proyecto
        {
            Nombre = dto.Nombre,
            ClienteId = dto.ClienteId,
            SubcuentaId = dto.SubcuentaId,
            EstadoId = dto.EstadoId,
            FechaInicio = dto.FechaInicio,
            FechaFin = dto.FechaFin,
            Descripcion = dto.Descripcion
        };

        if (dto.OrdenCompra is not null)
        {
            proyecto.OrdenCompra = new OrdenCompra
            {
                NumeroOc = dto.OrdenCompra.NumeroOc,
                AQuienFacturar = dto.OrdenCompra.AQuienFacturar,
                Detalle = dto.OrdenCompra.Detalle,
                MontoTotal = dto.OrdenCompra.MontoTotal,
                MonedaId = dto.OrdenCompra.MonedaId
            };
        }

        // Nota: la consistencia ClienteId <-> Subcuenta.ClienteId (regla #5) se valida
        // en CrearProyectoValidator, ANTES de llegar acá — no se repite la validación.
        _context.Proyectos.Add(proyecto);
        await _context.SaveChangesAsync(cancellationToken);

        return (await ObtenerPorIdAsync(proyecto.Id, cancellationToken))!;
    }

    public async Task ActualizarAsync(int id, ActualizarProyectoDto dto, CancellationToken cancellationToken = default)
    {
        var proyecto = await _context.Proyectos
            .Include(p => p.OrdenCompra)
            .FirstOrDefaultAsync(p => p.Id == id, cancellationToken)
            ?? throw new KeyNotFoundException($"Proyecto {id} no encontrado");

        // Regla de negocio #5: si se asigna subcuenta, debe pertenecer al MISMO
        // cliente que ya tiene el proyecto (el cliente no se edita acá, ver
        // ActualizarProyectoDto). No se valida en FluentValidation porque
        // necesita el ClienteId del proyecto existente, no algo que venga en el DTO.
        if (dto.SubcuentaId.HasValue)
        {
            var subcuenta = await _context.Subcuentas
                .FirstOrDefaultAsync(s => s.Id == dto.SubcuentaId, cancellationToken);

            if (subcuenta is null || subcuenta.ClienteId != proyecto.ClienteId)
                throw new InvalidOperationException(
                    "La subcuenta seleccionada no pertenece al cliente del proyecto");
        }

        proyecto.Nombre = dto.Nombre;
        proyecto.SubcuentaId = dto.SubcuentaId;
        proyecto.EstadoId = dto.EstadoId;
        proyecto.FechaInicio = dto.FechaInicio;
        proyecto.FechaFin = dto.FechaFin;
        proyecto.Descripcion = dto.Descripcion;

        if (dto.OrdenCompra is not null)
        {
            if (proyecto.OrdenCompra is null)
            {
                proyecto.OrdenCompra = new OrdenCompra { ProyectoId = proyecto.Id };
                _context.OrdenesCompra.Add(proyecto.OrdenCompra);
            }

            proyecto.OrdenCompra.NumeroOc = dto.OrdenCompra.NumeroOc;
            proyecto.OrdenCompra.AQuienFacturar = dto.OrdenCompra.AQuienFacturar;
            proyecto.OrdenCompra.Detalle = dto.OrdenCompra.Detalle;
            proyecto.OrdenCompra.MontoTotal = dto.OrdenCompra.MontoTotal;
            proyecto.OrdenCompra.MonedaId = dto.OrdenCompra.MonedaId;
        }

        await _context.SaveChangesAsync(cancellationToken);
    }

    public async Task MarcarCompletadoAsync(int id, CancellationToken cancellationToken = default)
    {
        var proyecto = await _context.Proyectos.FirstOrDefaultAsync(p => p.Id == id, cancellationToken)
            ?? throw new KeyNotFoundException($"Proyecto {id} no encontrado");

        var estadoCompletado = await _context.EstadosProyecto
            .FirstOrDefaultAsync(e => e.Codigo == "completado", cancellationToken)
            ?? throw new InvalidOperationException("No existe el estado 'completado' en el catálogo EstadoProyecto");

        proyecto.EstadoId = estadoCompletado.Id;
        await _context.SaveChangesAsync(cancellationToken);
    }

    private IQueryable<Proyecto> ConsultaBase() =>
        _context.Proyectos
            .Include(p => p.Cliente)
            .Include(p => p.Subcuenta)
            .Include(p => p.Estado)
            .Include(p => p.OrdenCompra)
                .ThenInclude(o => o!.Moneda);

    private static ProyectoDto MapToDto(Proyecto p) => new()
    {
        Id = p.Id,
        Nombre = p.Nombre,
        ClienteId = p.ClienteId,
        ClienteNombre = p.Cliente.Nombre,
        SubcuentaId = p.SubcuentaId,
        SubcuentaNombre = p.Subcuenta?.Nombre,
        EstadoCodigo = p.Estado.Codigo,
        EstadoNombre = p.Estado.Nombre,
        FechaInicio = p.FechaInicio,
        FechaFin = p.FechaFin,
        Descripcion = p.Descripcion,
        OrdenCompra = p.OrdenCompra is null ? null : new OrdenCompraDto
        {
            Id = p.OrdenCompra.Id,
            NumeroOc = p.OrdenCompra.NumeroOc,
            AQuienFacturar = p.OrdenCompra.AQuienFacturar,
            Detalle = p.OrdenCompra.Detalle,
            MontoTotal = p.OrdenCompra.MontoTotal,
            MonedaCodigo = p.OrdenCompra.Moneda.Codigo
        }
    };
}
