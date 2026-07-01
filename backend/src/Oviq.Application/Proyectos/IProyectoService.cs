using Oviq.Application.Proyectos.Dtos;

namespace Oviq.Application.Proyectos;

public interface IProyectoService
{
    Task<List<ProyectoDto>> ObtenerTodosAsync(CancellationToken cancellationToken = default);
    Task<ProyectoDto?> ObtenerPorIdAsync(int id, CancellationToken cancellationToken = default);
    Task<ProyectoDto> CrearAsync(CrearProyectoDto dto, CancellationToken cancellationToken = default);
    Task ActualizarAsync(int id, ActualizarProyectoDto dto, CancellationToken cancellationToken = default);

    Task MarcarFinalizadoAsync(int id, CancellationToken cancellationToken = default);
    Task EliminarAsync(int id, CancellationToken cancellationToken = default);
}
