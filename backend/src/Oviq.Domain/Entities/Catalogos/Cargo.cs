using Oviq.Domain.Common;

namespace Oviq.Domain.Entities.Catalogos;

public class Cargo : CatalogoBase, IOrdenable
{
    public int Orden { get; set; }
}
