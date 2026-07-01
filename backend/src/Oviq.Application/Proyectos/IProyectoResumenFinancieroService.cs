using Oviq.Application.Proyectos.Dtos;

namespace Oviq.Application.Proyectos;

public interface IProyectoResumenFinancieroService
{
    Task<ProyectoResumenFinancieroDto?> ObtenerPorProyectoAsync(int proyectoId, CancellationToken cancellationToken = default);
    Task<ProyectoResumenFinancieroDto> GuardarAsync(int proyectoId, GuardarResumenFinancieroDto dto, CancellationToken cancellationToken = default);
    Task RegistrarPagoClienteAsync(int proyectoId, RegistrarPagoClienteDto dto, CancellationToken cancellationToken = default);
}
