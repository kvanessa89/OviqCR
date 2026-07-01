using Oviq.Domain.Common;

namespace Oviq.Domain.Entities.Catalogos;

// Codigos esperados: emitida, pagada
// "Vencida" NO se guarda — se calcula cuando estado.Codigo == "emitida" && fechaVencimiento < hoy
public class EstadoFactura : CatalogoBase, IOrdenable
{
    public int Orden { get; set; }
}
