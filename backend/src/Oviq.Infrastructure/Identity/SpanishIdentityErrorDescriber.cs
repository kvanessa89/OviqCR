using Microsoft.AspNetCore.Identity;

namespace Oviq.Infrastructure.Identity;

public class SpanishIdentityErrorDescriber : IdentityErrorDescriber
{
    public override IdentityError PasswordTooShort(int length) => new()
        { Code = nameof(PasswordTooShort), Description = $"La contraseña debe tener al menos {length} caracteres." };

    public override IdentityError PasswordRequiresNonAlphanumeric() => new()
        { Code = nameof(PasswordRequiresNonAlphanumeric), Description = "La contraseña debe contener al menos un carácter especial." };

    public override IdentityError PasswordRequiresDigit() => new()
        { Code = nameof(PasswordRequiresDigit), Description = "La contraseña debe contener al menos un número (0-9)." };

    public override IdentityError PasswordRequiresLower() => new()
        { Code = nameof(PasswordRequiresLower), Description = "La contraseña debe contener al menos una letra minúscula (a-z)." };

    public override IdentityError PasswordRequiresUpper() => new()
        { Code = nameof(PasswordRequiresUpper), Description = "La contraseña debe contener al menos una letra mayúscula (A-Z)." };

    public override IdentityError PasswordRequiresUniqueChars(int uniqueChars) => new()
        { Code = nameof(PasswordRequiresUniqueChars), Description = $"La contraseña debe contener al menos {uniqueChars} caracteres únicos." };

    public override IdentityError DuplicateEmail(string email) => new()
        { Code = nameof(DuplicateEmail), Description = $"El email '{email}' ya está registrado." };

    public override IdentityError DuplicateUserName(string userName) => new()
        { Code = nameof(DuplicateUserName), Description = $"El nombre de usuario '{userName}' ya está en uso." };

    public override IdentityError InvalidEmail(string? email) => new()
        { Code = nameof(InvalidEmail), Description = $"El email '{email}' no es válido." };

    public override IdentityError InvalidUserName(string? userName) => new()
        { Code = nameof(InvalidUserName), Description = $"El nombre de usuario '{userName}' no es válido." };
}
