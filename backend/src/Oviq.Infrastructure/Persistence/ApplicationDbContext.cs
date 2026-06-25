using Microsoft.AspNetCore.Identity.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore;
using Oviq.Application.Common.Interfaces;
using Oviq.Domain.Common;
using Oviq.Domain.Entities;
using Oviq.Domain.Entities.Catalogos;
using Oviq.Infrastructure.Identity;

namespace Oviq.Infrastructure.Persistence;

public class ApplicationDbContext : IdentityDbContext<ApplicationUser, ApplicationRole, int>, IApplicationDbContext
{
    private readonly ICurrentUserService? _currentUser;

    public ApplicationDbContext(
        DbContextOptions<ApplicationDbContext> options,
        ICurrentUserService? currentUser = null)
        : base(options)
    {
        _currentUser = currentUser;
    }

    // Entidades principales
    public DbSet<Cliente> Clientes => Set<Cliente>();
    public DbSet<Clasificacion> Clasificaciones => Set<Clasificacion>();
    public DbSet<Subcuenta> Subcuentas => Set<Subcuenta>();
    public DbSet<Proyecto> Proyectos => Set<Proyecto>();
    public DbSet<OrdenCompra> OrdenesCompra => Set<OrdenCompra>();
    public DbSet<Ticket> Tickets => Set<Ticket>();
    public DbSet<ComentarioProyecto> Comentarios => Set<ComentarioProyecto>();
    public DbSet<PerfilTrabajador> PerfilesTrabajador => Set<PerfilTrabajador>();

    // Catálogos
    public DbSet<EstadoCliente> EstadosCliente => Set<EstadoCliente>();
    public DbSet<EstadoProyecto> EstadosProyecto => Set<EstadoProyecto>();
    public DbSet<Moneda> Monedas => Set<Moneda>();
    public DbSet<PrioridadTicket> PrioridadesTicket => Set<PrioridadTicket>();
    public DbSet<EstadoTicket> EstadosTicket => Set<EstadoTicket>();
    public DbSet<FormaPago> FormasPago => Set<FormaPago>();

    protected override void OnModelCreating(ModelBuilder builder)
    {
        base.OnModelCreating(builder);

        // Aplica automáticamente todas las clases IEntityTypeConfiguration<T> que
        // existan en este proyecto (carpeta Configurations/) — no hace falta
        // registrar cada una a mano acá.
        builder.ApplyConfigurationsFromAssembly(typeof(ApplicationDbContext).Assembly);
    }

    public override Task<int> SaveChangesAsync(CancellationToken cancellationToken = default)
    {
        var ahora = DateTime.UtcNow;
        var usuarioId = _currentUser?.UsuarioId;

        foreach (var entry in ChangeTracker.Entries<BaseEntity>())
        {
            if (entry.State == EntityState.Added)
            {
                entry.Entity.CreadoEn = ahora;
                entry.Entity.CreadoPorId = usuarioId;
            }
            else if (entry.State == EntityState.Modified)
            {
                entry.Entity.ModificadoEn = ahora;
                entry.Entity.ModificadoPorId = usuarioId;
            }
        }

        return base.SaveChangesAsync(cancellationToken);
    }
}
