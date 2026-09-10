using System.Data;
using System.Text.Json;
using Core.DTOs.Interfaces;
using Dapper;
using Microsoft.Data.SqlClient;
namespace Core.Provider;
public class DatosMaestrosProvider(IConfiguration configuration) : IDatosMaestrosProviderDTO
{
    private readonly string _connectionString = configuration.GetConnectionString("DefaultConnection") ?? throw new ArgumentNullException(nameof(configuration));
    public async Task<IEnumerable<dynamic>> ListarAsync(string entidad, string query)
    {
        using var db = new SqlConnection(_connectionString);
        return await db.QueryAsync("dbo.sp_datos_maestros_listar", new { Entidad = entidad, Query = query }, commandType: CommandType.StoredProcedure);
    }
    public async Task<int> GuardarAsync(string entidad, int? id, JsonElement datos)
    {
        using var db = new SqlConnection(_connectionString);
        return await db.ExecuteScalarAsync<int>("dbo.sp_datos_maestros_guardar", new { Entidad = entidad, Id = id, Datos = datos.GetRawText() }, commandType: CommandType.StoredProcedure);
    }
    public async Task DesactivarAsync(string entidad, int id)
    {
        using var db = new SqlConnection(_connectionString);
        await db.ExecuteAsync("dbo.sp_datos_maestros_desactivar", new { Entidad = entidad, Id = id }, commandType: CommandType.StoredProcedure);
    }
}
