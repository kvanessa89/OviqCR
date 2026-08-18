using FluentValidation;
using Oviq.Application.Notas.Dtos;

namespace Oviq.Application.Notas.Validators;

public class CrearNotaValidator : AbstractValidator<CrearNotaDto>
{
    public CrearNotaValidator()
    {
        RuleFor(x => x.Descripcion)
            .NotEmpty().WithMessage("La descripción de la nota es requerida")
            .MaximumLength(500);
    }
}
