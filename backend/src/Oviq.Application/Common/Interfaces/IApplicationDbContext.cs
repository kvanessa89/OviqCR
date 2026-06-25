using Microsoft.EntityFrameworkCore;
using Oviq.Domain.Entities;
using Oviq.Domain.Entities.Catalogos;

namespace Oviq.Application.Common.Interfaces;

// Application solo conoce esta interfaz, nunca la implementación real de EF Core
// (ApplicationDbContext vive en Infrastructure) — permite testear los services
// sin necesitar una base de datos real.
public interface IApplicationDbContext
{
    // Acceso genérico, usado por servicios genéricos como CatalogoService<T>.
    // ApplicationDbContext lo satisface gratis: ya lo hereda de DbContext.
    DbSet<TEntity> Set<TEntity>() where TEntity : class;

    DbSet<Cliente> Clientes { get; }
    DbSet<Clasificacion> Clasificaciones { get; }
    DbSet<Subcuenta> Subcuentas { get; }
    DbSet<Proyecto> Proyectos { get; }
    DbSet<OrdenCompra> OrdenesCompra { get; }
    DbSet<Ticket> Tickets { get; }
    DbSet<ComentarioProyecto> ComentariosProyecto => Set<ComentarioProyecto>();
    DbSet<ComentarioTicket> ComentariosTicket => Set<ComentarioTicket>();
    DbSet<PerfilTrabajador> PerfilesTrabajador { get; }

    DbSet<EstadoCliente> EstadosCliente { get; }
    DbSet<EstadoProyecto> EstadosProyecto { get; }
    DbSet<Moneda> Monedas { get; }
    DbSet<PrioridadTicket> PrioridadesTicket { get; }
    DbSet<EstadoTicket> EstadosTicket { get; }
    DbSet<FormaPago> FormasPago { get; }

    Task<int> SaveChangesAsync(CancellationToken cancellationToken = default);
}
