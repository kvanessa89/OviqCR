using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Oviq.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class MonedaQuitaSimbolo : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "Simbolo",
                table: "Monedas");

            migrationBuilder.AddColumn<int>(
                name: "Orden",
                table: "Monedas",
                type: "integer",
                nullable: false,
                defaultValue: 0);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "Orden",
                table: "Monedas");

            migrationBuilder.AddColumn<string>(
                name: "Simbolo",
                table: "Monedas",
                type: "character varying(5)",
                maxLength: 5,
                nullable: false,
                defaultValue: "");
        }
    }
}
