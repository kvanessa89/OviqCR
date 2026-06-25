using FluentValidation;
using Oviq.Application.Clientes.Dtos;

namespace Oviq.Application.Clientes.Validators;

public class CrearClienteValidator : AbstractValidator<CrearClienteDto>
{
    public CrearClienteValidator()
    {
        RuleFor(x => x.Nombre)
            .NotEmpty().WithMessage("El nombre del cliente es requerido")
            .MaximumLength(150);

        RuleFor(x => x.EstadoId)
            .GreaterThan(0).WithMessage("Debe seleccionar un estado");

        RuleFor(x => x.Email)
            .EmailAddress().WithMessage("El email no es válido")
            .When(x => !string.IsNullOrWhiteSpace(x.Email));

        RuleForEach(x => x.Clasificaciones).ChildRules(clasif =>
        {
            clasif.RuleFor(c => c.Nombre).NotEmpty().WithMessage("El nombre de la clasificación es requerido");
            clasif.RuleFor(c => c.TempId).NotEmpty().WithMessage("Falta el identificador temporal de la clasificación");
        });

        RuleForEach(x => x.Subcuentas).ChildRules(sub =>
        {
            sub.RuleFor(s => s.Nombre).NotEmpty().WithMessage("El nombre de la subcuenta es requerido");
        });

        // Toda Subcuenta.ClasificacionTempId debe existir entre las Clasificaciones enviadas
        RuleFor(x => x)
            .Must(TenerReferenciasValidas)
            .WithMessage("Una subcuenta referencia una clasificación que no existe en la solicitud");
    }

    private static bool TenerReferenciasValidas(CrearClienteDto dto)
    {
        var tempIds = dto.Clasificaciones.Select(c => c.TempId).ToHashSet();
        return dto.Subcuentas
            .Where(s => s.ClasificacionTempId is not null)
            .All(s => tempIds.Contains(s.ClasificacionTempId!));
    }
}
