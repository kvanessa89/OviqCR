using System.Security.Claims;
using Oviq.Application.Common.Interfaces;

namespace Oviq.API.Services;

public class CurrentUserService : ICurrentUserService
{
    private readonly IHttpContextAccessor _httpContextAccessor;

    public CurrentUserService(IHttpContextAccessor httpContextAccessor)
    {
        _httpContextAccessor = httpContextAccessor;
    }

    public int? UsuarioId
    {
        get
        {
            var idClaim = _httpContextAccessor.HttpContext?.User?
                .FindFirst(ClaimTypes.NameIdentifier)?.Value;

            return int.TryParse(idClaim, out var id) ? id : null;
        }
    }
}
