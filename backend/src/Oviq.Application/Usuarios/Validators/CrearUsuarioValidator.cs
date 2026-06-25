using FluentValidation;
using Microsoft.EntityFrameworkCore;
using Oviq.Application.Common.Interfaces;
using Oviq.Application.Usuarios.Dtos;

namespace Oviq.Application.Usuarios.Validators;

public class CrearUsuarioValidator : AbstractValidator<CrearUsuarioDto>
{
    private readonly IApplicationDbContext _context;

    public CrearUsuarioValidator(IApplicationDbContext context)
    {
        _context = context;

        RuleFor(x => x.Nombre).NotEmpty().MaximumLength(150);
        RuleFor(x => x.Email).NotEmpty().EmailAddress();
        RuleFor(x => x.Password).NotEmpty().MinimumLength(8);

        RuleFor(x => x.Rol)
            .Must(r => r is "Administrador" or "Trabajador")
            .WithMessage("El rol debe ser Administrador o Trabajador");

        // Coherencia rol <-> perfil: Trabajador lo requiere, Administrador no debe tenerlo
        RuleFor(x => x.PerfilTrabajador)
            .NotNull().WithMessage("Los usuarios con rol Trabajador requieren información de pago")
            .When(x => x.Rol == "Trabajador");

        RuleFor(x => x.PerfilTrabajador)
            .Null().WithMessage("Los usuarios con rol Administrador no deben tener PerfilTrabajador")
            .When(x => x.Rol == "Administrador");

        // Regla de negocio #9 del modelo de datos: TarifaHora y MontoContrato son
        // mutuamente excluyentes según FormaPago.Codigo ("horas" / "contrato").
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
        if (perfil is null) return true; // ya cubierto por la regla NotNull/Null de arriba

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
