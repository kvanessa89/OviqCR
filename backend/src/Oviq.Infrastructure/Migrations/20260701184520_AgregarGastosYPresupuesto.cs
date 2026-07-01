using System;
using Microsoft.EntityFrameworkCore.Migrations;
using Npgsql.EntityFrameworkCore.PostgreSQL.Metadata;

#nullable disable

namespace Oviq.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AgregarGastosYPresupuesto : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<int>(
                name: "EstadoFinancieroId",
                table: "Proyectos",
                type: "integer",
                nullable: true);

            migrationBuilder.AddColumn<decimal>(
                name: "PresupuestoInicial",
                table: "Proyectos",
                type: "numeric(18,2)",
                precision: 18,
                scale: 2,
                nullable: true);

            migrationBuilder.CreateTable(
                name: "GastosProyecto",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    ProyectoId = table.Column<int>(type: "integer", nullable: false),
                    Rubro = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: false),
                    Monto = table.Column<decimal>(type: "numeric(18,2)", precision: 18, scale: 2, nullable: false),
                    CreadoEn = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    CreadoPorId = table.Column<int>(type: "integer", nullable: true),
                    ModificadoEn = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    ModificadoPorId = table.Column<int>(type: "integer", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_GastosProyecto", x => x.Id);
                    table.ForeignKey(
                        name: "FK_GastosProyecto_Proyectos_ProyectoId",
                        column: x => x.ProyectoId,
                        principalTable: "Proyectos",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_Proyectos_EstadoFinancieroId",
                table: "Proyectos",
                column: "EstadoFinancieroId");

            migrationBuilder.CreateIndex(
                name: "IX_GastosProyecto_ProyectoId",
                table: "GastosProyecto",
                column: "ProyectoId");

            migrationBuilder.AddForeignKey(
                name: "FK_Proyectos_EstadosFinancieroProyecto_EstadoFinancieroId",
                table: "Proyectos",
                column: "EstadoFinancieroId",
                principalTable: "EstadosFinancieroProyecto",
                principalColumn: "Id",
                onDelete: ReferentialAction.Restrict);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Proyectos_EstadosFinancieroProyecto_EstadoFinancieroId",
                table: "Proyectos");

            migrationBuilder.DropTable(
                name: "GastosProyecto");

            migrationBuilder.DropIndex(
                name: "IX_Proyectos_EstadoFinancieroId",
                table: "Proyectos");

            migrationBuilder.DropColumn(
                name: "EstadoFinancieroId",
                table: "Proyectos");

            migrationBuilder.DropColumn(
                name: "PresupuestoInicial",
                table: "Proyectos");
        }
    }
}
