using FluentValidation;
using Microsoft.EntityFrameworkCore;
using Oviq.Application.Common.Interfaces;
using Oviq.Application.Proyectos.Dtos;

namespace Oviq.Application.Proyectos.Validators;

public class CrearProyectoValidator : AbstractValidator<CrearProyectoDto>
{
    private readonly IApplicationDbContext _context;

    public CrearProyectoValidator(IApplicationDbContext context)
    {
        _context = context;

        RuleFor(x => x.Nombre)
            .NotEmpty().WithMessage("El nombre del proyecto es requerido")
            .MaximumLength(200);

        RuleFor(x => x.ClienteId)
            .GreaterThan(0).WithMessage("Debe seleccionar un cliente");

        RuleFor(x => x.EstadoId)
            .GreaterThan(0).WithMessage("Debe seleccionar un estado");

        // Regla de negocio #5 del modelo de datos: si hay subcuenta, su Cliente debe
        // coincidir con el Cliente del proyecto. No se garantiza por base de datos
        // (son dos FKs independientes) — se valida acá antes de guardar.
        RuleFor(x => x)
            .MustAsync(SubcuentaPerteneceAlClienteAsync)
            .WithMessage("La subcuenta seleccionada no pertenece al cliente seleccionado")
            .When(x => x.SubcuentaId.HasValue);
    }

    private async Task<bool> SubcuentaPerteneceAlClienteAsync(
        CrearProyectoDto dto, CancellationToken cancellationToken)
    {
        var subcuenta = await _context.Subcuentas
            .FirstOrDefaultAsync(s => s.Id == dto.SubcuentaId, cancellationToken);

        return subcuenta is not null && subcuenta.ClienteId == dto.ClienteId;
    }
}
