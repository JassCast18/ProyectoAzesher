using Core.DTOs;
using Core.Models;
using Microsoft.AspNetCore.Mvc;
using Core.DTOs.Interfaces;

namespace Core.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class CatalogoController(ICatalogoProviderDTO catalogoProvider) : ControllerBase
    {
        private readonly ICatalogoProviderDTO _catalogoProvider = catalogoProvider;

        [HttpGet("productos")]
        public async Task<IActionResult> BuscarProductos([FromQuery] string? query = null, [FromQuery] int? idSucursal = null)
        {
            try
            {
            var resultado = await _catalogoProvider.ObtenerProductosAsync(query ?? string.Empty, idSucursal);

                return Ok(new ApiResponse<IEnumerable<ProductoCatalogoDTO>>
                {
                    Success = true,
                    Message = "Productos encontrados correctamente.",
                    Data = resultado
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new ApiResponse<object>
                {
                    Success = false,
                    Message = "No fue posible buscar productos.",
                    Errors = ex.Message
                });
            }
        }

        [HttpGet("clientes")]
        public async Task<IActionResult> BuscarClientes([FromQuery] string? query = null)
        {
            try
            {
                var resultado = await _catalogoProvider.ObtenerClientesAsync(query ?? string.Empty);

                return Ok(new ApiResponse<IEnumerable<ClienteCatalogoDTO>>
                {
                    Success = true,
                    Message = "Clientes encontrados correctamente.",
                    Data = resultado
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new ApiResponse<object>
                {
                    Success = false,
                    Message = "No fue posible buscar clientes.",
                    Errors = ex.Message
                });
            }
        }
    }
}