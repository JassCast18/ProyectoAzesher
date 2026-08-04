namespace Core.DTOs.Interfaces;

public interface IInventarioProviderDTO
{
    Task<List<InventarioProductoDTO>> ObtenerProductosAsync(int idSucursal, string query);
}
