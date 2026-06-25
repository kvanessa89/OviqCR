using Microsoft.EntityFrameworkCore;
using Oviq.Application.Comentarios.Dtos;
using Oviq.Application.Common.Interfaces;
using Oviq.Domain.Entities;

namespace Oviq.Application.Comentarios;

public class ComentarioProyectoService : IComentarioProyectoService
{
    private readonly IApplicationDbContext _context;
    private readonly IUsuarioLookupService _usuarioLookup;

    public ComentarioProyectoService(IApplicationDbContext context, IUsuarioLookupService usuarioLookup)
    {
        _context = context;
        _usuarioLookup = usuarioLookup;
    }

    public async Task<List<ComentarioDto>> ObtenerPorProyectoAsync(int proyectoId, CancellationToken cancellationToken = default)
    {
        var comentarios = await _context.ComentariosProyecto
            .Where(c => c.ProyectoId == proyectoId)
            .OrderBy(c => c.CreadoEn)
            .ToListAsync(cancellationToken);

        return await MapToDtosAsync(comentarios.Select(c => (c.Id, c.UsuarioId, c.Texto, c.CreadoEn)).ToList(), cancellationToken);
    }

    public async Task<ComentarioDto> CrearAsync(int proyectoId, int usuarioId, CrearComentarioDto dto, CancellationToken cancellationToken = default)
    {
        var comentario = new ComentarioProyecto
        {
            ProyectoId = proyectoId,
            UsuarioId = usuarioId,
            Texto = dto.Texto
        };

        _context.ComentariosProyecto.Add(comentario);
        await _context.SaveChangesAsync(cancellationToken);

        var nombres = await _usuarioLookup.ObtenerNombresAsync(new[] { usuarioId }, cancellationToken);
        return new ComentarioDto
        {
            Id = comentario.Id,
            Texto = comentario.Texto,
            UsuarioId = usuarioId,
            UsuarioNombre = nombres.GetValueOrDefault(usuarioId, "Desconocido"),
            CreadoEn = comentario.CreadoEn
        };
    }

    public async Task EliminarAsync(int id, int usuarioId, CancellationToken cancellationToken = default)
    {
        var comentario = await _context.ComentariosProyecto
            .FirstOrDefaultAsync(c => c.Id == id, cancellationToken)
            ?? throw new KeyNotFoundException($"Comentario {id} no encontrado");

        // Solo el autor puede eliminar su propio comentario
        if (comentario.UsuarioId != usuarioId)
            throw new UnauthorizedAccessException("Solo podés eliminar tus propios comentarios");

        _context.ComentariosProyecto.Remove(comentario);
        await _context.SaveChangesAsync(cancellationToken);
    }

    private async Task<List<ComentarioDto>> MapToDtosAsync(
        List<(int Id, int UsuarioId, string Texto, DateTime CreadoEn)> items,
        CancellationToken cancellationToken)
    {
        var nombres = await _usuarioLookup.ObtenerNombresAsync(items.Select(i => i.UsuarioId), cancellationToken);
        return items.Select(i => new ComentarioDto
        {
            Id = i.Id,
            Texto = i.Texto,
            UsuarioId = i.UsuarioId,
            UsuarioNombre = nombres.GetValueOrDefault(i.UsuarioId, "Desconocido"),
            CreadoEn = i.CreadoEn
        }).ToList();
    }
}

public class ComentarioTicketService : IComentarioTicketService
{
    private readonly IApplicationDbContext _context;
    private readonly IUsuarioLookupService _usuarioLookup;

    public ComentarioTicketService(IApplicationDbContext context, IUsuarioLookupService usuarioLookup)
    {
        _context = context;
        _usuarioLookup = usuarioLookup;
    }

    public async Task<List<ComentarioDto>> ObtenerPorTicketAsync(int ticketId, CancellationToken cancellationToken = default)
    {
        var comentarios = await _context.ComentariosTicket
            .Where(c => c.TicketId == ticketId)
            .OrderBy(c => c.CreadoEn)
            .ToListAsync(cancellationToken);

        return await MapToDtosAsync(comentarios.Select(c => (c.Id, c.UsuarioId, c.Texto, c.CreadoEn)).ToList(), cancellationToken);
    }

    public async Task<ComentarioDto> CrearAsync(int ticketId, int usuarioId, CrearComentarioDto dto, CancellationToken cancellationToken = default)
    {
        var comentario = new ComentarioTicket
        {
            TicketId = ticketId,
            UsuarioId = usuarioId,
            Texto = dto.Texto
        };

        _context.ComentariosTicket.Add(comentario);
        await _context.SaveChangesAsync(cancellationToken);

        var nombres = await _usuarioLookup.ObtenerNombresAsync(new[] { usuarioId }, cancellationToken);
        return new ComentarioDto
        {
            Id = comentario.Id,
            Texto = comentario.Texto,
            UsuarioId = usuarioId,
            UsuarioNombre = nombres.GetValueOrDefault(usuarioId, "Desconocido"),
            CreadoEn = comentario.CreadoEn
        };
    }

    public async Task EliminarAsync(int id, int usuarioId, CancellationToken cancellationToken = default)
    {
        var comentario = await _context.ComentariosTicket
            .FirstOrDefaultAsync(c => c.Id == id, cancellationToken)
            ?? throw new KeyNotFoundException($"Comentario {id} no encontrado");

        if (comentario.UsuarioId != usuarioId)
            throw new UnauthorizedAccessException("Solo podés eliminar tus propios comentarios");

        _context.ComentariosTicket.Remove(comentario);
        await _context.SaveChangesAsync(cancellationToken);
    }

    private async Task<List<ComentarioDto>> MapToDtosAsync(
        List<(int Id, int UsuarioId, string Texto, DateTime CreadoEn)> items,
        CancellationToken cancellationToken)
    {
        var nombres = await _usuarioLookup.ObtenerNombresAsync(items.Select(i => i.UsuarioId), cancellationToken);
        return items.Select(i => new ComentarioDto
        {
            Id = i.Id,
            Texto = i.Texto,
            UsuarioId = i.UsuarioId,
            UsuarioNombre = nombres.GetValueOrDefault(i.UsuarioId, "Desconocido"),
            CreadoEn = i.CreadoEn
        }).ToList();
    }
}