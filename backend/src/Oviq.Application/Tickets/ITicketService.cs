using Oviq.Application.Tickets.Dtos;

namespace Oviq.Application.Tickets;

public interface ITicketService
{
    Task<List<TicketDto>> ObtenerTodosAsync(CancellationToken cancellationToken = default);
    Task<List<TicketDto>> ObtenerPorProyectoAsync(int proyectoId, CancellationToken cancellationToken = default);
    Task<TicketDto?> ObtenerPorIdAsync(int id, CancellationToken cancellationToken = default);
    Task<TicketDto> CrearAsync(CrearTicketDto dto, CancellationToken cancellationToken = default);
    Task ActualizarAsync(int id, ActualizarTicketDto dto, CancellationToken cancellationToken = default);
    Task CambiarEstadoAsync(int id, int estadoId, CancellationToken cancellationToken = default);
    Task EliminarAsync(int id, CancellationToken cancellationToken = default);
}
