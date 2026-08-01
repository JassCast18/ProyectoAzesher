namespace Core.DTOs.Interfaces
{
    public interface ICatalogoProviderDTO
    {
        Task<List<ProductoCatalogoDTO>> ObtenerProductosAsync(string query, int? idSucursal);
        Task<List<ClienteCatalogoDTO>> ObtenerClientesAsync(string query);
    }
}