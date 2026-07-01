using FluentValidation;
using Oviq.Application.Usuarios.Dtos;

namespace Oviq.Application.Usuarios.Validators;

public class ActualizarUsuarioValidator : AbstractValidator<ActualizarUsuarioDto>
{
    public ActualizarUsuarioValidator()
    {
        RuleFor(x => x.Nombre).NotEmpty().MaximumLength(150);
        RuleFor(x => x.Email).NotEmpty().EmailAddress().WithMessage("El email no es válido");

        RuleFor(x => x.Rol)
            .Must(r => r is "Administrador" or "Trabajador")
            .WithMessage("El rol debe ser Administrador o Trabajador");

        RuleFor(x => x.Password)
            .MinimumLength(8).WithMessage("La contraseña debe tener al menos 8 caracteres")
            .When(x => x.Password is not null);

        RuleFor(x => x.PerfilTrabajador!.Cargo)
            .NotEmpty().WithMessage("El cargo es requerido")
            .Must(c => c is "Supervisor" or "Tecnico")
            .WithMessage("El cargo debe ser Supervisor o Tecnico")
            .When(x => x.PerfilTrabajador is not null);
    }
}
