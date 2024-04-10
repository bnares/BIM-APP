using BimViewer.Dto;
using BimViewer.Entities;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using System.ComponentModel;
using System.Text.Json;

namespace BimViewer.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class ToDoController : ControllerBase
    {
        private readonly BimContext _context;

        public ToDoController(BimContext context)
        {
            _context = context;
        }

        [HttpGet("allToDos/{fileName}")]
        public async Task<ActionResult<List<ToDo>>> GetAllToDos([FromRoute] string fileName)
        {
            var toDos = await _context.ToDo.Where(x=>x.FileName.StartsWith(fileName)).ToListAsync();
             return Ok(toDos);
        }

        [HttpGet("getToDo/{fileName}/{id}", Name ="GetToDo")]
        public async Task<ActionResult<ToDo>> GetToDoById([FromRoute] string fileName ,int id)
        {
            var toDo = await _context.ToDo.Where(x=>x.FileName.StartsWith(fileName)).FirstOrDefaultAsync(x => x.Id == id);
            if (toDo == null) return NotFound(new ProblemDetails() { Title = "No such ToDo" });
            return Ok(toDo);
        }

        [HttpDelete("removeToDo/{id}")]
        public async Task<ActionResult> DeleteToDo(int id)
        {
            var todoToDelete = await _context.ToDo.FirstOrDefaultAsync(x => x.Id == id);
            if (todoToDelete == null) return NotFound(new ProblemDetails() { Title = "No such ToDo" });
            _context.ToDo.Remove(todoToDelete);
            if (await _context.SaveChangesAsync() > 0) return Ok();
            return BadRequest(new ProblemDetails() { Title="Cant save changes"});
        }

        [HttpPost("newToDo")]
        public async Task<ActionResult<ToDo>> AddNewToDo(ToDoDto dto)
        {
            if (dto.Status.IsNullOrEmpty() || dto.GlobalId.Count == 0 || dto.FragmentMap.Length == 0 || dto.Camera.Length == 0 || dto.FileName =="") return BadRequest(new ProblemDetails() { Title = "Wrong Form data" });
            var toDo = new ToDo();
            var globalId = String.Join(";", dto.GlobalId);

            var fragmentMapAsString = dto.FragmentMap.ToString(); //JsonSerializer.Serialize(dto.FragmentMap);
            var cameraAsString = dto.Camera.ToString(); //JsonSerializer.Serialize(dto.Camera);
            toDo.Status = dto.Status;
            toDo.Date = dto.Date;
            toDo.Description = dto.Description;
            toDo.Camera = cameraAsString;
            toDo.FragmentMap = fragmentMapAsString;
            toDo.GlobalId = globalId;
            toDo.FileName = dto.FileName;
            await _context.ToDo.AddAsync(toDo);
            if (await _context.SaveChangesAsync() > 0) return Ok(toDo); //CreatedAtRoute("getToDo/"+toDo.Id, toDo);
            return BadRequest(new ProblemDetails() { Title = "Cant save changes" });

        }
    }


}
