using System.Security.Claims;
using Core.DTOs;
using Core.DTOs.Interfaces;
using Core.Models;
using Core.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
namespace Core.Controllers;
[Authorize,ApiController,Route("api/cobros")]
public class CobrosController(ICobroProviderDTO provider):ControllerBase
{
    [HttpGet] public async Task<IActionResult> Listar(int idSucursal,string? query=null,string orden="deuda_desc",bool soloConDeuda=false)=>Ok(Result("Cobros obtenidos.",await provider.ListarAsync(Branch(idSucursal),query?.Trim()??"",orden,soloConDeuda)));
    [HttpGet("cuentas-pendientes")] public async Task<IActionResult> Pendientes(int idSucursal,string? query=null)=>Ok(Result("Cuentas pendientes.",await provider.CuentasPendientesAsync(Branch(idSucursal),query?.Trim()??"")));
    [HttpGet("estado-cuenta")] public async Task<IActionResult> Estado(int idSucursal,int idCliente,DateTime? fechaDesde=null,DateTime? fechaHasta=null)=>Ok(Result("Estado de cuenta.",await provider.EstadoCuentaAsync(Branch(idSucursal),idCliente,fechaDesde,fechaHasta)));
    [HttpGet("estado-cuenta/excel")] public async Task<IActionResult> Excel(int idSucursal,int idCliente,DateTime? fechaDesde=null,DateTime? fechaHasta=null){var state=await provider.EstadoCuentaAsync(Branch(idSucursal),idCliente,fechaDesde,fechaHasta);if(state.Resumen is null)return NotFound();return File(CobroDocumentService.EstadoCuentaXlsx(state),"application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",$"estado-cuenta-{state.Resumen.Cliente}.xlsx");}
    [HttpPost("abonos")] public async Task<IActionResult> Abono(RegistrarAbonoDTO request){try{var id=await provider.RegistrarAbonoAsync(request,UserId(),Branch(request.IdSucursal));return Ok(Result("Abono registrado.",new{IdAbono=id}));}catch(Exception ex){return BadRequest(new ApiResponse<object>{Success=false,Message=ex.Message});}}
    [HttpGet("abonos/{id:int}/pdf")] public async Task<IActionResult> AbonoPdf(int id){var item=await provider.ObtenerAbonoAsync(id);if(item is null)return NotFound();return File(CobroDocumentService.AbonoPdf(item),"application/pdf",$"{item.NumeroAbono}.pdf");}
    [HttpGet("abonos")] public async Task<IActionResult> Abonos(int idSucursal,string? query=null,DateTime? fechaDesde=null,DateTime? fechaHasta=null,string? metodoPago=null)=>Ok(Result("Recibos de abono.",await provider.ListarAbonosAsync(Branch(idSucursal),query??"",fechaDesde,fechaHasta,metodoPago??"")));
    [Authorize(Roles="demo,Demo,superusuario,Superusuario,admin,Admin,Administrador")]
    [HttpGet("autorizaciones")] public async Task<IActionResult> Autorizaciones(string? query=null)=>Ok(Result("Clientes obtenidos.",await provider.AutorizacionesAsync(query?.Trim()??"")));
    [Authorize(Roles="demo,Demo,superusuario,Superusuario,admin,Admin,Administrador")]
    [HttpPost("autorizaciones")] public async Task<IActionResult> Autorizar(GuardarAutorizacionCreditoDTO request){try{var id=await provider.GuardarAutorizacionAsync(request,UserId());return Ok(Result("Autorización guardada.",new{IdClienteCredito=id}));}catch(Exception ex){return BadRequest(new ApiResponse<object>{Success=false,Message=ex.Message});}}
    private int UserId()=>int.TryParse(User.FindFirstValue(ClaimTypes.NameIdentifier)??User.FindFirst("id_usuario")?.Value,out var id)?id:0;
    private int Branch(int requested){var claim=User.FindFirst("id_sucursal")?.Value;return int.TryParse(claim,out var id)&&id>0?id:requested;}
    private static ApiResponse<object> Result(string message,object data)=>new(){Success=true,Message=message,Data=data};
}
