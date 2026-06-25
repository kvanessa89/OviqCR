namespace Oviq.Domain.Common;

// Implementada por los catálogos que tienen orden de aparición en dropdowns
// (todos excepto Moneda, que no la necesita). La usa CatalogoService<T> genérico
// en Application para poder hacer .OrderBy(c => c.Orden) sin conocer el tipo concreto.
public interface IOrdenable
{
    int Orden { get; set; }
}
