using BCrypt.Net;
using Core.DTOs.Interfaces;
using Core.DTOs;
using Core.Models;
using Core.Provider;
using Microsoft.AspNetCore.Mvc;

namespace Core.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class AuthController(IAuthProviderDTO authProvider) : ControllerBase
    {
        private readonly IAuthProviderDTO _authProvider = authProvider;

        [HttpPost("login")]
        public async Task<IActionResult> Login([FromBody] LoginRequestDTO request)
        {
            if (string.IsNullOrWhiteSpace(request.username) || string.IsNullOrWhiteSpace(request.password))
            {
                return BadRequest(new ApiResponse<object>
                {
                    Success = false,
                    Message = "El usuario y la contraseña son obligatorios."
                });
            }
            try
            {
      
                UsuarioLoginDTO? usuarioEnBD = await _authProvider.ObtenerUsuarioParaLoginAsync(request.username);

                if (usuarioEnBD == null)
                {
                    return Unauthorized(new ApiResponse<object>
                    {
                        Success = false,
                        Message = "Usuario o contraseña incorrectos."
                    });
                }

                bool passwordCorrecto = BCrypt.Net.BCrypt.Verify(request.password, usuarioEnBD.password);

                if (!passwordCorrecto)
                {
                    return Unauthorized(new ApiResponse<object>
                    {
                        Success = false,
                        Message = "Usuario o contraseña incorrectos."
                    });
                }

                int? idSucursalParaSP = usuarioEnBD.id_sucursal;
                if (idSucursalParaSP == 0) idSucursalParaSP = null;
                var listaSucursales = await _authProvider.ObtenerSucursalesPorUsuarioAsync(idSucursalParaSP);

                usuarioEnBD.password = null;

                string token = _authProvider.GenerarTokenJwt(usuarioEnBD);


                return Ok(new ApiResponse<object>
                {
                    Success = true,
                    Message = "Sesión iniciada correctamente",
                    Data = new
                    {
                        Usuario = usuarioEnBD.username,
                        Token = token,
                        Sucursales = listaSucursales.Select(s => new {
                            idSucursal = s.IdSucursal,
                            nombreSuc = s.Nombre,
                            colorIdentificacion = s.ColorIdentificacion
                        }).ToList()
                    }
                });
            }
            catch (Exception ex)
            {
               
                return StatusCode(500, new ApiResponse<object>
                {
                    Success = false,
                    Message = "Ocurrió un error interno en el servidor.",
                    Errors = ex.Message 
                });
            }
        }
    }
}
