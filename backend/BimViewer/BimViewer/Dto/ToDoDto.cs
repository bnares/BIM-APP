namespace BimViewer.Dto
{
    public class ToDoDto
    {
        public DateTime Date { get; set; }
        public string Description { get; set; }
        public string Status { get; set; }
        public string FragmentMap { get; set; }
        public string Camera { get; set; }
        public List<string> GlobalId { get; set; }
        public string FileName { get; set; }


    }
}
