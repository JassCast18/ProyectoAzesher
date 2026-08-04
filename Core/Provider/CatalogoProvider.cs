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

        public async Task<List<VendedorCatalogoDTO>> ObtenerVendedoresAsync(int idSucursal)
        {
            using var connection = new SqlConnection(_connectionString);
            var parametros = new DynamicParameters();
            parametros.Add("@IdSucursal", idSucursal);
            var resultado = await connection.QueryAsync<VendedorCatalogoDTO>(
                "dbo.sp_obtener_vendedores_catalogo",
                parametros,
                commandType: CommandType.StoredProcedure);

            return resultado.ToList();
        }

        public async Task<List<MonedaCatalogoDTO>> ObtenerMonedasAsync()
        {
            using var connection = new SqlConnection(_connectionString);
            var resultado = await connection.QueryAsync<MonedaCatalogoDTO>(
                "dbo.sp_obtener_monedas", commandType: CommandType.StoredProcedure);
            return resultado.ToList();
        }

        public async Task<List<TipoPosCatalogoDTO>> ObtenerTiposPosAsync()
        {
            using var connection = new SqlConnection(_connectionString);
            var resultado = await connection.QueryAsync<TipoPosCatalogoDTO>(
                "dbo.sp_obtener_tipos_pos", commandType: CommandType.StoredProcedure);
            return resultado.ToList();
        }

        public async Task<List<ClienteCreditoDTO>> BuscarClientesCreditoAsync(string query)
        {
            using var connection = new SqlConnection(_connectionString);
            var parametros = new DynamicParameters();
            parametros.Add("@Query", query?.Trim() ?? string.Empty);
            var resultado = await connection.QueryAsync<ClienteCreditoDTO>(
                "dbo.sp_buscar_clientes_credito", parametros, commandType: CommandType.StoredProcedure);
            return resultado.ToList();
        }
    }
}
