using FluentValidation;
using Oviq.Application.Clientes.Dtos;

namespace Oviq.Application.Clientes.Validators;

public class ActualizarClienteValidator : AbstractValidator<ActualizarClienteDto>
{
    public ActualizarClienteValidator()
    {
        RuleFor(x => x.Nombre).NotEmpty().MaximumLength(150);
        RuleFor(x => x.EstadoId).GreaterThan(0).WithMessage("Debe seleccionar un estado");
        RuleFor(x => x.Email)
            .EmailAddress().WithMessage("El email no es válido")
            .When(x => !string.IsNullOrWhiteSpace(x.Email));
    }
}
