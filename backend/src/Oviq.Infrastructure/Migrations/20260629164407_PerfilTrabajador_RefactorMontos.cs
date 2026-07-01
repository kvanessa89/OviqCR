using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Oviq.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class PerfilTrabajador_RefactorMontos : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "MontoContrato",
                table: "PerfilesTrabajador");

            migrationBuilder.DropColumn(
                name: "TarifaHora",
                table: "PerfilesTrabajador");

            migrationBuilder.AddColumn<string>(
                name: "Cargo",
                table: "PerfilesTrabajador",
                type: "character varying(50)",
                maxLength: 50,
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<string>(
                name: "EmailContacto",
                table: "PerfilesTrabajador",
                type: "character varying(200)",
                maxLength: 200,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "Telefono",
                table: "PerfilesTrabajador",
                type: "character varying(30)",
                maxLength: 30,
                nullable: true);

            migrationBuilder.AddColumn<bool>(
                name: "Activo",
                table: "AspNetUsers",
                type: "boolean",
                nullable: false,
                defaultValue: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "Cargo",
                table: "PerfilesTrabajador");

            migrationBuilder.DropColumn(
                name: "EmailContacto",
                table: "PerfilesTrabajador");

            migrationBuilder.DropColumn(
                name: "Telefono",
                table: "PerfilesTrabajador");

            migrationBuilder.DropColumn(
                name: "Activo",
                table: "AspNetUsers");

            migrationBuilder.AddColumn<decimal>(
                name: "MontoContrato",
                table: "PerfilesTrabajador",
                type: "numeric(10,2)",
                nullable: true);

            migrationBuilder.AddColumn<decimal>(
                name: "TarifaHora",
                table: "PerfilesTrabajador",
                type: "numeric(10,2)",
                nullable: true);
        }
    }
}
