using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using Oviq.Domain.Entities;

namespace Oviq.Infrastructure.Persistence.Configurations;

public class GastoProyectoConfiguration : IEntityTypeConfiguration<GastoProyecto>
{
    public void Configure(EntityTypeBuilder<GastoProyecto> builder)
    {
        builder.Property(g => g.Rubro).IsRequired().HasMaxLength(200);
        builder.Property(g => g.Monto).HasPrecision(18, 2);

        builder.HasOne(g => g.Proyecto)
               .WithMany(p => p.Gastos)
               .HasForeignKey(g => g.ProyectoId)
               .OnDelete(DeleteBehavior.Cascade);
    }
}
