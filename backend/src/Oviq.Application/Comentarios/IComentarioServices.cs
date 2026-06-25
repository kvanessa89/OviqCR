using Oviq.Application.Comentarios.Dtos;

namespace Oviq.Application.Comentarios;

public interface IComentarioProyectoService
{
    Task<List<ComentarioDto>> ObtenerPorProyectoAsync(int proyectoId, CancellationToken cancellationToken = default);
    Task<ComentarioDto> CrearAsync(int proyectoId, int usuarioId, CrearComentarioDto dto, CancellationToken cancellationToken = default);
    Task EliminarAsync(int id, int usuarioId, CancellationToken cancellationToken = default);
}

public interface IComentarioTicketService
{
    Task<List<ComentarioDto>> ObtenerPorTicketAsync(int ticketId, CancellationToken cancellationToken = default);
    Task<ComentarioDto> CrearAsync(int ticketId, int usuarioId, CrearComentarioDto dto, CancellationToken cancellationToken = default);
    Task EliminarAsync(int id, int usuarioId, CancellationToken cancellationToken = default);
}