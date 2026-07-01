using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using Oviq.Domain.Entities;

namespace Oviq.Infrastructure.Persistence.Configurations;

public class PagoProyectoConfiguration : IEntityTypeConfiguration<PagoProyecto>
{
    public void Configure(EntityTypeBuilder<PagoProyecto> builder)
    {
        builder.Property(p => p.Monto).HasPrecision(18, 2);
        builder.Property(p => p.FechaPago).IsRequired();

        builder.HasOne(p => p.Proyecto)
               .WithMany(pr => pr.Pagos)
               .HasForeignKey(p => p.ProyectoId)
               .OnDelete(DeleteBehavior.Cascade);

        builder.HasOne(p => p.Factura)
               .WithMany(f => f.Pagos)
               .HasForeignKey(p => p.FacturaId)
               .OnDelete(DeleteBehavior.SetNull);
    }
}
