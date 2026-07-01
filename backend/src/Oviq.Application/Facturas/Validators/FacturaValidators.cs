using FluentValidation;
using Oviq.Application.Facturas.Dtos;

namespace Oviq.Application.Facturas.Validators;

public class CrearFacturaValidator : AbstractValidator<CrearFacturaDto>
{
    public CrearFacturaValidator()
    {
        RuleFor(x => x.Numero).NotEmpty().MaximumLength(50);
        RuleFor(x => x.ProyectoId).GreaterThan(0);
        RuleFor(x => x.MonedaId).GreaterThan(0);
        RuleFor(x => x.Monto).GreaterThan(0).WithMessage("El monto debe ser mayor a 0");
        RuleFor(x => x.FechaEmision).NotEmpty();
        RuleFor(x => x.FechaEstimadaPago)
            .NotEmpty()
            .GreaterThanOrEqualTo(x => x.FechaEmision)
            .WithMessage("La fecha estimada de pago debe ser igual o posterior a la de emisión");
        RuleFor(x => x.EstadoId).GreaterThan(0);
    }
}

public class ActualizarFacturaValidator : AbstractValidator<ActualizarFacturaDto>
{
    public ActualizarFacturaValidator()
    {
        RuleFor(x => x.Numero).NotEmpty().MaximumLength(50);
        RuleFor(x => x.ProyectoId).GreaterThan(0);
        RuleFor(x => x.MonedaId).GreaterThan(0);
        RuleFor(x => x.Monto).GreaterThan(0).WithMessage("El monto debe ser mayor a 0");
        RuleFor(x => x.FechaEmision).NotEmpty();
        RuleFor(x => x.FechaEstimadaPago)
            .NotEmpty()
            .GreaterThanOrEqualTo(x => x.FechaEmision)
            .WithMessage("La fecha estimada de pago debe ser igual o posterior a la de emisión");
        RuleFor(x => x.EstadoId).GreaterThan(0);
    }
}
