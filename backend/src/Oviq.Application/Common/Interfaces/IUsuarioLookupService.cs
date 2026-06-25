namespace Oviq.Application.Common.Interfaces;

// Lookup liviano de usuarios, usado para mostrar el nombre del usuario asignado
// en DTOs de Ticket/Comentario sin que Application conozca ApplicationUser
// (vive en Infrastructure) — mismo motivo que ICurrentUserService.
public interface IUsuarioLookupService
{
    Task<Dictionary<int, string>> ObtenerNombresAsync(
        IEnumerable<int> usuarioIds, CancellationToken cancellationToken = default);
}
