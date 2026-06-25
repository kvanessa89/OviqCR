using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using Oviq.Domain.Entities;
using Oviq.Infrastructure.Identity;

namespace Oviq.Infrastructure.Persistence.Configurations;

public class TicketConfiguration : IEntityTypeConfiguration<Ticket>
{
    public void Configure(EntityTypeBuilder<Ticket> builder)
    {
        builder.Property(t => t.Codigo).IsRequired().HasMaxLength(20);
        builder.Property(t => t.Titulo).IsRequired().HasMaxLength(200);

        // El secuencial se reinicia por proyecto — esta es la regla a nivel de BD
        builder.HasIndex(t => new { t.ProyectoId, t.NumeroSecuencial }).IsUnique();

        builder.HasOne(t => t.Proyecto)
               .WithMany(p => p.Tickets)
               .HasForeignKey(t => t.ProyectoId)
               .OnDelete(DeleteBehavior.Cascade);

        builder.HasOne(t => t.Prioridad)
               .WithMany()
               .HasForeignKey(t => t.PrioridadId)
               .OnDelete(DeleteBehavior.Restrict);

        builder.HasOne(t => t.Estado)
               .WithMany()
               .HasForeignKey(t => t.EstadoId)
               .OnDelete(DeleteBehavior.Restrict);

        // Sin navigation property hacia ApplicationUser: Ticket (Domain) no puede
        // conocer ApplicationUser (Infrastructure). HasOne<T>() sin lambda de
        // navegación igual crea el FK real en la base de datos — solo que no se
        // puede hacer .Include(t => t.Usuario) desde Domain, hay que resolverlo
        // con un join explícito del lado de Application/Infrastructure.
        // SetNull: si se borra el usuario, el ticket queda "sin asignar".
        builder.HasOne<ApplicationUser>()
               .WithMany()
               .HasForeignKey(t => t.UsuarioId)
               .OnDelete(DeleteBehavior.SetNull);
    }
}
