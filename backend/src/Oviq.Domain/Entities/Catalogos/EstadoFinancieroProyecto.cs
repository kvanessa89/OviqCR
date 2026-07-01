using Oviq.Domain.Common;

namespace Oviq.Domain.Entities.Catalogos;

// Uso interno — no editable desde la sección de configuración.
// Codigos: pendiente_de_facturar, facturado, pendiente_de_cobro,
//          pendiente_de_pago, pagado, pagado_parcialmente
public class EstadoFinancieroProyecto : CatalogoBase, IOrdenable
{
    public int Orden { get; set; }
}
