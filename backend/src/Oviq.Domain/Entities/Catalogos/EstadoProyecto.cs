using Oviq.Domain.Common;

namespace Oviq.Domain.Entities.Catalogos;

// Codigo esperado: en_curso, completado, pendiente_de_facturar, facturado
public class EstadoProyecto : CatalogoBase, IOrdenable
{
    public int Orden { get; set; }
}
