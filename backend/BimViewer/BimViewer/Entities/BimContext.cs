using Microsoft.EntityFrameworkCore;
using System.ComponentModel;

namespace BimViewer.Entities
{
    public class BimContext : DbContext
    {
        public BimContext(DbContextOptions<BimContext> options) : base(options) 
        {

        }

        public DbSet<ToDo> ToDo { get; set; }

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            base.OnModelCreating(modelBuilder);
            modelBuilder.Entity<ToDo>(item =>
            {
                item.Property(x => x.Status).HasColumnType("varchar(15)").IsRequired();
                item.Property(x => x.Description).HasColumnType("varchar(200)");
                item.Property(x => x.FragmentMap).HasColumnType("NVARCHAR(MAX)").IsRequired();
                item.Property(X => X.Camera).HasColumnType("NVARCHAR(MAX)").IsRequired();
                //item.Property(x => x.Date).HasConversion<DateOnlyConverter>();
                item.Property(x => x.GlobalId).HasColumnType("NVARCHAR(MAX)").IsRequired();
                item.Property(x => x.FileName).HasColumnType("varchar(50)").IsRequired();
            });
        }
    }
}
