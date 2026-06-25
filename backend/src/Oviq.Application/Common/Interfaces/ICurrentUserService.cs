namespace Oviq.Application.Common.Interfaces;

// La implementación concreta vive en Oviq.API (lee el claim del JWT vía IHttpContextAccessor).
// Infrastructure solo conoce esta interfaz — nunca a su implementación — para no romper
// la regla de dependencias de Clean Architecture (Infrastructure no puede referenciar API).
public interface ICurrentUserService
{
    int? UsuarioId { get; }
}
