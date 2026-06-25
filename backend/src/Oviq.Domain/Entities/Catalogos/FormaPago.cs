using Oviq.Domain.Common;

namespace Oviq.Domain.Entities.Catalogos;

// Codigo esperado: contrato, horas
public class FormaPago : CatalogoBase, IOrdenable
{
    public int Orden { get; set; }
}
