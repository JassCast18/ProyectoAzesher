using System.Security.Claims;
using Core.DTOs;
using Core.DTOs.Interfaces;
namespace Core.Middleware;
public class BitacoraMiddleware(RequestDelegate next,ILogger<BitacoraMiddleware> logger)
{
 private static readonly HashSet<string> Audited=["POST","PUT","PATCH","DELETE"];
 public async Task InvokeAsync(HttpContext context,IBitacoraProviderDTO provider)
 {
  if(!Audited.Contains(context.Request.Method)||context.Request.Path.Equals("/api/auth/login",StringComparison.OrdinalIgnoreCase)){await next(context);return;}
  Exception? failure=null;
  try{await next(context);}catch(Exception ex){failure=ex;throw;}
  finally
  {
   try
   {
    var path=context.Request.Path.Value??"/";var parts=path.Split('/',StringSplitOptions.RemoveEmptyEntries);
    var module=ModuleName(parts.Length>1?parts[1]:"sistema");
    var idUsuario=int.TryParse(context.User.FindFirstValue(ClaimTypes.NameIdentifier),out var uid)?uid:(int?)null;
    var username=context.User.FindFirstValue(ClaimTypes.Name);
    var branchValue=context.Request.Headers["X-Sucursal-ID"].FirstOrDefault()??context.User.FindFirst("id_sucursal")?.Value??context.Request.Query["idSucursal"].FirstOrDefault();
    var idSucursal=int.TryParse(branchValue,out var bid)&&bid>0?bid:(int?)null;
    var code=failure is null?context.Response.StatusCode:500;
    var action=DescribeAction(path,context.Request.Method);
    var detail=failure?.Message??(code<400?$"{action} correctamente.":$"La operación terminó con código {code}.");
    await provider.RegistrarAsync(new(idUsuario,username,idSucursal,module,action,context.Request.Method,path,code<400?"Exitoso":"Fallido",code,context.Connection.RemoteIpAddress?.ToString(),detail));
   }
   catch(Exception ex){logger.LogError(ex,"No fue posible registrar la bitácora para {Path}",context.Request.Path);}
  }
 }
 private static string ActionName(string method)=>method switch{"POST"=>"Registrar","PUT"=>"Actualizar","PATCH"=>"Modificar","DELETE"=>"Eliminar",_=>method};
 private static string Humanize(IEnumerable<string> values)=>string.Join(" / ",values.Where(x=>!int.TryParse(x,out _)).Select(x=>x.Replace('-',' ')));
 private static string ModuleName(string value)=>value.ToLowerInvariant() switch{"ventas"=>"Ventas","inventario"=>"Inventarios","operaciones"=>"Operaciones","facturacion"=>"Facturación","cobros"=>"Cobros","trabajadores"=>"Trabajadores","datos-maestros"=>"Datos maestros","auth"=>"Seguridad",_=>Humanize([value])};
 private static string DescribeAction(string path,string method)
 {
  var value=path.ToLowerInvariant();
  if(value.Contains("/ventas/autorizar"))return "Autorizó una venta y descontó inventario";
  if(value.Contains("/ventas/recibos")&&value.Contains("anular"))return "Anuló un recibo";
  if(value.Contains("/cobros/abonos"))return "Registró un abono de cliente";
  if(value.Contains("/cobros/autorizaciones"))return "Cambió la autorización de crédito de un cliente";
  if(value.Contains("/facturacion"))return "Autorizó una factura";
  if(value.Contains("/caja/abrir"))return "Abrió la caja de la sucursal";
  if(value.Contains("/caja/cerrar"))return "Cerró y cuadró la caja";
  if(value.Contains("/clientes")&&method=="POST")return "Registró un cliente";
  if(value.Contains("/clientes")&&method=="PUT")return "Actualizó los datos de un cliente";
  if(value.Contains("/trabajadores/usuarios"))return "Guardó cambios de un usuario del sistema";
  if(value.Contains("/trabajadores/evaluaciones"))return "Registró una evaluación de trabajador";
  if(value.Contains("/trabajadores"))return "Guardó cambios de un trabajador";
  if(value.Contains("/inventario/entradas"))return "Registró una entrada de inventario";
  if(value.Contains("/inventario/traslados"))return "Registró un traslado entre sucursales";
  if(value.Contains("forgot-password"))return "Solicitó recuperar una contraseña";
  if(value.Contains("reset-password"))return "Restableció una contraseña";
  var parts=path.Split('/',StringSplitOptions.RemoveEmptyEntries);
  return $"{ActionName(method)} {Humanize(parts.Skip(2))}".Trim();
 }
}
