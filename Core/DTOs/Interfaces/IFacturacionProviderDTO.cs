namespace Core.DTOs.Interfaces;
public interface IFacturacionProviderDTO { Task<List<ReciboFacturableDTO>> BuscarRecibosAsync(int branch,string query); Task<int> AutorizarAsync(AutorizarFacturaDTO request); Task<List<FacturaConsultaDTO>> BuscarAsync(int branch,string query,DateTime? from,DateTime? to); Task<FacturaDetalleDTO?> ObtenerAsync(int id); }
