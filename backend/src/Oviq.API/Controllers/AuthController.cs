using FluentValidation;
using Microsoft.AspNetCore.Mvc;
using Oviq.Application.Auth;
using Oviq.Application.Auth.Dtos;

namespace Oviq.API.Controllers;

[ApiController]
[Route("api/[controller]")]
public class AuthController : ControllerBase
{
    private readonly IAuthService _authService;
    private readonly IValidator<LoginDto> _validator;

    public AuthController(IAuthService authService, IValidator<LoginDto> validator)
    {
        _authService = authService;
        _validator = validator;
    }

    [HttpPost("login")]
    public async Task<ActionResult<AuthResponseDto>> Login(LoginDto dto, CancellationToken cancellationToken)
    {
        // ValidateAndThrowAsync lanza FluentValidation.ValidationException si falla —
        // el ExceptionHandlingMiddleware la traduce a un 400 con el detalle.
        await _validator.ValidateAndThrowAsync(dto, cancellationToken);

        var resultado = await _authService.LoginAsync(dto, cancellationToken);
        return Ok(resultado);
    }
}
