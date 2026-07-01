using Oviq.Application.Clientes.Dtos;

namespace Oviq.Application.Clientes;

public interface IClienteService
{
    Task<List<ClienteDto>> ObtenerTodosAsync(CancellationToken cancellationToken = default);
    Task<ClienteDto?> ObtenerPorIdAsync(int id, CancellationToken cancellationToken = default);
    Task<ClienteDto> CrearAsync(CrearClienteDto dto, CancellationToken cancellationToken = default);
    Task ActualizarAsync(int id, ActualizarClienteDto dto, CancellationToken cancellationToken = default);
    Task EliminarAsync(int id, CancellationToken cancellationToken = default);

    // Clasificaciones
    Task<ClasificacionDto> AgregarClasificacionAsync(int clienteId, CrearClasificacionClienteDto dto, CancellationToken cancellationToken = default);
    Task RenombrarClasificacionAsync(int clienteId, int id, ActualizarClasificacionClienteDto dto, CancellationToken cancellationToken = default);
    Task EliminarClasificacionAsync(int clienteId, int id, CancellationToken cancellationToken = default);

    // Subcuentas
    Task<SubcuentaDto> AgregarSubcuentaAsync(int clienteId, CrearSubcuentaClienteDto dto, CancellationToken cancellationToken = default);
    Task ActualizarSubcuentaAsync(int clienteId, int id, ActualizarSubcuentaClienteDto dto, CancellationToken cancellationToken = default);
    Task EliminarSubcuentaAsync(int clienteId, int id, CancellationToken cancellationToken = default);
}
