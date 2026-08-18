using FluentValidation;
using Microsoft.EntityFrameworkCore;
using Oviq.Application.Common.Interfaces;
using Oviq.Application.Tickets.Dtos;

namespace Oviq.Application.Tickets.Validators;

public class CrearTicketValidator : AbstractValidator<CrearTicketDto>
{
    private readonly IApplicationDbContext _context;

    public CrearTicketValidator(IApplicationDbContext context)
    {
        _context = context;

        RuleFor(x => x.Titulo)
            .NotEmpty().WithMessage("El título del ticket es requerido")
            .MaximumLength(200);

        RuleFor(x => x.ProyectoId)
            .GreaterThan(0).WithMessage("Debe seleccionar un proyecto");

        RuleFor(x => x.PrioridadId)
            .GreaterThan(0).WithMessage("Debe seleccionar una prioridad");

        RuleFor(x => x.EstadoId)
            .GreaterThan(0).WithMessage("Debe seleccionar un estado");

        // Si el ticket se crea directamente en estado "pendiente", el usuario debe justificarlo.
        RuleFor(x => x.NotaPendiente)
            .NotEmpty().WithMessage("Debe justificar por qué el ticket está en estado Pendiente")
            .WhenAsync((dto, ct) => EsEstadoPendienteAsync(dto.EstadoId, ct));
    }

    private async Task<bool> EsEstadoPendienteAsync(int estadoId, CancellationToken cancellationToken)
    {
        var estado = await _context.EstadosTicket.FirstOrDefaultAsync(e => e.Id == estadoId, cancellationToken);
        return estado?.Codigo == "pendiente";
    }
}
