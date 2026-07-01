using Oviq.Application.Facturas.Dtos;

namespace Oviq.Application.Facturas;

public interface IFacturaService
{
    Task<List<FacturaDto>> ObtenerTodasAsync(CancellationToken cancellationToken = default);
    Task<List<FacturaDto>> ObtenerPorProyectoAsync(int proyectoId, CancellationToken cancellationToken = default);
    Task<FacturaDto?> ObtenerPorIdAsync(int id, CancellationToken cancellationToken = default);
    Task<FacturaDto> CrearAsync(CrearFacturaDto dto, CancellationToken cancellationToken = default);
    Task ActualizarAsync(int id, ActualizarFacturaDto dto, CancellationToken cancellationToken = default);
    Task<string> SubirArchivoAsync(int id, Stream archivo, string nombreArchivo, CancellationToken cancellationToken = default);
    Task EliminarAsync(int id, CancellationToken cancellationToken = default);
}
