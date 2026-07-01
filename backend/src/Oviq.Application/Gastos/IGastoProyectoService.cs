using Oviq.Application.Gastos.Dtos;

namespace Oviq.Application.Gastos;

public interface IGastoProyectoService
{
    Task<List<GastoDto>> ObtenerPorProyectoAsync(int proyectoId, CancellationToken cancellationToken = default);
    Task<GastoDto> CrearAsync(int proyectoId, CrearGastoDto dto, CancellationToken cancellationToken = default);
    Task ActualizarAsync(int id, ActualizarGastoDto dto, CancellationToken cancellationToken = default);
    Task EliminarAsync(int id, CancellationToken cancellationToken = default);
}
