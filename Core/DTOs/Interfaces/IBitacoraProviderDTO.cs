using Core.DTOs;
namespace Core.DTOs.Interfaces;
public interface IBitacoraProviderDTO
{
 Task RegistrarAsync(RegistrarBitacoraDTO item);
 Task<List<BitacoraDTO>> ConsultarAsync(string texto,int? idUsuario,int? idSucursal,string modulo,string accion,string resultado,DateTime? desde,DateTime? hasta,int pagina,int tamano);
}
