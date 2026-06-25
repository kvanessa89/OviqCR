using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using Oviq.Domain.Entities;

namespace Oviq.Infrastructure.Persistence.Configurations;

public class SubcuentaConfiguration : IEntityTypeConfiguration<Subcuenta>
{
    public void Configure(EntityTypeBuilder<Subcuenta> builder)
    {
        builder.Property(s => s.Nombre).IsRequired().HasMaxLength(150);

        builder.HasOne(s => s.Cliente)
               .WithMany(c => c.Subcuentas)
               .HasForeignKey(s => s.ClienteId)
               .OnDelete(DeleteBehavior.Cascade);

        // Opcional — Clasificacion es solo agrupación visual (ver modelo de datos, regla #2)
        builder.HasOne(s => s.Clasificacion)
               .WithMany(c => c.Subcuentas)
               .HasForeignKey(s => s.ClasificacionId)
               .OnDelete(DeleteBehavior.SetNull);
    }
}
