# Oviq — Contexto del proyecto

## Stack
- Backend: .NET 8 Web API, Clean Architecture (Domain / Application / Infrastructure / API)
- Base de datos: PostgreSQL + Entity Framework Core
- Auth: ASP.NET Core Identity + JWT, roles fijos: Administrador y Trabajador
- Frontend: React + TypeScript (Vite)
- Monorepo: backend/ y frontend/ en el mismo repositorio

## Convenciones
- Nombres de entidades, propiedades y tablas de negocio en español (Cliente, Proyecto, Ticket, estado_id, etc.)
- Todas las entidades heredan de BaseEntity (Id, CreadoEn, CreadoPorId, ModificadoEn, ModificadoPorId) en Oviq.Domain/Common
- Reglas de dependencias: Domain no depende de nada. Application depende solo de Domain. Infrastructure depende de Application y Domain. API depende de todas.

## Patrones clave
- Catálogos editables (EstadoCliente, EstadoProyecto, Moneda, PrioridadTicket, EstadoTicket, FormaPago) comparten estructura: id, codigo (inmutable, lo usa el backend), nombre (editable por el Administrador), activo, orden. Usan un servicio y controller genéricos en vez de duplicar código por catálogo.
- Roles (Administrador, Trabajador) se manejan con AspNetRoles/AspNetUserRoles de Identity — NO son un catálogo editable, porque están acoplados a [Authorize(Roles = "...")] en el código.
- PerfilTrabajador es una tabla aparte (1 a 1 con Usuario) para datos de pago — solo existe si el usuario tiene rol Trabajador.
- Proyecto.cliente_id y Proyecto.subcuenta_id deben ser consistentes entre sí (si hay subcuenta, su cliente_id debe coincidir) — se valida en la capa Application, no en la base de datos.

## Estado actual
Recién creada la estructura base. Pendiente: definir entidades de Domain, DbContext, configuraciones de EF Core, y los primeros endpoints (Clientes, Proyectos, Tickets).
