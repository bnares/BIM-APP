using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace BimViewer.Migrations
{
    /// <inheritdoc />
    public partial class columnfilenameadded : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "FileName",
                table: "ToDo",
                type: "varchar(50)",
                nullable: false,
                defaultValue: "");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "FileName",
                table: "ToDo");
        }
    }
}
