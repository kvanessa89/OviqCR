using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using Oviq.Domain.Entities;
using Oviq.Infrastructure.Identity;

namespace Oviq.Infrastructure.Persistence.Configurations;

public class ComentarioTicketConfiguration : IEntityTypeConfiguration<ComentarioTicket>
{
    public void Configure(EntityTypeBuilder<ComentarioTicket> builder)
    {
        builder.Property(c => c.Texto).IsRequired();

        builder.HasOne(c => c.Ticket)
               .WithMany(t => t.Comentarios)
               .HasForeignKey(c => c.TicketId)
               .OnDelete(DeleteBehavior.Cascade);

        builder.HasOne<ApplicationUser>()
               .WithMany()
               .HasForeignKey(c => c.UsuarioId)
               .OnDelete(DeleteBehavior.Restrict);
    }
}