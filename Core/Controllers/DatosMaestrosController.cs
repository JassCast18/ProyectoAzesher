using Core.DTOs;
using Core.DTOs.Interfaces;
using Core.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
namespace Core.Controllers;
[Authorize(Roles = "demo,Demo,superusuario,Superusuario,admin,Admin,Administrador")]
[ApiController]
[Route("api/datos-maestros")]
public class DatosMaestrosController(IDatosMaestrosProviderDTO provider) : ControllerBase
{
    [HttpGet("{entidad}")]
    public async Task<IActionResult> Listar(string entidad, [FromQuery] string? query = null) => Ok(new ApiResponse<IEnumerable<dynamic>> { Success = true, Message = "Datos obtenidos correctamente.", Data = await provider.ListarAsync(entidad, query?.Trim() ?? string.Empty) });
    [HttpPost("{entidad}")]
    public async Task<IActionResult> Guardar(string entidad, [FromBody] DatoMaestroGuardarDTO request)
    {
        try { var id = await provider.GuardarAsync(entidad, request.Id, request.Datos); return Ok(new ApiResponse<object> { Success = true, Message = "Configuración guardada.", Data = new { id } }); }
        catch (Exception ex) { return BadRequest(new ApiResponse<object> { Success = false, Message = "No fue posible guardar la configuración.", Errors = ex.Message }); }
    }
    [HttpDelete("{entidad}/{id:int}")]
    public async Task<IActionResult> Desactivar(string entidad, int id)
    {
        try { await provider.DesactivarAsync(entidad, id); return Ok(new ApiResponse<object> { Success = true, Message = "Registro desactivado." }); }
        catch (Exception ex) { return BadRequest(new ApiResponse<object> { Success = false, Message = ex.Message }); }
    }
}
