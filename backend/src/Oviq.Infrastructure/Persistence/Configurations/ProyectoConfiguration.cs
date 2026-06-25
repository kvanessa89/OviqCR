using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using Oviq.Domain.Entities;

namespace Oviq.Infrastructure.Persistence.Configurations;

public class ProyectoConfiguration : IEntityTypeConfiguration<Proyecto>
{
    public void Configure(EntityTypeBuilder<Proyecto> builder)
    {
        builder.Property(p => p.Nombre).IsRequired().HasMaxLength(200);

        // Restrict (no Cascade): no se puede borrar un Cliente/Subcuenta mientras
        // tengan Proyectos — protege contra pérdida accidental de datos de negocio.
        builder.HasOne(p => p.Cliente)
               .WithMany(c => c.Proyectos)
               .HasForeignKey(p => p.ClienteId)
               .OnDelete(DeleteBehavior.Restrict);

        builder.HasOne(p => p.Subcuenta)
               .WithMany(s => s.Proyectos)
               .HasForeignKey(p => p.SubcuentaId)
               .OnDelete(DeleteBehavior.Restrict);

        builder.HasOne(p => p.Estado)
               .WithMany()
               .HasForeignKey(p => p.EstadoId)
               .OnDelete(DeleteBehavior.Restrict);

        // Relación 1 a 1 con OrdenCompra
        builder.HasOne(p => p.OrdenCompra)
               .WithOne(o => o.Proyecto)
               .HasForeignKey<OrdenCompra>(o => o.ProyectoId);
    }
}
