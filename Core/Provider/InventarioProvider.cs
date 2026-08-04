using System.Data;
using Core.DTOs;
using Core.DTOs.Interfaces;
using Dapper;
using Microsoft.Data.SqlClient;

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
}
