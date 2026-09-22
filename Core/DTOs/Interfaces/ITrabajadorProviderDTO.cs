namespace Core.DTOs.Interfaces;
public interface ITrabajadorProviderDTO
{
 Task<List<ModuloSistemaDTO>> Modulos();
 Task<List<UsuarioGestionDTO>> Usuarios(string query);
 Task<int> GuardarUsuario(UsuarioGestionDTO usuario,string? passwordHash);
 Task<List<TrabajadorGestionDTO>> Trabajadores(int? sucursal,string query,bool soloActivos);
 Task<int> GuardarTrabajador(TrabajadorGestionDTO trabajador,int usuario);
 Task<int> GuardarEvaluacion(EvaluacionTrabajadorRequestDTO evaluacion,int usuario);
 Task<List<KpiTrabajadorDTO>> Kpis(int? sucursal,DateTime desde,DateTime hasta);
 Task<List<VentaTrabajadorDTO>> Ventas(int sucursal,int? vendedor,DateTime desde,DateTime hasta);
 Task<List<HistorialTrabajadorDTO>> Historial(int? sucursal,int? vendedor,string query,string tipo,DateTime? desde,DateTime? hasta,int pagina,int tamanoPagina);
}
