using Oviq.Domain.Common;

namespace Oviq.Domain.Entities.Catalogos;

// Codigo esperado: por_hacer, pendiente, completado
public class EstadoTicket : CatalogoBase, IOrdenable
{
    public int Orden { get; set; }
}
