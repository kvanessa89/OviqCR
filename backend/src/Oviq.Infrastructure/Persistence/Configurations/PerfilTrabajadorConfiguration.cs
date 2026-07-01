using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using Oviq.Domain.Entities;
using Oviq.Infrastructure.Identity;

namespace Oviq.Infrastructure.Persistence.Configurations;

public class PerfilTrabajadorConfiguration : IEntityTypeConfiguration<PerfilTrabajador>
{
    public void Configure(EntityTypeBuilder<PerfilTrabajador> builder)
    {
        builder.Property(p => p.Cargo).HasMaxLength(50).IsRequired();
        builder.Property(p => p.EmailContacto).HasMaxLength(200);
        builder.Property(p => p.Telefono).HasMaxLength(30);

        // Único: garantiza la relación 1 a 1 con Usuario a nivel de base de datos
        builder.HasIndex(p => p.UsuarioId).IsUnique();

        builder.HasOne<ApplicationUser>()
               .WithMany()
               .HasForeignKey(p => p.UsuarioId)
               .OnDelete(DeleteBehavior.Cascade);

        builder.HasOne(p => p.FormaPago)
               .WithMany()
               .HasForeignKey(p => p.FormaPagoId)
               .OnDelete(DeleteBehavior.Restrict);
    }
}
