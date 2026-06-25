namespace Oviq.Application.Common.Interfaces;

public interface IJwtTokenGenerator
{
    (string Token, DateTime ExpiraEn) GenerarToken(
        int usuarioId, string email, string nombre, IList<string> roles);
}
