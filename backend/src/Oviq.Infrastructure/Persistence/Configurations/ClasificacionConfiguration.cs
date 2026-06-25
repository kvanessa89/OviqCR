using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using Oviq.Domain.Entities;

namespace Oviq.Infrastructure.Persistence.Configurations;

public class ClasificacionConfiguration : IEntityTypeConfiguration<Clasificacion>
{
    public void Configure(EntityTypeBuilder<Clasificacion> builder)
    {
        builder.Property(c => c.Nombre).IsRequired().HasMaxLength(150);

        builder.HasOne(c => c.Cliente)
               .WithMany(cl => cl.Clasificaciones)
               .HasForeignKey(c => c.ClienteId)
               .OnDelete(DeleteBehavior.Cascade);
    }
}
