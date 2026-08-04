namespace Core.DTOs.Interfaces
{
    public interface ICatalogoProviderDTO
    {
        Task<List<ProductoCatalogoDTO>> ObtenerProductosAsync(string query, int? idSucursal);
        Task<List<ClienteCatalogoDTO>> ObtenerClientesAsync(string query);
        Task<List<VendedorCatalogoDTO>> ObtenerVendedoresAsync(int idSucursal);
        Task<List<MonedaCatalogoDTO>> ObtenerMonedasAsync();
        Task<List<TipoPosCatalogoDTO>> ObtenerTiposPosAsync();
        Task<List<ClienteCreditoDTO>> BuscarClientesCreditoAsync(string query);
    }
}
