using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using Oviq.Domain.Entities;

namespace Oviq.Infrastructure.Persistence.Configurations;

public class ClienteConfiguration : IEntityTypeConfiguration<Cliente>
{
    public void Configure(EntityTypeBuilder<Cliente> builder)
    {
        builder.Property(c => c.Nombre).IsRequired().HasMaxLength(150);
        builder.Property(c => c.Email).HasMaxLength(150);
        builder.Property(c => c.Telefono).HasMaxLength(30);

        builder.HasOne(c => c.Estado)
               .WithMany()
               .HasForeignKey(c => c.EstadoId)
               .OnDelete(DeleteBehavior.Restrict);
    }
}
