using Oviq.Application.Pagos.Dtos;

namespace Oviq.Application.Pagos;

public interface IPagoProyectoService
{
    Task<List<PagoProyectoDto>> ObtenerPorProyectoAsync(int proyectoId, CancellationToken cancellationToken = default);
    Task<PagoProyectoDto> CrearAsync(int proyectoId, CrearPagoProyectoDto dto, CancellationToken cancellationToken = default);
    Task ActualizarAsync(int id, ActualizarPagoProyectoDto dto, CancellationToken cancellationToken = default);
    Task EliminarAsync(int id, CancellationToken cancellationToken = default);
}
