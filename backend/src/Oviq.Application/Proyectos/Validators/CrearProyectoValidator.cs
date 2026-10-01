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

        // Si el proyecto se crea directo como "Finalizado" y no requiere factura,
        // no hay ninguna factura de la cual derivar el monto total — se exige el
        // presupuesto inicial acá, igual que MarcarFinalizadoAsync lo exige al
        // finalizar un proyecto que ya estaba en curso.
        RuleFor(x => x)
            .MustAsync(PresupuestoInicialValidoSiFinalizadoAsync)
            .WithMessage("Debe ingresar el presupuesto inicial para crear el proyecto como finalizado")
            .When(x => !x.RequiereFactura);
    }

    private async Task<bool> SubcuentaPerteneceAlClienteAsync(
        CrearProyectoDto dto, CancellationToken cancellationToken)
    {
        var subcuenta = await _context.Subcuentas
            .FirstOrDefaultAsync(s => s.Id == dto.SubcuentaId, cancellationToken);

        return subcuenta is not null && subcuenta.ClienteId == dto.ClienteId;
    }

    private async Task<bool> PresupuestoInicialValidoSiFinalizadoAsync(
        CrearProyectoDto dto, CancellationToken cancellationToken)
    {
        var estado = await _context.EstadosProyecto
            .FirstOrDefaultAsync(e => e.Id == dto.EstadoId, cancellationToken);

        if (estado?.Codigo != "finalizado") return true;

        return dto.PresupuestoInicial is > 0;
    }
}
