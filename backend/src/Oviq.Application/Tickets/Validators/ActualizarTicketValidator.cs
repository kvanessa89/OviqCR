using FluentValidation;
using Oviq.Application.Tickets.Dtos;

namespace Oviq.Application.Tickets.Validators;

public class ActualizarTicketValidator : AbstractValidator<ActualizarTicketDto>
{
    public ActualizarTicketValidator()
    {
        RuleFor(x => x.Titulo).NotEmpty().MaximumLength(200);
        RuleFor(x => x.PrioridadId).GreaterThan(0).WithMessage("Debe seleccionar una prioridad");
        RuleFor(x => x.EstadoId).GreaterThan(0).WithMessage("Debe seleccionar un estado");
    }
}
