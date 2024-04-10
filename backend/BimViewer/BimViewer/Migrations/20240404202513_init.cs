using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace BimViewer.Migrations
{
    /// <inheritdoc />
    public partial class init : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "ToDo",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    Description = table.Column<string>(type: "varchar(200)", nullable: false),
                    Status = table.Column<string>(type: "varchar(15)", nullable: false),
                    FragmentMap = table.Column<string>(type: "NVARCHAR(MAX)", nullable: false),
                    Date = table.Column<DateTime>(type: "datetime2", nullable: false),
                    Camera = table.Column<string>(type: "NVARCHAR(MAX)", nullable: false),
                    GlobalId = table.Column<string>(type: "NVARCHAR(MAX)", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ToDo", x => x.Id);
                });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "ToDo");
        }
    }
}
