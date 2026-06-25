using Microsoft.EntityFrameworkCore;
using Oviq.Application.Common.Interfaces;
using Oviq.Infrastructure.Persistence;

namespace Oviq.Infrastructure.Identity;

public class UsuarioLookupService : IUsuarioLookupService
{
    private readonly ApplicationDbContext _context;

    public UsuarioLookupService(ApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<Dictionary<int, string>> ObtenerNombresAsync(
        IEnumerable<int> usuarioIds, CancellationToken cancellationToken = default)
    {
        var ids = usuarioIds.Distinct().ToList();
        if (ids.Count == 0) return new Dictionary<int, string>();

        // .Users viene gratis de IdentityDbContext — no hace falta declararlo en ApplicationDbContext
        return await _context.Users
            .Where(u => ids.Contains(u.Id))
            .ToDictionaryAsync(u => u.Id, u => u.Nombre, cancellationToken);
    }
}
