using FluentValidation;
using Oviq.Application.Proyectos.Dtos;

namespace Oviq.Application.Proyectos.Validators;

// Validación de campos simples solamente. La consistencia Subcuenta/Cliente
// (regla #5) se valida en ProyectoService.ActualizarAsync, porque necesita
// conocer el ClienteId del proyecto YA EXISTENTE — algo que este DTO no trae
// (el cliente de un proyecto no se puede cambiar en edición, ver ProyectoDtos.cs).
public class ActualizarProyectoValidator : AbstractValidator<ActualizarProyectoDto>
{
    public ActualizarProyectoValidator()
    {
        RuleFor(x => x.Nombre).NotEmpty().MaximumLength(200);
        RuleFor(x => x.EstadoId).GreaterThan(0).WithMessage("Debe seleccionar un estado");
    }
}
