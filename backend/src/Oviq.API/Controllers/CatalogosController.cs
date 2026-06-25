using FluentValidation;
using Oviq.Application.Catalogos;
using Oviq.Application.Catalogos.Dtos;
using Oviq.Domain.Entities.Catalogos;
using Microsoft.AspNetCore.Mvc;

namespace Oviq.API.Controllers;

[Route("api/estados-cliente")]
public class EstadosClienteController : CatalogoControllerBase<EstadoCliente>
{
    public EstadosClienteController(
        ICatalogoService<EstadoCliente> service,
        IValidator<CrearCatalogoDto> crearValidator,
        IValidator<ActualizarCatalogoDto> actualizarValidator)
        : base(service, crearValidator, actualizarValidator) { }
}

[Route("api/estados-proyecto")]
public class EstadosProyectoController : CatalogoControllerBase<EstadoProyecto>
{
    public EstadosProyectoController(
        ICatalogoService<EstadoProyecto> service,
        IValidator<CrearCatalogoDto> crearValidator,
        IValidator<ActualizarCatalogoDto> actualizarValidator)
        : base(service, crearValidator, actualizarValidator) { }
}

[Route("api/prioridades-ticket")]
public class PrioridadesTicketController : CatalogoControllerBase<PrioridadTicket>
{
    public PrioridadesTicketController(
        ICatalogoService<PrioridadTicket> service,
        IValidator<CrearCatalogoDto> crearValidator,
        IValidator<ActualizarCatalogoDto> actualizarValidator)
        : base(service, crearValidator, actualizarValidator) { }
}

[Route("api/estados-ticket")]
public class EstadosTicketController : CatalogoControllerBase<EstadoTicket>
{
    public EstadosTicketController(
        ICatalogoService<EstadoTicket> service,
        IValidator<CrearCatalogoDto> crearValidator,
        IValidator<ActualizarCatalogoDto> actualizarValidator)
        : base(service, crearValidator, actualizarValidator) { }
}

[Route("api/formas-pago")]
public class FormasPagoController : CatalogoControllerBase<FormaPago>
{
    public FormasPagoController(
        ICatalogoService<FormaPago> service,
        IValidator<CrearCatalogoDto> crearValidator,
        IValidator<ActualizarCatalogoDto> actualizarValidator)
        : base(service, crearValidator, actualizarValidator) { }
}

[Route("api/monedas")]
public class MonedasController : CatalogoControllerBase<Moneda>
{
    public MonedasController(
        ICatalogoService<Moneda> service,
        IValidator<CrearCatalogoDto> crearValidator,
        IValidator<ActualizarCatalogoDto> actualizarValidator)
        : base(service, crearValidator, actualizarValidator) { }
}
