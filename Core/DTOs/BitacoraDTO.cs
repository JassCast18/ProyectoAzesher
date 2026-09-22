namespace Core.DTOs;
public class BitacoraDTO
{
 public long IdBitacora{get;set;} public DateTime Fecha{get;set;} public int? IdUsuario{get;set;} public string Usuario{get;set;}="Sistema";
 public int? IdSucursal{get;set;} public string? Sucursal{get;set;} public string Modulo{get;set;}=""; public string Accion{get;set;}="";
 public string Metodo{get;set;}=""; public string Ruta{get;set;}=""; public string Resultado{get;set;}=""; public int CodigoHttp{get;set;}
 public string? DireccionIp{get;set;} public string? Detalle{get;set;} public int TotalRegistros{get;set;}
}
public record RegistrarBitacoraDTO(int? IdUsuario,string? NombreUsuario,int? IdSucursal,string Modulo,string Accion,string Metodo,string Ruta,string Resultado,int CodigoHttp,string? DireccionIp,string? Detalle);
