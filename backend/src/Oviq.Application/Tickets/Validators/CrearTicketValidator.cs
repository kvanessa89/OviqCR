using FluentValidation;
using Oviq.Application.Tickets.Dtos;

namespace Oviq.Application.Tickets.Validators;

public class CrearTicketValidator : AbstractValidator<CrearTicketDto>
{
    public CrearTicketValidator()
    {
        RuleFor(x => x.Titulo)
            .NotEmpty().WithMessage("El título del ticket es requerido")
            .MaximumLength(200);

        RuleFor(x => x.ProyectoId)
            .GreaterThan(0).WithMessage("Debe seleccionar un proyecto");

        RuleFor(x => x.PrioridadId)
            .GreaterThan(0).WithMessage("Debe seleccionar una prioridad");

        RuleFor(x => x.EstadoId)
            .GreaterThan(0).WithMessage("Debe seleccionar un estado");
    }
}
