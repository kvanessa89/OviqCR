using Oviq.Application.Catalogos.Dtos;
using Oviq.Domain.Common;

namespace Oviq.Application.Catalogos;

public interface ICatalogoService<T> where T : CatalogoBase
{
    Task<List<CatalogoDto>> ObtenerActivosAsync(CancellationToken cancellationToken = default);
    Task<CatalogoDto> CrearAsync(CrearCatalogoDto dto, CancellationToken cancellationToken = default);
    Task ActualizarAsync(int id, ActualizarCatalogoDto dto, CancellationToken cancellationToken = default);
    Task DesactivarAsync(int id, CancellationToken cancellationToken = default);
}
