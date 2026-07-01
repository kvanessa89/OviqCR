using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using Oviq.Domain.Common;
using Oviq.Domain.Entities.Catalogos;

namespace Oviq.Infrastructure.Persistence.Configurations.Catalogos;

public abstract class CatalogoConfiguration<T> : IEntityTypeConfiguration<T> where T : CatalogoBase
{
    public virtual void Configure(EntityTypeBuilder<T> builder)
    {
        builder.Property(c => c.Codigo).IsRequired().HasMaxLength(50);
        builder.Property(c => c.Nombre).IsRequired().HasMaxLength(100);
        builder.HasIndex(c => c.Codigo).IsUnique();
    }
}

public class EstadoClienteConfiguration : CatalogoConfiguration<EstadoCliente> { }
public class EstadoProyectoConfiguration : CatalogoConfiguration<EstadoProyecto> { }
public class PrioridadTicketConfiguration : CatalogoConfiguration<PrioridadTicket> { }
public class EstadoTicketConfiguration : CatalogoConfiguration<EstadoTicket> { }
public class FormaPagoConfiguration : CatalogoConfiguration<FormaPago> { }
public class MonedaConfiguration : CatalogoConfiguration<Moneda> { }
public class EstadoFacturaConfiguration : CatalogoConfiguration<EstadoFactura> { }
public class CargoConfiguration : CatalogoConfiguration<Cargo> { }
public class EstadoFinancieroProyectoConfiguration : CatalogoConfiguration<EstadoFinancieroProyecto> { }