using Oviq.Domain.Common;

namespace Oviq.Domain.Entities.Catalogos;

// Orden controla la secuencia Baja -> Media -> Alta en los dropdowns (no alfabético)
public class PrioridadTicket : CatalogoBase, IOrdenable
{
    public int Orden { get; set; }
}
