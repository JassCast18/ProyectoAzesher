using Core.Models;

namespace Core.DTOs.Interfaces
{
    public interface IAuthProviderDTO
    {
        Task<UsuarioLoginDTO?> ObtenerUsuarioParaLoginAsync(string username);
        string GenerarTokenJwt(UsuarioLoginDTO usuario);

        Task<List<Sucursal>> ObtenerSucursalesPorUsuarioAsync(int? idSucursal);
    }
}
