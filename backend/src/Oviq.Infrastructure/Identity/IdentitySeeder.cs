using Microsoft.AspNetCore.Identity;

namespace Oviq.Infrastructure.Identity;

// Roles fijos — NO son un catálogo editable. Renombrarlos rompería los
// [Authorize(Roles = "Administrador")] que dependen del nombre exacto en el código.
public static class IdentitySeeder
{
    private static readonly string[] Roles = { "Administrador", "Trabajador" };

    public static async Task SeedRolesAsync(RoleManager<ApplicationRole> roleManager)
    {
        foreach (var rol in Roles)
        {
            if (!await roleManager.RoleExistsAsync(rol))
                await roleManager.CreateAsync(new ApplicationRole { Name = rol });
        }
    }

    // Usuario de prueba para poder probar /api/auth/login antes de tener un
    // endpoint real de creación de usuarios (UsuariosController). Cuando ese
    // controller exista, este seed se puede quitar — créditos: admin@oviq.com.
    public static async Task SeedAdminUserAsync(UserManager<ApplicationUser> userManager)
    {
        const string email = "admin@oviq.com";
        const string password = "Admin123!";

        if (await userManager.FindByEmailAsync(email) is not null) return;

        var admin = new ApplicationUser
        {
            UserName = email,
            Email = email,
            Nombre = "Administrador Oviq",
            EmailConfirmed = true
        };

        var resultado = await userManager.CreateAsync(admin, password);
        if (resultado.Succeeded)
        {
            await userManager.AddToRoleAsync(admin, "Administrador");
        }
    }
}
