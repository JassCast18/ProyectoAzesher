using System.Data;
using Core.DTOs;
using Core.DTOs.Interfaces;
using Dapper;
using Microsoft.Data.SqlClient;
using System.Text.Json;

namespace Core.Provider;

public class InventarioProvider(IConfiguration configuration) : IInventarioProviderDTO
{
    private readonly string _connectionString = configuration.GetConnectionString("DefaultConnection")
        ?? throw new ArgumentNullException(nameof(configuration));

    public async Task<List<InventarioProductoDTO>> ObtenerProductosAsync(int idSucursal, string query)
    {
        using var connection = new SqlConnection(_connectionString);
        var parameters = new DynamicParameters();
        parameters.Add("@IdSucursal", idSucursal);
        parameters.Add("@Query", query?.Trim() ?? string.Empty);
        var result = await connection.QueryAsync<InventarioProductoDTO>(
            "dbo.sp_obtener_inventario_productos",
            parameters,
            commandType: CommandType.StoredProcedure);
        return result.ToList();
    }

    public async Task<List<ProductoEntradaDTO>> BuscarProductosEntradaAsync(int idProveedor, string query) => await QueryList<ProductoEntradaDTO>("dbo.sp_buscar_productos_entrada", new { IdProveedor = idProveedor, Query = query?.Trim() ?? "" });
    public async Task<List<ProveedorEntradaDTO>> ObtenerProveedoresAsync() => await QueryList<ProveedorEntradaDTO>("dbo.sp_obtener_proveedores_entrada", null);
    public async Task<List<EntradaPedidoConsultaDTO>> BuscarEntradasAsync(int idSucursal, string query) => await QueryList<EntradaPedidoConsultaDTO>("dbo.sp_buscar_entradas_pedido", new { IdSucursal = idSucursal, Query = query?.Trim() ?? "" });

    public async Task<int> CrearProductoAsync(CrearProductoEntradaDTO product)
    {
        using var connection = new SqlConnection(_connectionString);
        return await connection.QuerySingleAsync<int>("dbo.sp_crear_producto_entrada", new { product.IdProveedor, product.Codigo, product.Nombre, product.Descripcion, product.Precio }, commandType: CommandType.StoredProcedure);
    }

    public async Task<int> RegistrarEntradaAsync(RegistrarEntradaPedidoDTO order)
    {
        using var connection = new SqlConnection(_connectionString);
        return await connection.QuerySingleAsync<int>("dbo.sp_registrar_entrada_pedido", new { order.IdSucursal, order.IdProveedor, order.Fecha, order.MetodoPago, order.Observaciones, Detalles = JsonSerializer.Serialize(order.Detalles) }, commandType: CommandType.StoredProcedure);
    }

    private async Task<List<T>> QueryList<T>(string procedure, object? parameters)
    {
        using var connection = new SqlConnection(_connectionString);
        var result = await connection.QueryAsync<T>(procedure, parameters, commandType: CommandType.StoredProcedure);
        return result.ToList();
    }
    public Task<List<ProveedorDTO>> BuscarProveedoresAsync(string query) => QueryList<ProveedorDTO>("dbo.sp_buscar_proveedores", new { Query = query?.Trim() ?? "" });
    public async Task<int> CrearProveedorAsync(ProveedorDTO supplier) { using var connection = new SqlConnection(_connectionString); return await connection.QuerySingleAsync<int>("dbo.sp_crear_proveedor", new { supplier.Nombre, supplier.Telefono, supplier.Direccion }, commandType: CommandType.StoredProcedure); }
    public Task<List<ProductoEntradaDTO>> ObtenerProductosProveedorAsync(int idProveedor) => QueryList<ProductoEntradaDTO>("dbo.sp_productos_proveedor", new { IdProveedor = idProveedor });
    public async Task<TrasladoCreadoDTO> RegistrarTrasladoAsync(RegistrarTrasladoDTO traslado, int idUsuario)
    {
        using var connection = new SqlConnection(_connectionString);
        return await connection.QuerySingleAsync<TrasladoCreadoDTO>("dbo.sp_registrar_traslado", new { traslado.IdSucursalOrigen, traslado.IdSucursalDestino, IdUsuario = idUsuario, traslado.Observaciones, Detalles = JsonSerializer.Serialize(traslado.Detalles) }, commandType: CommandType.StoredProcedure);
    }
    public Task<List<TrasladoConsultaDTO>> BuscarTrasladosAsync(int? idSucursal, string query, DateTime? fechaDesde, DateTime? fechaHasta, int? idTraslado = null) => QueryList<TrasladoConsultaDTO>("dbo.sp_buscar_traslados", new { IdSucursal = idSucursal, Query = query?.Trim() ?? "", FechaDesde = fechaDesde, FechaHasta = fechaHasta, IdTraslado = idTraslado });
    public async Task<int> RegistrarSalidaAsync(SalidaInventarioRequestDTO salida,int idUsuario){using var connection=new SqlConnection(_connectionString);return await connection.QuerySingleAsync<int>("dbo.sp_registrar_salida_inventario",new{salida.IdSucursal,IdUsuario=idUsuario,salida.Motivo,salida.Observaciones,Detalles=JsonSerializer.Serialize(salida.Detalles)},commandType:CommandType.StoredProcedure);}
    public Task<List<SalidaInventarioConsultaDTO>> BuscarSalidasAsync(int idSucursal,string query)=>QueryList<SalidaInventarioConsultaDTO>("dbo.sp_listar_salidas_inventario",new{IdSucursal=idSucursal,Query=query?.Trim()??""});
    public Task<List<MovimientoInventarioDTO>> BuscarMovimientosAsync(int? idSucursal,int? idProducto,string query,string tipo,DateTime? fechaDesde,DateTime? fechaHasta,int pagina,int tamanoPagina)=>QueryList<MovimientoInventarioDTO>("dbo.sp_movimientos_inventario",new{IdSucursal=idSucursal,IdProducto=idProducto,Query=query?.Trim()??"",Tipo=tipo?.Trim()??"",FechaDesde=fechaDesde,FechaHasta=fechaHasta,Pagina=pagina,TamanoPagina=tamanoPagina});
}
