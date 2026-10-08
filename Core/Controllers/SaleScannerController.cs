using System.Security.Claims;
using System.Text.RegularExpressions;
using Core.DTOs;
using Core.DTOs.Interfaces;
using Core.Hubs;
using Core.Models;
using Core.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.SignalR;

namespace Core.Controllers;

[ApiController]
[Route("api/ventas/scanner")]
public sealed class SaleScannerController(
    ISaleScannerSessionService sessions,
    ICatalogoProviderDTO catalog,
    IHubContext<SaleScannerHub> hub) : ControllerBase
{
    private static readonly Regex ValidCode = new("^[A-Za-z0-9._-]{4,100}$", RegexOptions.Compiled);

    [Authorize]
    [HttpPost("sessions")]
    public IActionResult CreateSession([FromQuery] int? idSucursal)
    {
        if (!int.TryParse(User.FindFirstValue(ClaimTypes.NameIdentifier), out var userId)) return Unauthorized();
        var branchId = ResolveBranch(idSucursal);
        if (!branchId.HasValue)
            return BadRequest(new ApiResponse<object> { Success = false, Message = "Debes seleccionar una sucursal." });

        var session = sessions.Create(userId, branchId.Value);
        return Ok(new ApiResponse<object>
        {
            Success = true,
            Message = "Lector móvil preparado.",
            Data = new { session.Token, session.ExpiresAt, IdSucursal = session.BranchId }
        });
    }

    [AllowAnonymous]
    [HttpGet("sessions/{token}")]
    public IActionResult GetSession(string token)
    {
        var session = sessions.Get(token);
        if (session is null)
            return NotFound(new ApiResponse<object> { Success = false, Message = "El enlace del lector no existe o ya venció." });
        return Ok(new ApiResponse<object>
        {
            Success = true,
            Message = "Lector disponible.",
            Data = new { session.ExpiresAt }
        });
    }

    [AllowAnonymous]
    [HttpPost("sessions/{token}/scans")]
    public async Task<IActionResult> Scan(string token, [FromBody] EscaneoCodigoBarraDTO request)
    {
        var session = sessions.Get(token);
        if (session is null)
            return NotFound(new ApiResponse<object> { Success = false, Message = "El enlace del lector no existe o ya venció." });

        var code = request.Codigo?.Trim() ?? string.Empty;
        if (!ValidCode.IsMatch(code))
            return BadRequest(new ApiResponse<object> { Success = false, Message = "El código debe contener entre 4 y 100 letras, números, puntos, guiones o guion bajo." });
        if (!session.TryAccept(code))
            return Ok(new ApiResponse<object> { Success = true, Message = "Lectura duplicada ignorada." });

        var product = await catalog.ObtenerProductoPorCodigoAsync(code, session.BranchId);
        if (product is null)
            return NotFound(new ApiResponse<object> { Success = false, Message = "El código no está asignado a un producto disponible en esta sucursal." });

        await hub.Clients.Group(SaleScannerHub.GroupName(token)).SendAsync("ProductScanned", product);
        return Ok(new ApiResponse<ProductoCatalogoDTO> { Success = true, Message = $"{product.Nombre} enviado a la venta.", Data = product });
    }

    [Authorize]
    [HttpDelete("sessions/{token}")]
    public IActionResult CloseSession(string token)
    {
        if (!int.TryParse(User.FindFirstValue(ClaimTypes.NameIdentifier), out var userId)) return Unauthorized();
        sessions.Close(token, userId);
        return NoContent();
    }

    private int? ResolveBranch(int? requested)
    {
        var claim = User.FindFirst("id_sucursal")?.Value ?? User.FindFirstValue("IdSucursal");
        if (int.TryParse(claim, out var assigned) && assigned > 0) return assigned;
        return requested is > 0 ? requested : null;
    }
}
