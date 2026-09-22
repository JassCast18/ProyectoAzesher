using System.Data;
using Core.DTOs;
using Core.DTOs.Interfaces;
using Dapper;
using Microsoft.Data.SqlClient;
namespace Core.Provider;
public class BitacoraProvider(IConfiguration configuration):IBitacoraProviderDTO
{
 private readonly string cs=configuration.GetConnectionString("DefaultConnection")??throw new ArgumentNullException(nameof(configuration));
 public async Task RegistrarAsync(RegistrarBitacoraDTO x){await using var db=new SqlConnection(cs);await db.ExecuteAsync("dbo.sp_registrar_bitacora",x,commandType:CommandType.StoredProcedure);}
 public async Task<List<BitacoraDTO>> ConsultarAsync(string texto,int? idUsuario,int? idSucursal,string modulo,string accion,string resultado,DateTime? desde,DateTime? hasta,int pagina,int tamano){await using var db=new SqlConnection(cs);return (await db.QueryAsync<BitacoraDTO>("dbo.sp_consultar_bitacora",new{Texto=texto,IdUsuario=idUsuario,IdSucursal=idSucursal,Modulo=modulo,Accion=accion,Resultado=resultado,FechaDesde=desde,FechaHasta=hasta,Pagina=pagina,TamanoPagina=tamano},commandType:CommandType.StoredProcedure)).ToList();}
}
