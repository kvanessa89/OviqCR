using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Oviq.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AgregarNotaPendienteTicket : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "NotaPendiente",
                table: "Tickets",
                type: "character varying(1000)",
                maxLength: 1000,
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "NotaPendiente",
                table: "Tickets");
        }
    }
}
