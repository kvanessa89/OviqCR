using Oviq.Domain.Common;

namespace Oviq.Domain.Entities.Catalogos;

public class EstadoCliente : CatalogoBase, IOrdenable
{
    public int Orden { get; set; }
}
