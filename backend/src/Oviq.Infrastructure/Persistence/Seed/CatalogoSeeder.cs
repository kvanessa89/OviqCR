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
            new EstadoProyecto { Codigo = "en_curso", Nombre = "En curso", Orden = 1 },
            new EstadoProyecto { Codigo = "completado", Nombre = "Completado", Orden = 2 },
            new EstadoProyecto { Codigo = "pendiente_de_facturar", Nombre = "Pendiente de facturar", Orden = 3 },
            new EstadoProyecto { Codigo = "facturado", Nombre = "Facturado", Orden = 4 }
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
}
