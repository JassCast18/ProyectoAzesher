using Core.DTOs;

namespace Core.DTOs.Interfaces
{
    public interface IVentaProviderDTO
    {
        Task<ReciboVentaDTO?> ObtenerReciboVentaAsync(int idRecibo);
        Task<int> GuardarReciboAsync(ReciboTemporalRequestDTO request, int idUsuario, int idSucursal);
        Task<List<ReciboConsultaDTO>> BuscarRecibosAsync(int idSucursal, string query, DateTime? fechaDesde, DateTime? fechaHasta, string tipoDocumento, string metodoPago);
        Task AnularReciboAsync(int idRecibo, int idSucursal, int idUsuario, string motivo);
    }
}
