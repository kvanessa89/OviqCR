using Oviq.Application.Proyectos.Dtos;

namespace Oviq.Application.Proyectos;

public interface IProyectoService
{
    Task<List<ProyectoDto>> ObtenerTodosAsync(CancellationToken cancellationToken = default);
    Task<ProyectoDto?> ObtenerPorIdAsync(int id, CancellationToken cancellationToken = default);
    Task<ProyectoDto> CrearAsync(CrearProyectoDto dto, CancellationToken cancellationToken = default);
    Task ActualizarAsync(int id, ActualizarProyectoDto dto, CancellationToken cancellationToken = default);

    // Transición manual: en_curso -> completado (botón "Marcar finalizado" del mockup).
    // pendiente_de_facturar -> facturado se implementa cuando exista la entidad Factura.
    Task MarcarCompletadoAsync(int id, CancellationToken cancellationToken = default);
}
