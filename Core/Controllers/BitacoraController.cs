using Core.DTOs.Interfaces;
using Core.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
namespace Core.Controllers;
[Authorize(Roles="demo,Demo,superusuario,Superusuario,admin,Admin,Administrador,administrador"),ApiController,Route("api/bitacora")]
public class BitacoraController(IBitacoraProviderDTO provider):ControllerBase
{
 [HttpGet] public async Task<IActionResult> Consultar(string? texto=null,int? idUsuario=null,int? idSucursal=null,string? modulo=null,string? accion=null,string? resultado=null,DateTime? fechaDesde=null,DateTime? fechaHasta=null,int pagina=1,int tamanoPagina=25)
 {var rows=await provider.ConsultarAsync(texto?.Trim()??"",idUsuario,idSucursal,modulo?.Trim()??"",accion?.Trim()??"",resultado?.Trim()??"",fechaDesde,fechaHasta,pagina,tamanoPagina);return Ok(new ApiResponse<object>{Success=true,Message="Bitácora obtenida.",Data=new{Registros=rows,Total=rows.FirstOrDefault()?.TotalRegistros??0,Pagina=pagina,TamanoPagina=tamanoPagina}});}
}
