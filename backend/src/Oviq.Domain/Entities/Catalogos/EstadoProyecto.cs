using Oviq.Domain.Common;

namespace Oviq.Domain.Entities.Catalogos;

// Codigo esperado: en_progreso, en_pausa, finalizado
public class EstadoProyecto : CatalogoBase, IOrdenable
{
    public int Orden { get; set; }
}
