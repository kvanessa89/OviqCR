using Oviq.Domain.Common;

namespace Oviq.Domain.Entities;

// Notas rápidas de los administradores, visibles en la Vista rápida del dashboard.
// CreadoPorId (heredado de BaseEntity) identifica al autor.
public class Nota : BaseEntity
{
    public string Descripcion { get; set; } = string.Empty;
    public bool Completada { get; set; }
}
