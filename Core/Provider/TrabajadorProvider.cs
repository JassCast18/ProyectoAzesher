using System.Data;
using System.Text.Json;
using Core.DTOs;
using Core.DTOs.Interfaces;
using Dapper;
using Microsoft.Data.SqlClient;
namespace Core.Provider;
public class TrabajadorProvider(IConfiguration configuration):ITrabajadorProviderDTO
{
 private readonly string cs=configuration.GetConnectionString("DefaultConnection")??throw new ArgumentNullException(nameof(configuration));
 private async Task<List<T>> List<T>(string sp,object? p=null){await using var db=new SqlConnection(cs);return(await db.QueryAsync<T>(sp,p,commandType:CommandType.StoredProcedure)).ToList();}
 private async Task<int> Id(string sp,object p){await using var db=new SqlConnection(cs);return await db.QuerySingleAsync<int>(sp,p,commandType:CommandType.StoredProcedure);}
 public Task<List<ModuloSistemaDTO>> Modulos()=>List<ModuloSistemaDTO>("dbo.sp_listar_modulos_sistema");
 public Task<List<UsuarioGestionDTO>> Usuarios(string query)=>List<UsuarioGestionDTO>("dbo.sp_listar_usuarios",new{Query=query});
 public Task<int> GuardarUsuario(UsuarioGestionDTO x,string? hash)=>Id("dbo.sp_guardar_usuario",new{x.IdUsuario,x.Nombre,x.Apellidos,x.Telefono,x.Username,PasswordHash=hash,x.Correo,x.FechaExpiracionPassword,x.Rol,x.IdSucursal,x.Activo,x.Permisos});
 public Task<List<TrabajadorGestionDTO>> Trabajadores(int? sucursal,string query,bool soloActivos)=>List<TrabajadorGestionDTO>("dbo.sp_listar_trabajadores",new{IdSucursal=sucursal,Query=query,SoloActivos=soloActivos});
 public Task<int> GuardarTrabajador(TrabajadorGestionDTO x,int usuario)=>Id("dbo.sp_guardar_trabajador",new{x.IdVendedor,x.Nombre,x.Telefono,x.Correo,x.Dpi,Puesto="Vendedor",x.FechaIngreso,x.IdSucursal,x.Activo,IdUsuario=usuario});
 public Task<int> GuardarEvaluacion(EvaluacionTrabajadorRequestDTO x,int usuario)=>Id("dbo.sp_guardar_evaluacion_trabajador",new{x.IdVendedor,x.PeriodoDesde,x.PeriodoHasta,x.Puntualidad,x.ServicioCliente,x.CumplimientoMetas,x.TrabajoEquipo,PreguntasJson=JsonSerializer.Serialize(x.Preguntas),x.Observaciones,IdUsuario=usuario});
 public Task<List<KpiTrabajadorDTO>> Kpis(int? sucursal,DateTime desde,DateTime hasta)=>List<KpiTrabajadorDTO>("dbo.sp_kpis_trabajadores",new{IdSucursal=sucursal,FechaDesde=desde,FechaHasta=hasta});
 public Task<List<VentaTrabajadorDTO>> Ventas(int sucursal,int? vendedor,DateTime desde,DateTime hasta)=>List<VentaTrabajadorDTO>("dbo.sp_ventas_trabajador",new{IdSucursal=sucursal,IdVendedor=vendedor,FechaDesde=desde,FechaHasta=hasta});
 public Task<List<HistorialTrabajadorDTO>> Historial(int? sucursal,int? vendedor,string query,string tipo,DateTime? desde,DateTime? hasta,int pagina,int tamanoPagina)=>List<HistorialTrabajadorDTO>("dbo.sp_historial_trabajadores",new{IdSucursal=sucursal,IdVendedor=vendedor,Query=query,Tipo=tipo,FechaDesde=desde,FechaHasta=hasta,Pagina=pagina,TamanoPagina=tamanoPagina});
}
