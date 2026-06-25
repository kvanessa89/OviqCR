using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using Oviq.Domain.Entities;
using Oviq.Infrastructure.Identity;

namespace Oviq.Infrastructure.Persistence.Configurations;

public class ComentarioProyectoConfiguration : IEntityTypeConfiguration<ComentarioProyecto>
{
    public void Configure(EntityTypeBuilder<ComentarioProyecto> builder)
    {
        builder.Property(c => c.Texto).IsRequired();

        builder.HasOne(c => c.Proyecto)
               .WithMany(p => p.Comentarios)
               .HasForeignKey(c => c.ProyectoId)
               .OnDelete(DeleteBehavior.Cascade);

        builder.HasOne<ApplicationUser>()
               .WithMany()
               .HasForeignKey(c => c.UsuarioId)
               .OnDelete(DeleteBehavior.Restrict);
    }
}