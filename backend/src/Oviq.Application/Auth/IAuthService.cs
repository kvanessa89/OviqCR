using Oviq.Application.Auth.Dtos;

namespace Oviq.Application.Auth;

public interface IAuthService
{
    Task<AuthResponseDto> LoginAsync(LoginDto dto, CancellationToken cancellationToken = default);
}
