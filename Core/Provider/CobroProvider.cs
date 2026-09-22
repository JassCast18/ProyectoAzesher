using System.Data;
using Core.DTOs;
using Core.DTOs.Interfaces;
using Dapper;
using Microsoft.Data.SqlClient;
namespace Core.Provider;
public class CobroProvider(IConfiguration configuration):ICobroProviderDTO
{
    private readonly string cs=configuration.GetConnectionString("DefaultConnection")??throw new ArgumentNullException(nameof(configuration));
    private async Task<List<T>> List<T>(string sp,object values){await using var connection=new SqlConnection(cs);return (await connection.QueryAsync<T>(sp,values,commandType:CommandType.StoredProcedure)).ToList();}
    public Task<List<CobroClienteDTO>> ListarAsync(int branch,string query,string order,bool debt)=>List<CobroClienteDTO>("dbo.sp_listar_cobros",new{IdSucursal=branch,Query=query,Orden=order,SoloConDeuda=debt});
    public Task<List<CuentaPendienteCobroDTO>> CuentasPendientesAsync(int branch,string query)=>List<CuentaPendienteCobroDTO>("dbo.sp_cuentas_pendientes_cobro",new{IdSucursal=branch,Query=query});
    public async Task<EstadoCuentaDTO> EstadoCuentaAsync(int branch,int client,DateTime? from,DateTime? to){await using var connection=new SqlConnection(cs);using var result=await connection.QueryMultipleAsync("dbo.sp_estado_cuenta_cliente",new{IdSucursal=branch,IdCliente=client,FechaDesde=from,FechaHasta=to},commandType:CommandType.StoredProcedure);return new(){Resumen=await result.ReadFirstOrDefaultAsync<EstadoCuentaResumenDTO>(),Creditos=(await result.ReadAsync<EstadoCuentaCreditoDTO>()).ToList(),Movimientos=(await result.ReadAsync<EstadoCuentaMovimientoDTO>()).ToList()};}
    public async Task<int> RegistrarAbonoAsync(RegistrarAbonoDTO request,int user,int branch){await using var connection=new SqlConnection(cs);try{return await connection.QuerySingleAsync<int>("dbo.sp_registrar_abono",new{request.IdCuenta,IdSucursal=branch,IdUsuario=user,request.Monto,request.MetodoPago,request.Referencia,request.Correo,request.Telefono},commandType:CommandType.StoredProcedure);}catch(SqlException ex) when(ex.Number>=50000){throw new InvalidOperationException(ex.Message,ex);}}
    public async Task<AbonoReciboDTO?> ObtenerAbonoAsync(int id){await using var connection=new SqlConnection(cs);return await connection.QueryFirstOrDefaultAsync<AbonoReciboDTO>("dbo.sp_obtener_abono",new{IdAbono=id},commandType:CommandType.StoredProcedure);}
    public Task<List<AbonoConsultaDTO>> ListarAbonosAsync(int branch,string query,DateTime? from,DateTime? to,string method)=>List<AbonoConsultaDTO>("dbo.sp_listar_abonos",new{IdSucursal=branch,Query=query,FechaDesde=from,FechaHasta=to,MetodoPago=method});
    public Task<List<AutorizacionCreditoDTO>> AutorizacionesAsync(string query)=>List<AutorizacionCreditoDTO>("dbo.sp_listar_autorizaciones_credito",new{Query=query});
    public async Task<int> GuardarAutorizacionAsync(GuardarAutorizacionCreditoDTO request,int user){await using var connection=new SqlConnection(cs);try{return await connection.QuerySingleAsync<int>("dbo.sp_guardar_autorizacion_credito",new{request.IdCliente,request.LimiteCredito,request.DiasMaximosPago,request.FechaVencimientoAutorizacion,request.Observaciones,request.Activo,IdUsuario=user},commandType:CommandType.StoredProcedure);}catch(SqlException ex) when(ex.Number>=50000){throw new InvalidOperationException(ex.Message,ex);}}
}
