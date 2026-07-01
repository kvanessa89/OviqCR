using FluentValidation;
using Oviq.Application.Usuarios.Dtos;

namespace Oviq.Application.Usuarios.Validators;

public class CrearUsuarioValidator : AbstractValidator<CrearUsuarioDto>
{
    public CrearUsuarioValidator()
    {
        RuleFor(x => x.Nombre).NotEmpty().MaximumLength(150);
        RuleFor(x => x.Email).NotEmpty().EmailAddress();
        RuleFor(x => x.Password).NotEmpty().MinimumLength(8);

        RuleFor(x => x.Rol)
            .Must(r => r is "Administrador" or "Trabajador")
            .WithMessage("El rol debe ser Administrador o Trabajador");

        RuleFor(x => x.PerfilTrabajador)
            .NotNull().WithMessage("Los usuarios con rol Trabajador requieren perfil de trabajador")
            .When(x => x.Rol == "Trabajador");

        RuleFor(x => x.PerfilTrabajador)
            .Null().WithMessage("Los usuarios con rol Administrador no deben tener PerfilTrabajador")
            .When(x => x.Rol == "Administrador");

        RuleFor(x => x.PerfilTrabajador!.Cargo)
            .NotEmpty().WithMessage("El cargo es requerido")
            .Must(c => c is "Supervisor" or "Tecnico")
            .WithMessage("El cargo debe ser Supervisor o Tecnico")
            .When(x => x.PerfilTrabajador is not null);
    }
}
