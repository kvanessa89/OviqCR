using Oviq.Application.Clientes.Dtos;

namespace Oviq.Application.Clientes;

public interface IClienteService
{
    Task<List<ClienteDto>> ObtenerTodosAsync(CancellationToken cancellationToken = default);
    Task<ClienteDto?> ObtenerPorIdAsync(int id, CancellationToken cancellationToken = default);
    Task<ClienteDto> CrearAsync(CrearClienteDto dto, CancellationToken cancellationToken = default);
    Task ActualizarAsync(int id, ActualizarClienteDto dto, CancellationToken cancellationToken = default);
}
