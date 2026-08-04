using System.Security.Claims;
using Core.DTOs;
using Core.DTOs.Interfaces;
using Core.Models;
using Core.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Core.Controllers;

[Authorize]
[Route("api/[controller]")]
[ApiController]
public class InventarioController(IInventarioProviderDTO inventarioProvider) : ControllerBase
{
    [HttpGet("productos")]
    public async Task<IActionResult> ObtenerProductos([FromQuery] int? idSucursal, [FromQuery] string? query = null)
    {
        var branchId = ResolveBranch(idSucursal);
        if (!branchId.HasValue) return BranchRequired();
        try
        {
            var products = await inventarioProvider.ObtenerProductosAsync(branchId.Value, query ?? string.Empty);
            return Ok(new ApiResponse<IEnumerable<InventarioProductoDTO>> { Success = true, Message = "Inventario obtenido correctamente.", Data = products });
        }
        catch (Exception ex)
        {
            return StatusCode(500, new ApiResponse<object> { Success = false, Message = "No fue posible consultar el inventario.", Errors = ex.Message });
        }
    }

    [HttpGet("reporte/{format}")]
    public async Task<IActionResult> DescargarReporte(string format, [FromQuery] int? idSucursal, [FromQuery] string? query = null)
    {
        var branchId = ResolveBranch(idSucursal);
        if (!branchId.HasValue) return BranchRequired();
        if (format is not ("pdf" or "excel")) return BadRequest(new ApiResponse<object> { Success = false, Message = "Formato de reporte no válido." });

        try
        {
            var products = await inventarioProvider.ObtenerProductosAsync(branchId.Value, query ?? string.Empty);
            var generatedAt = DateTime.Now;
            var branch = products.FirstOrDefault()?.SucursalNombre ?? $"Sucursal {branchId.Value}";
            var stamp = generatedAt.ToString("yyyyMMdd_HHmmss");
            if (format == "pdf")
                return File(InventarioDocumentExportService.GeneratePdf(products, branch, generatedAt), "application/pdf", $"inventario_{stamp}.pdf");
            return File(InventarioDocumentExportService.GenerateXlsx(products, branch, generatedAt), "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", $"inventario_{stamp}.xlsx");
        }
        catch (Exception ex)
        {
            return StatusCode(500, new ApiResponse<object> { Success = false, Message = "No fue posible generar el reporte de inventario.", Errors = ex.Message });
        }
    }

    private int? ResolveBranch(int? requestedBranch)
    {
        var claim = User.FindFirst("id_sucursal")?.Value ?? User.FindFirstValue("IdSucursal");
        if (int.TryParse(claim, out var assignedBranch) && assignedBranch > 0) return assignedBranch;
        return requestedBranch is > 0 ? requestedBranch : null;
    }

    private BadRequestObjectResult BranchRequired() => BadRequest(new ApiResponse<object> { Success = false, Message = "Debes seleccionar una sucursal." });
}
