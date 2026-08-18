using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Oviq.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class EliminarEstadosFinancierosFacturadoYPendienteCobro : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            // Reasignar proyectos en 'facturado' o 'pendiente_de_cobro' a 'pendiente_de_pago'
            // antes de borrar esas dos filas del catálogo.
            migrationBuilder.Sql(@"
                UPDATE ""Proyectos"" p
                SET ""EstadoFinancieroId"" = pp.""Id""
                FROM ""EstadosFinancieroProyecto"" pp
                WHERE pp.""Codigo"" = 'pendiente_de_pago'
                  AND p.""EstadoFinancieroId"" IN (
                      SELECT ""Id"" FROM ""EstadosFinancieroProyecto"" WHERE ""Codigo"" IN ('facturado', 'pendiente_de_cobro')
                  );

                DELETE FROM ""EstadosFinancieroProyecto"" WHERE ""Codigo"" IN ('facturado', 'pendiente_de_cobro');

                UPDATE ""EstadosFinancieroProyecto"" SET ""Orden"" = 2 WHERE ""Codigo"" = 'pendiente_de_pago';
                UPDATE ""EstadosFinancieroProyecto"" SET ""Orden"" = 3 WHERE ""Codigo"" = 'pagado';
                UPDATE ""EstadosFinancieroProyecto"" SET ""Orden"" = 4 WHERE ""Codigo"" = 'pagado_parcialmente';
            ");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            // No es posible restaurar qué proyectos apuntaban a 'facturado'/'pendiente_de_cobro'
            // antes de la migración Up — solo se recrean las filas del catálogo.
            migrationBuilder.Sql(@"
                UPDATE ""EstadosFinancieroProyecto"" SET ""Orden"" = 4 WHERE ""Codigo"" = 'pendiente_de_pago';
                UPDATE ""EstadosFinancieroProyecto"" SET ""Orden"" = 5 WHERE ""Codigo"" = 'pagado';
                UPDATE ""EstadosFinancieroProyecto"" SET ""Orden"" = 6 WHERE ""Codigo"" = 'pagado_parcialmente';

                INSERT INTO ""EstadosFinancieroProyecto"" (""Codigo"", ""Nombre"", ""Orden"", ""Activo"", ""CreadoEn"")
                VALUES
                    ('facturado', 'Facturado', 2, true, now()),
                    ('pendiente_de_cobro', 'Pendiente de Cobro', 3, true, now());
            ");
        }
    }
}
