using Core.DTOs;

namespace Core.DTOs.Interfaces
{
    public interface IVentaProviderDTO
    {
        Task<ReciboVentaDTO?> ObtenerReciboVentaAsync(int idRecibo);
        Task<int> GuardarReciboAsync(ReciboTemporalRequestDTO request, int idUsuario, string nombreVendedor, int? idSucursal);
    }
}
