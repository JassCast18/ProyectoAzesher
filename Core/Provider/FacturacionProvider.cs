using System.Data; using Core.DTOs; using Core.DTOs.Interfaces; using Dapper; using Microsoft.Data.SqlClient;
namespace Core.Provider;
public class FacturacionProvider(IConfiguration configuration):IFacturacionProviderDTO {
 private readonly string cs=configuration.GetConnectionString("DefaultConnection")??throw new ArgumentNullException(nameof(configuration));
 private async Task<List<T>> List<T>(string sp,object? p){await using var c=new SqlConnection(cs);return (await c.QueryAsync<T>(sp,p,commandType:CommandType.StoredProcedure)).ToList();}
 public Task<List<ReciboFacturableDTO>> BuscarRecibosAsync(int b,string q)=>List<ReciboFacturableDTO>("dbo.sp_buscar_recibos_facturables",new{IdSucursal=b,Query=q});
 public Task<List<FacturaConsultaDTO>> BuscarAsync(int b,string q,DateTime? f,DateTime? t)=>List<FacturaConsultaDTO>("dbo.sp_buscar_facturas",new{IdSucursal=b,Query=q,FechaDesde=f,FechaHasta=t});
 public async Task<int> AutorizarAsync(AutorizarFacturaDTO r){await using var c=new SqlConnection(cs);return await c.QuerySingleAsync<int>("dbo.sp_autorizar_factura_simulada",new{r.IdRecibo,r.IdSucursal,r.Nombre,r.Nit,r.Direccion},commandType:CommandType.StoredProcedure);}
 public async Task<FacturaDetalleDTO?> ObtenerAsync(int id){await using var c=new SqlConnection(cs);using var m=await c.QueryMultipleAsync("dbo.sp_obtener_factura",new{IdFactura=id},commandType:CommandType.StoredProcedure);var x=await m.ReadFirstOrDefaultAsync<FacturaDetalleDTO>();if(x!=null)x.Detalles=(await m.ReadAsync<FacturaLineaDTO>()).ToList();return x;}
}
