using FluentValidation;
using Oviq.Application.Comentarios.Dtos;

namespace Oviq.Application.Comentarios.Validators;

public class CrearComentarioValidator : AbstractValidator<CrearComentarioDto>
{
    public CrearComentarioValidator()
    {
        RuleFor(x => x.Texto)
            .NotEmpty().WithMessage("El comentario no puede estar vacío")
            .MaximumLength(2000);
    }
}