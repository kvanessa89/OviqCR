using FluentValidation;
using Microsoft.EntityFrameworkCore;
using Oviq.Application.Common.Interfaces;
using Oviq.Application.Usuarios.Dtos;

namespace Oviq.Application.Usuarios.Validators;

public class ActualizarUsuarioValidator : AbstractValidator<ActualizarUsuarioDto>
{
    private readonly IApplicationDbContext _context;

    public ActualizarUsuarioValidator(IApplicationDbContext context)
    {
        _context = context;

        RuleFor(x => x.Nombre).NotEmpty().MaximumLength(150);

        // Regla de negocio #9 al editar: si viene perfil, también debe ser consistente
        RuleFor(x => x.PerfilTrabajador)
            .MustAsync(TenerMontoConsistenteConFormaPagoAsync)
            .WithMessage("El monto cargado no coincide con la forma de pago: " +
                         "'horas' requiere TarifaHora (sin MontoContrato), " +
                         "'contrato' requiere MontoContrato (sin TarifaHora)")
            .When(x => x.PerfilTrabajador is not null);
    }

    private async Task<bool> TenerMontoConsistenteConFormaPagoAsync(
        CrearPerfilTrabajadorDto? perfil, CancellationToken cancellationToken)
    {
        if (perfil is null) return true;

        var formaPago = await _context.FormasPago
            .FirstOrDefaultAsync(f => f.Id == perfil.FormaPagoId, cancellationToken);

        if (formaPago is null) return false;

        return formaPago.Codigo switch
        {
            "horas" => perfil.TarifaHora.HasValue && perfil.MontoContrato is null,
            "contrato" => perfil.MontoContrato.HasValue && perfil.TarifaHora is null,
            _ => false
        };
    }
}
