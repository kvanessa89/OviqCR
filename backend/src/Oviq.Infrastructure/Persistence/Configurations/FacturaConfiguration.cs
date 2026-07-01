using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using Oviq.Domain.Entities;

namespace Oviq.Infrastructure.Persistence.Configurations;

public class FacturaConfiguration : IEntityTypeConfiguration<Factura>
{
    public void Configure(EntityTypeBuilder<Factura> builder)
    {
        builder.Property(f => f.Numero).IsRequired().HasMaxLength(50);
        builder.Property(f => f.Monto).HasColumnType("decimal(14,2)");
        builder.Property(f => f.ArchivoUrl).HasMaxLength(500);

        builder.HasOne(f => f.Proyecto)
               .WithMany(p => p.Facturas)
               .HasForeignKey(f => f.ProyectoId)
               .OnDelete(DeleteBehavior.Restrict);

        builder.HasOne(f => f.Cliente)
               .WithMany()
               .HasForeignKey(f => f.ClienteId)
               .OnDelete(DeleteBehavior.Restrict);

        builder.HasOne(f => f.Subcuenta)
               .WithMany()
               .HasForeignKey(f => f.SubcuentaId)
               .OnDelete(DeleteBehavior.Restrict);

        builder.HasOne(f => f.Moneda)
               .WithMany()
               .HasForeignKey(f => f.MonedaId)
               .OnDelete(DeleteBehavior.Restrict);

        builder.HasOne(f => f.Estado)
               .WithMany()
               .HasForeignKey(f => f.EstadoId)
               .OnDelete(DeleteBehavior.Restrict);
    }
}
