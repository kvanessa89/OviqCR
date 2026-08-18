using Oviq.Application.Notas.Dtos;

namespace Oviq.Application.Notas;

public interface INotaService
{
    Task<List<NotaDto>> ObtenerTodasAsync(CancellationToken cancellationToken = default);
    Task<NotaDto> CrearAsync(CrearNotaDto dto, CancellationToken cancellationToken = default);
    Task ActualizarAsync(int id, ActualizarNotaDto dto, CancellationToken cancellationToken = default);
    Task CambiarEstadoAsync(int id, bool completada, CancellationToken cancellationToken = default);
    Task EliminarAsync(int id, CancellationToken cancellationToken = default);
}
