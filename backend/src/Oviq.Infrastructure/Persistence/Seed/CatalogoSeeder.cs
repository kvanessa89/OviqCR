using Microsoft.EntityFrameworkCore;
using Oviq.Domain.Entities.Catalogos;

namespace Oviq.Infrastructure.Persistence.Seed;

public static class CatalogoSeeder
{
    public static async Task SeedAsync(ApplicationDbContext context)
    {
        await SeedEstadoClienteAsync(context);
        await SeedEstadoProyectoAsync(context);
        await SeedMonedaAsync(context);
        await SeedPrioridadTicketAsync(context);
        await SeedEstadoTicketAsync(context);
        await SeedFormaPagoAsync(context);
        await SeedEstadoFacturaAsync(context);
        await SeedCargosAsync(context);
        await SeedEstadoFinancieroProyectoAsync(context);

        await context.SaveChangesAsync();
    }

    private static async Task SeedEstadoClienteAsync(ApplicationDbContext context)
    {
        if (await context.EstadosCliente.AnyAsync()) return;

        context.EstadosCliente.AddRange(
            new EstadoCliente { Codigo = "activo", Nombre = "Activo", Orden = 1 },
            new EstadoCliente { Codigo = "inactivo", Nombre = "Inactivo", Orden = 2 }
        );
    }

    private static async Task SeedEstadoProyectoAsync(ApplicationDbContext context)
    {
        if (await context.EstadosProyecto.AnyAsync()) return;

        context.EstadosProyecto.AddRange(
            new EstadoProyecto { Codigo = "en_progreso", Nombre = "En progreso", Orden = 1 },
            new EstadoProyecto { Codigo = "en_pausa",    Nombre = "En pausa",    Orden = 2 },
            new EstadoProyecto { Codigo = "finalizado",  Nombre = "Finalizado",  Orden = 3 }
        );
    }

    private static async Task SeedMonedaAsync(ApplicationDbContext context)
    {
        if (await context.Monedas.AnyAsync()) return;

        context.Monedas.AddRange(
            new Moneda { Codigo = "CRC", Nombre = "Colón costarricense", Orden = 1 },
            new Moneda { Codigo = "USD", Nombre = "Dólar estadounidense", Orden = 2 }
        );
    }

    private static async Task SeedPrioridadTicketAsync(ApplicationDbContext context)
    {
        if (await context.PrioridadesTicket.AnyAsync()) return;

        context.PrioridadesTicket.AddRange(
            new PrioridadTicket { Codigo = "baja", Nombre = "Baja", Orden = 1 },
            new PrioridadTicket { Codigo = "media", Nombre = "Media", Orden = 2 },
            new PrioridadTicket { Codigo = "alta", Nombre = "Alta", Orden = 3 }
        );
    }

    private static async Task SeedEstadoTicketAsync(ApplicationDbContext context)
    {
        if (await context.EstadosTicket.AnyAsync()) return;

        context.EstadosTicket.AddRange(
            new EstadoTicket { Codigo = "por_hacer", Nombre = "Por hacer", Orden = 1 },
            new EstadoTicket { Codigo = "pendiente", Nombre = "Pendiente", Orden = 2 },
            new EstadoTicket { Codigo = "completado", Nombre = "Completado", Orden = 3 }
        );
    }

    private static async Task SeedFormaPagoAsync(ApplicationDbContext context)
    {
        if (await context.FormasPago.AnyAsync()) return;

        context.FormasPago.AddRange(
            new FormaPago { Codigo = "contrato", Nombre = "Por contrato", Orden = 1 },
            new FormaPago { Codigo = "horas", Nombre = "Por horas", Orden = 2 }
        );
    }

    private static async Task SeedEstadoFacturaAsync(ApplicationDbContext context)
    {
        if (await context.EstadosFactura.AnyAsync()) return;

        context.EstadosFactura.AddRange(
            new EstadoFactura { Codigo = "emitida", Nombre = "Emitida", Orden = 1 },
            new EstadoFactura { Codigo = "pagada",  Nombre = "Pagada",  Orden = 2 }
        );
    }

    private static async Task SeedEstadoFinancieroProyectoAsync(ApplicationDbContext context)
    {
        if (await context.EstadosFinancieroProyecto.AnyAsync()) return;

        context.EstadosFinancieroProyecto.AddRange(
            new EstadoFinancieroProyecto { Codigo = "pendiente_de_facturar",  Nombre = "Pendiente de Facturar",  Orden = 1 },
            new EstadoFinancieroProyecto { Codigo = "facturado",              Nombre = "Facturado",              Orden = 2 },
            new EstadoFinancieroProyecto { Codigo = "pendiente_de_cobro",     Nombre = "Pendiente de Cobro",     Orden = 3 },
            new EstadoFinancieroProyecto { Codigo = "pendiente_de_pago",      Nombre = "Pendiente de Pago",      Orden = 4 },
            new EstadoFinancieroProyecto { Codigo = "pagado",                 Nombre = "Pagado",                 Orden = 5 },
            new EstadoFinancieroProyecto { Codigo = "pagado_parcialmente",    Nombre = "Pagado Parcialmente",    Orden = 6 }
        );
    }

    private static async Task SeedCargosAsync(ApplicationDbContext context)
    {
        if (await context.Cargos.AnyAsync()) return;

        context.Cargos.AddRange(
            new Cargo { Codigo = "supervisor", Nombre = "Supervisor", Orden = 1 },
            new Cargo { Codigo = "tecnico",    Nombre = "Técnico",    Orden = 2 }
        );
    }
}
