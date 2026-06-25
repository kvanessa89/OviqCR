using FluentValidation;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using Oviq.API.Middleware;
using Oviq.API.Services;
using Oviq.Application.Auth;
using Oviq.Application.Catalogos;
using Oviq.Application.Clientes;
using Oviq.Application.Clientes.Validators;
using Oviq.Application.Comentarios;
using Oviq.Application.Common.Interfaces;
using Oviq.Application.Proyectos;
using Oviq.Application.Tickets;
using Oviq.Application.Usuarios;
using Oviq.Infrastructure.Identity;
using Oviq.Infrastructure.Persistence;
using Oviq.Infrastructure.Persistence.Seed;
using System.Text;

var builder = WebApplication.CreateBuilder(args);

// ── Base de datos ──────────────────────────────────────────────────────
builder.Services.AddDbContext<ApplicationDbContext>(options =>
    options.UseNpgsql(builder.Configuration.GetConnectionString("DefaultConnection")));

// ── Identity (sin cookies/UI, solo gestión de usuarios/roles) ─────────
builder.Services.AddIdentityCore<ApplicationUser>(options =>
{
    options.Password.RequiredLength = 8;
})
    .AddRoles<ApplicationRole>()
    .AddEntityFrameworkStores<ApplicationDbContext>();

// ── JWT ─────────────────────────────────────────────────────────────
builder.Services.Configure<JwtSettings>(builder.Configuration.GetSection("Jwt"));
var jwtSettings = builder.Configuration.GetSection("Jwt").Get<JwtSettings>()!;

builder.Services.AddAuthentication(options =>
{
    options.DefaultAuthenticateScheme = JwtBearerDefaults.AuthenticationScheme;
    options.DefaultChallengeScheme = JwtBearerDefaults.AuthenticationScheme;
})
.AddJwtBearer(options =>
{
    options.TokenValidationParameters = new TokenValidationParameters
    {
        ValidateIssuer = true,
        ValidateAudience = true,
        ValidateLifetime = true,
        ValidateIssuerSigningKey = true,
        ValidIssuer = jwtSettings.Issuer,
        ValidAudience = jwtSettings.Audience,
        IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtSettings.SecretKey))
    };
});
builder.Services.AddAuthorization();

// ── CORS — orígenes permitidos vienen de appsettings.json (Cors:AllowedOrigins) ──
const string FrontendCorsPolicy = "FrontendPolicy";
var corsOrigins = builder.Configuration.GetSection("Cors:AllowedOrigins").Get<string[]>()
    ?? Array.Empty<string>();

builder.Services.AddCors(options =>
{
    options.AddPolicy(FrontendCorsPolicy, policy =>
    {
        policy.WithOrigins(corsOrigins)
              .AllowAnyHeader()
              .AllowAnyMethod();
        // No usamos AllowCredentials(): el JWT viaja en el header Authorization,
        // no en cookies, así que no hace falta habilitar credenciales cross-origin.
    });
});

// ── Usuario actual / lookup ─────────────────────────────────────────
builder.Services.AddHttpContextAccessor();
builder.Services.AddScoped<ICurrentUserService, CurrentUserService>();
builder.Services.AddScoped<IUsuarioLookupService, UsuarioLookupService>();

// ── IApplicationDbContext -> misma instancia que ApplicationDbContext ──
builder.Services.AddScoped<IApplicationDbContext>(provider =>
    provider.GetRequiredService<ApplicationDbContext>());

// ── Servicios de negocio ────────────────────────────────────────────
builder.Services.AddScoped<IClienteService, ClienteService>();
builder.Services.AddScoped<IProyectoService, ProyectoService>();
builder.Services.AddScoped<ITicketService, TicketService>();
builder.Services.AddScoped<IUsuarioService, UsuarioService>();
builder.Services.AddScoped<IAuthService, AuthService>();
builder.Services.AddScoped<IJwtTokenGenerator, JwtTokenGenerator>();
builder.Services.AddScoped(typeof(ICatalogoService<>), typeof(CatalogoService<>));
builder.Services.AddScoped<IComentarioProyectoService, ComentarioProyectoService>();
builder.Services.AddScoped<IComentarioTicketService, ComentarioTicketService>();

// ── Validadores (FluentValidation) ──────────────────────────────────
builder.Services.AddValidatorsFromAssemblyContaining<CrearClienteValidator>();

builder.Services.AddControllers();

// ── Swagger con soporte de JWT (botón "Authorize") ──────────────────
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen(options =>
{
    options.AddSecurityDefinition("Bearer", new Microsoft.OpenApi.Models.OpenApiSecurityScheme
    {
        Name = "Authorization",
        Type = Microsoft.OpenApi.Models.SecuritySchemeType.Http,
        Scheme = "Bearer",
        BearerFormat = "JWT",
        In = Microsoft.OpenApi.Models.ParameterLocation.Header,
        Description = "Pegá el token así: Bearer {tu_token}"
    });

    options.AddSecurityRequirement(new Microsoft.OpenApi.Models.OpenApiSecurityRequirement
    {
        {
            new Microsoft.OpenApi.Models.OpenApiSecurityScheme
            {
                Reference = new Microsoft.OpenApi.Models.OpenApiReference
                {
                    Type = Microsoft.OpenApi.Models.ReferenceType.SecurityScheme,
                    Id = "Bearer"
                }
            },
            Array.Empty<string>()
        }
    });
});

var app = builder.Build();

// El middleware de errores va primero, envuelve todo lo demás
app.UseMiddleware<ExceptionHandlingMiddleware>();

if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

// Migra y siembra catálogos + roles + usuario admin de prueba al arrancar
using (var scope = app.Services.CreateScope())
{
    var db = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
    await db.Database.MigrateAsync();
    await CatalogoSeeder.SeedAsync(db);

    var roleManager = scope.ServiceProvider.GetRequiredService<RoleManager<ApplicationRole>>();
    await IdentitySeeder.SeedRolesAsync(roleManager);

    var userManager = scope.ServiceProvider.GetRequiredService<UserManager<ApplicationUser>>();
    await IdentitySeeder.SeedAdminUserAsync(userManager);
}

app.UseHttpsRedirection();
app.UseCors(FrontendCorsPolicy);
app.UseAuthentication();
app.UseAuthorization();

app.MapControllers();
app.Run();