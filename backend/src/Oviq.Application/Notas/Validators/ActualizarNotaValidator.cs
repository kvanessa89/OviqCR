using FluentValidation;
using Oviq.Application.Notas.Dtos;

namespace Oviq.Application.Notas.Validators;

public class ActualizarNotaValidator : AbstractValidator<ActualizarNotaDto>
{
    public ActualizarNotaValidator()
    {
        RuleFor(x => x.Descripcion)
            .NotEmpty().WithMessage("La descripción de la nota es requerida")
            .MaximumLength(500);
    }
}
