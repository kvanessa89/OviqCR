using FluentValidation;
using Oviq.Application.Catalogos.Dtos;

namespace Oviq.Application.Catalogos.Validators;

public class CrearCatalogoValidator : AbstractValidator<CrearCatalogoDto>
{
    public CrearCatalogoValidator()
    {
        RuleFor(x => x.Codigo)
            .NotEmpty().WithMessage("El código es requerido")
            .MaximumLength(50)
            .Matches("^[a-z_]+$").WithMessage("El código debe ser snake_case en minúsculas (ej: pendiente_de_facturar)");

        RuleFor(x => x.Nombre).NotEmpty().MaximumLength(100);
        RuleFor(x => x.Orden).GreaterThanOrEqualTo(0);
    }
}

public class ActualizarCatalogoValidator : AbstractValidator<ActualizarCatalogoDto>
{
    public ActualizarCatalogoValidator()
    {
        RuleFor(x => x.Nombre).NotEmpty().MaximumLength(100);
        RuleFor(x => x.Orden).GreaterThanOrEqualTo(0);
    }
}
