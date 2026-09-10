namespace Core.DTOs.Interfaces;

public interface IInventarioProviderDTO
{
    Task<List<InventarioProductoDTO>> ObtenerProductosAsync(int idSucursal, string query);
    Task<List<ProductoEntradaDTO>> BuscarProductosEntradaAsync(int idProveedor, string query);
    Task<List<ProveedorEntradaDTO>> ObtenerProveedoresAsync();
    Task<int> CrearProductoAsync(CrearProductoEntradaDTO product);
    Task<int> RegistrarEntradaAsync(RegistrarEntradaPedidoDTO order);
    Task<List<EntradaPedidoConsultaDTO>> BuscarEntradasAsync(int idSucursal, string query);
    Task<List<ProveedorDTO>> BuscarProveedoresAsync(string query);
    Task<int> CrearProveedorAsync(ProveedorDTO supplier);
    Task<List<ProductoEntradaDTO>> ObtenerProductosProveedorAsync(int idProveedor);
    Task<TrasladoCreadoDTO> RegistrarTrasladoAsync(RegistrarTrasladoDTO traslado, int idUsuario);
    Task<List<TrasladoConsultaDTO>> BuscarTrasladosAsync(int? idSucursal, string query, DateTime? fechaDesde, DateTime? fechaHasta, int? idTraslado = null);
}
