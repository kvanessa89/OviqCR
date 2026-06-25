using Oviq.Application.Usuarios.Dtos;

namespace Oviq.Application.Usuarios;

public interface IUsuarioService
{
    Task<List<UsuarioDto>> ObtenerTodosAsync(CancellationToken cancellationToken = default);
    Task<UsuarioDto?> ObtenerPorIdAsync(int id, CancellationToken cancellationToken = default);
    Task<UsuarioDto> CrearAsync(CrearUsuarioDto dto, CancellationToken cancellationToken = default);
    Task ActualizarAsync(int id, ActualizarUsuarioDto dto, CancellationToken cancellationToken = default);
}
