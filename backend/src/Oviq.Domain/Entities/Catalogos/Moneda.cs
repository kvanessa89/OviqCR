using Oviq.Domain.Common;

namespace Oviq.Domain.Entities.Catalogos;

// Codigo = código ISO (CRC, USD...)
public class Moneda : CatalogoBase, IOrdenable
{
    public int Orden { get; set; }
}