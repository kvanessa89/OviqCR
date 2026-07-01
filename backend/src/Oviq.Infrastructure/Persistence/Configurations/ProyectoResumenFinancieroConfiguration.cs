using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using Oviq.Domain.Entities;

namespace Oviq.Infrastructure.Persistence.Configurations;

public class ProyectoResumenFinancieroConfiguration : IEntityTypeConfiguration<ProyectoResumenFinanciero>
{
    public void Configure(EntityTypeBuilder<ProyectoResumenFinanciero> builder)
    {
        builder.Property(r => r.TotalFacturado).HasPrecision(18, 2);
        builder.Property(r => r.TotalCostos).HasPrecision(18, 2);
        builder.Property(r => r.UtilidadNeta).HasPrecision(18, 2);

        builder.HasOne(r => r.Proyecto)
               .WithOne(p => p.ResumenFinanciero)
               .HasForeignKey<ProyectoResumenFinanciero>(r => r.ProyectoId)
               .OnDelete(DeleteBehavior.Cascade);
    }
}
