using Microsoft.AspNetCore.Identity;
using Oviq.Application.Auth;
using Oviq.Application.Auth.Dtos;
using Oviq.Application.Common.Interfaces;

namespace Oviq.Infrastructure.Identity;

public class AuthService : IAuthService
{
    private readonly UserManager<ApplicationUser> _userManager;
    private readonly IJwtTokenGenerator _jwtTokenGenerator;

    public AuthService(UserManager<ApplicationUser> userManager, IJwtTokenGenerator jwtTokenGenerator)
    {
        _userManager = userManager;
        _jwtTokenGenerator = jwtTokenGenerator;
    }

    public async Task<AuthResponseDto> LoginAsync(LoginDto dto, CancellationToken cancellationToken = default)
    {
        var usuario = await _userManager.FindByEmailAsync(dto.Email)
            ?? throw new UnauthorizedAccessException("Email o contraseña incorrectos");

        var passwordValida = await _userManager.CheckPasswordAsync(usuario, dto.Password);
        if (!passwordValida)
            throw new UnauthorizedAccessException("Email o contraseña incorrectos");

        var roles = await _userManager.GetRolesAsync(usuario);
        var (token, expiraEn) = _jwtTokenGenerator.GenerarToken(usuario.Id, usuario.Email!, usuario.Nombre, roles);

        return new AuthResponseDto
        {
            Token = token,
            ExpiraEn = expiraEn,
            UsuarioId = usuario.Id,
            Nombre = usuario.Nombre,
            Email = usuario.Email!,
            Rol = roles.FirstOrDefault() ?? string.Empty
        };
    }
}
