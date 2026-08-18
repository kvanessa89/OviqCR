using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Oviq.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AgregarFechaFinalizadoProyecto : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<DateTime>(
                name: "FechaFinalizado",
                table: "Proyectos",
                type: "timestamp with time zone",
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "FechaFinalizado",
                table: "Proyectos");
        }
    }
}
