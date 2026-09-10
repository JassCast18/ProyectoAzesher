using Core.DTOs;
namespace Core.DTOs.Interfaces;
public interface ICobroProviderDTO
{
    Task<List<CobroClienteDTO>> ListarAsync(int idSucursal,string query,string orden,bool soloConDeuda);
    Task<List<CuentaPendienteCobroDTO>> CuentasPendientesAsync(int idSucursal,string query);
    Task<EstadoCuentaDTO> EstadoCuentaAsync(int idSucursal,int idCliente,DateTime? desde,DateTime? hasta);
    Task<int> RegistrarAbonoAsync(RegistrarAbonoDTO request,int idUsuario,int idSucursal);
    Task<AbonoReciboDTO?> ObtenerAbonoAsync(int idAbono);
    Task<List<AutorizacionCreditoDTO>> AutorizacionesAsync(string query);
    Task<int> GuardarAutorizacionAsync(GuardarAutorizacionCreditoDTO request,int idUsuario);
}
