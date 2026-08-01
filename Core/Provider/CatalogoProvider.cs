using System.Data;
using Core.DTOs;
using Core.DTOs.Interfaces;
using Dapper;
using Microsoft.Data.SqlClient;

namespace Core.Provider
{
    public class CatalogoProvider(IConfiguration configuration) : ICatalogoProviderDTO
    {
        private readonly string _connectionString = configuration.GetConnectionString("DefaultConnection")
            ?? throw new ArgumentNullException(nameof(configuration));

        public async Task<List<ProductoCatalogoDTO>> ObtenerProductosAsync(string query, int? idSucursal)
        {
            using var connection = new SqlConnection(_connectionString);
            var parametros = new DynamicParameters();
            parametros.Add("@Query", query?.Trim() ?? string.Empty);
            parametros.Add("@IdSucursal", idSucursal);

            var resultado = await connection.QueryAsync<ProductoCatalogoDTO>(
                "dbo.sp_obtener_productos_catalogo",
                parametros,
                commandType: CommandType.StoredProcedure);

            return resultado.ToList();
        }

        public async Task<List<ClienteCatalogoDTO>> ObtenerClientesAsync(string query)
        {
            using var connection = new SqlConnection(_connectionString);
            var parametros = new DynamicParameters();
            parametros.Add("@Query", query?.Trim() ?? string.Empty);

            var resultado = await connection.QueryAsync<ClienteCatalogoDTO>(
                "dbo.sp_obtener_clientes_catalogo",
                parametros,
                commandType: CommandType.StoredProcedure);

            return resultado.ToList();
        }
    }
}