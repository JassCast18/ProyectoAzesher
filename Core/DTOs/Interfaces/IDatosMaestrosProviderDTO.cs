using System.Text.Json;
namespace Core.DTOs.Interfaces;
public interface IDatosMaestrosProviderDTO
{
    Task<IEnumerable<dynamic>> ListarAsync(string entidad, string query);
    Task<int> GuardarAsync(string entidad, int? id, JsonElement datos);
    Task DesactivarAsync(string entidad, int id);
}
