using Microsoft.EntityFrameworkCore;
using Oviq.Application.Common.Interfaces;
using Oviq.Application.Tickets.Dtos;
using Oviq.Domain.Entities;

namespace Oviq.Application.Tickets;

public class TicketService : ITicketService
{
    private const string PrefijoCodigo = "OVQ";

    private readonly IApplicationDbContext _context;
    private readonly IUsuarioLookupService _usuarioLookup;

    public TicketService(IApplicationDbContext context, IUsuarioLookupService usuarioLookup)
    {
        _context = context;
        _usuarioLookup = usuarioLookup;
    }

    public async Task<List<TicketDto>> ObtenerTodosAsync(CancellationToken cancellationToken = default)
    {
        var tickets = await ConsultaBase().ToListAsync(cancellationToken);
        return await MapToDtosAsync(tickets, cancellationToken);
    }

    public async Task<List<TicketDto>> ObtenerPorProyectoAsync(int proyectoId, CancellationToken cancellationToken = default)
    {
        var tickets = await ConsultaBase().Where(t => t.ProyectoId == proyectoId).ToListAsync(cancellationToken);
        return await MapToDtosAsync(tickets, cancellationToken);
    }

    public async Task<TicketDto?> ObtenerPorIdAsync(int id, CancellationToken cancellationToken = default)
    {
        var ticket = await ConsultaBase().FirstOrDefaultAsync(t => t.Id == id, cancellationToken);
        if (ticket is null) return null;

        var dtos = await MapToDtosAsync(new List<Ticket> { ticket }, cancellationToken);
        return dtos[0];
    }

    public async Task<TicketDto> CrearAsync(CrearTicketDto dto, CancellationToken cancellationToken = default)
    {
        // El secuencial se reinicia por proyecto: tomamos el máximo actual + 1.
        // Nota: con varios usuarios creando tickets simultáneamente en el mismo
        // proyecto hay una ventana de carrera teórica (poco probable con 4
        // usuarios) — si se vuelve un problema real, se resuelve con un índice
        // único + reintento, o una secuencia de base de datos.
        var maxSecuencial = await _context.Tickets
            .Where(t => t.ProyectoId == dto.ProyectoId)
            .Select(t => (int?)t.NumeroSecuencial)
            .MaxAsync(cancellationToken) ?? 0;

        var numeroSecuencial = maxSecuencial + 1;

        var ticket = new Ticket
        {
            Codigo = $"{PrefijoCodigo}-{numeroSecuencial}",
            NumeroSecuencial = numeroSecuencial,
            Titulo = dto.Titulo,
            Descripcion = dto.Descripcion,
            ProyectoId = dto.ProyectoId,
            UsuarioId = dto.UsuarioId,
            PrioridadId = dto.PrioridadId,
            EstadoId = dto.EstadoId,
            FechaInicio = dto.FechaInicio,
            FechaFin = dto.FechaFin
        };

        _context.Tickets.Add(ticket);
        await _context.SaveChangesAsync(cancellationToken);

        return (await ObtenerPorIdAsync(ticket.Id, cancellationToken))!;
    }

    public async Task ActualizarAsync(int id, ActualizarTicketDto dto, CancellationToken cancellationToken = default)
    {
        var ticket = await _context.Tickets.FirstOrDefaultAsync(t => t.Id == id, cancellationToken)
            ?? throw new KeyNotFoundException($"Ticket {id} no encontrado");

        ticket.Titulo = dto.Titulo;
        ticket.Descripcion = dto.Descripcion;
        ticket.UsuarioId = dto.UsuarioId;
        ticket.PrioridadId = dto.PrioridadId;
        ticket.EstadoId = dto.EstadoId;
        ticket.FechaInicio = dto.FechaInicio;
        ticket.FechaFin = dto.FechaFin;

        await _context.SaveChangesAsync(cancellationToken);
    }

    private IQueryable<Ticket> ConsultaBase() =>
        _context.Tickets
            .Include(t => t.Proyecto)
            .Include(t => t.Prioridad)
            .Include(t => t.Estado);

    private async Task<List<TicketDto>> MapToDtosAsync(List<Ticket> tickets, CancellationToken cancellationToken)
    {
        // Batch lookup de nombres de usuario — evita N+1 queries.
        var usuarioIds = tickets.Where(t => t.UsuarioId.HasValue).Select(t => t.UsuarioId!.Value);
        var nombresPorUsuarioId = await _usuarioLookup.ObtenerNombresAsync(usuarioIds, cancellationToken);

        return tickets.Select(t => new TicketDto
        {
            Id = t.Id,
            Codigo = t.Codigo,
            Titulo = t.Titulo,
            Descripcion = t.Descripcion,
            ProyectoId = t.ProyectoId,
            ProyectoNombre = t.Proyecto.Nombre,
            UsuarioId = t.UsuarioId,
            UsuarioNombre = t.UsuarioId.HasValue && nombresPorUsuarioId.TryGetValue(t.UsuarioId.Value, out var nombre)
                ? nombre
                : "Sin asignar",
            PrioridadCodigo = t.Prioridad.Codigo,
            PrioridadNombre = t.Prioridad.Nombre,
            EstadoCodigo = t.Estado.Codigo,
            EstadoNombre = t.Estado.Nombre,
            FechaInicio = t.FechaInicio,
            FechaFin = t.FechaFin
        }).ToList();
    }
}
