using Microsoft.EntityFrameworkCore;
using Oviq.Application.Common.Interfaces;
using Oviq.Application.Notas.Dtos;
using Oviq.Domain.Entities;

namespace Oviq.Application.Notas;

public class NotaService : INotaService
{
    private readonly IApplicationDbContext _context;
    private readonly IUsuarioLookupService _usuarioLookup;

    public NotaService(IApplicationDbContext context, IUsuarioLookupService usuarioLookup)
    {
        _context = context;
        _usuarioLookup = usuarioLookup;
    }

    public async Task<List<NotaDto>> ObtenerTodasAsync(CancellationToken cancellationToken = default)
    {
        var notas = await _context.Notas
            .OrderBy(n => n.Completada)
            .ThenByDescending(n => n.CreadoEn)
            .ToListAsync(cancellationToken);

        var usuarioIds = notas.Where(n => n.CreadoPorId.HasValue).Select(n => n.CreadoPorId!.Value);
        var nombresPorUsuarioId = await _usuarioLookup.ObtenerNombresAsync(usuarioIds, cancellationToken);

        return notas.Select(n => MapToDto(n, nombresPorUsuarioId)).ToList();
    }

    public async Task<NotaDto> CrearAsync(CrearNotaDto dto, CancellationToken cancellationToken = default)
    {
        var nota = new Nota { Descripcion = dto.Descripcion.Trim() };

        _context.Notas.Add(nota);
        await _context.SaveChangesAsync(cancellationToken);

        var nombresPorUsuarioId = nota.CreadoPorId.HasValue
            ? await _usuarioLookup.ObtenerNombresAsync([nota.CreadoPorId.Value], cancellationToken)
            : [];

        return MapToDto(nota, nombresPorUsuarioId);
    }

    public async Task ActualizarAsync(int id, ActualizarNotaDto dto, CancellationToken cancellationToken = default)
    {
        var nota = await _context.Notas.FirstOrDefaultAsync(n => n.Id == id, cancellationToken)
            ?? throw new KeyNotFoundException($"Nota {id} no encontrada");

        nota.Descripcion = dto.Descripcion.Trim();

        await _context.SaveChangesAsync(cancellationToken);
    }

    public async Task CambiarEstadoAsync(int id, bool completada, CancellationToken cancellationToken = default)
    {
        var nota = await _context.Notas.FirstOrDefaultAsync(n => n.Id == id, cancellationToken)
            ?? throw new KeyNotFoundException($"Nota {id} no encontrada");

        nota.Completada = completada;

        await _context.SaveChangesAsync(cancellationToken);
    }

    public async Task EliminarAsync(int id, CancellationToken cancellationToken = default)
    {
        var nota = await _context.Notas.FirstOrDefaultAsync(n => n.Id == id, cancellationToken)
            ?? throw new KeyNotFoundException($"Nota {id} no encontrada");

        _context.Notas.Remove(nota);
        await _context.SaveChangesAsync(cancellationToken);
    }

    private static NotaDto MapToDto(Nota n, Dictionary<int, string> nombresPorUsuarioId) => new()
    {
        Id = n.Id,
        Descripcion = n.Descripcion,
        Completada = n.Completada,
        CreadoPorId = n.CreadoPorId,
        CreadoPorNombre = n.CreadoPorId.HasValue && nombresPorUsuarioId.TryGetValue(n.CreadoPorId.Value, out var nombre)
            ? nombre
            : "—",
        CreadoEn = n.CreadoEn,
    };
}
