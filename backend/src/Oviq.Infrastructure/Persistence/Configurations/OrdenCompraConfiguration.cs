using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using Oviq.Domain.Entities;

namespace Oviq.Infrastructure.Persistence.Configurations;

public class OrdenCompraConfiguration : IEntityTypeConfiguration<OrdenCompra>
{
    public void Configure(EntityTypeBuilder<OrdenCompra> builder)
    {
        builder.Property(o => o.NumeroOc).HasMaxLength(50);
        builder.Property(o => o.MontoTotal).HasColumnType("decimal(14,2)");

        builder.HasOne(o => o.Moneda)
               .WithMany()
               .HasForeignKey(o => o.MonedaId)
               .OnDelete(DeleteBehavior.Restrict);

        // La relación 1 a 1 con Proyecto ya se configura en ProyectoConfiguration
        // (HasForeignKey<OrdenCompra>) — no se repite acá para evitar conflictos.
    }
}
