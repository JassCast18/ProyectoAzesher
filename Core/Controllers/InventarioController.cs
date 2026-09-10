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
    [HttpGet("proveedores")] public async Task<IActionResult> BuscarProveedores([FromQuery]string? query=null) => Ok(new ApiResponse<object>{Success=true,Message="Proveedores obtenidos.",Data=await inventarioProvider.BuscarProveedoresAsync(query??"")});
    [HttpPost("proveedores")] public async Task<IActionResult> CrearProveedor([FromBody]ProveedorDTO supplier) { if(string.IsNullOrWhiteSpace(supplier.Nombre))return BadRequest(new ApiResponse<object>{Success=false,Message="El nombre es obligatorio."});var id=await inventarioProvider.CrearProveedorAsync(supplier);return Ok(new ApiResponse<object>{Success=true,Message="Proveedor creado.",Data=new{IdProveedor=id}}); }
    [HttpGet("proveedores/{idProveedor:int}/productos")] public async Task<IActionResult> ProductosProveedor(int idProveedor) => Ok(new ApiResponse<object>{Success=true,Message="Productos del proveedor.",Data=await inventarioProvider.ObtenerProductosProveedorAsync(idProveedor)});
    [HttpGet("entrada/proveedores")]
    public async Task<IActionResult> Proveedores() => Ok(new ApiResponse<IEnumerable<ProveedorEntradaDTO>> { Success = true, Message = "Proveedores obtenidos.", Data = await inventarioProvider.ObtenerProveedoresAsync() });

    [HttpGet("entrada/productos")]
    public async Task<IActionResult> ProductosEntrada([FromQuery] int idProveedor, [FromQuery] string? query = null) => Ok(new ApiResponse<IEnumerable<ProductoEntradaDTO>> { Success = true, Message = "Productos obtenidos.", Data = await inventarioProvider.BuscarProductosEntradaAsync(idProveedor, query ?? "") });

    [HttpPost("entrada/productos")]
    public async Task<IActionResult> CrearProducto([FromBody] CrearProductoEntradaDTO product)
    {
        if (product.IdProveedor <= 0) return BadRequest(new ApiResponse<object> { Success = false, Message = "Debes seleccionar un proveedor." });
        if (string.IsNullOrWhiteSpace(product.Nombre) || product.Precio < 0) return BadRequest(new ApiResponse<object> { Success = false, Message = "Completa un nombre y precio válidos." });
        try { var id = await inventarioProvider.CrearProductoAsync(product); return Ok(new ApiResponse<object> { Success = true, Message = "Producto creado correctamente.", Data = new { IdProducto = id } }); }
        catch (Exception ex) { return BadRequest(new ApiResponse<object> { Success = false, Message = ex.Message }); }
    }

    [HttpGet("entradas")]
    public async Task<IActionResult> Entradas([FromQuery] int? idSucursal, [FromQuery] string? query = null)
    {
        var branchId = ResolveBranch(idSucursal); if (!branchId.HasValue) return BranchRequired();
        return Ok(new ApiResponse<IEnumerable<EntradaPedidoConsultaDTO>> { Success = true, Message = "Entradas obtenidas.", Data = await inventarioProvider.BuscarEntradasAsync(branchId.Value, query ?? "") });
    }

    [HttpPost("entradas")]
    public async Task<IActionResult> RegistrarEntrada([FromBody] RegistrarEntradaPedidoDTO order)
    {
        var branchId = ResolveBranch(order.IdSucursal); if (!branchId.HasValue) return BranchRequired();
        if (order.IdProveedor <= 0 || order.Detalles.Count == 0) return BadRequest(new ApiResponse<object> { Success = false, Message = "Selecciona un proveedor y agrega productos." });
        order.IdSucursal = branchId.Value;
        try { var id = await inventarioProvider.RegistrarEntradaAsync(order); return Ok(new ApiResponse<object> { Success = true, Message = "Entrada registrada e inventario actualizado.", Data = new { IdCompra = id } }); }
        catch (Exception ex) { return BadRequest(new ApiResponse<object> { Success = false, Message = ex.Message }); }
    }

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

    [Authorize(Roles = "demo,Demo,superusuario,Superusuario,admin,Admin,Administrador")]
    [HttpPost("traslados")]
    public async Task<IActionResult> RegistrarTraslado([FromBody] RegistrarTrasladoDTO traslado)
    {
        if (traslado.IdSucursalOrigen <= 0 || traslado.IdSucursalDestino <= 0 || traslado.Detalles.Count == 0) return BadRequest(new ApiResponse<object> { Success=false, Message="Completa las sucursales y productos del traslado." });
        var idUsuario = int.TryParse(User.FindFirstValue(ClaimTypes.NameIdentifier), out var id) ? id : 0;
        try { var result = await inventarioProvider.RegistrarTrasladoAsync(traslado,idUsuario); return Ok(new ApiResponse<TrasladoCreadoDTO> { Success=true,Message="Traslado registrado.",Data=result }); }
        catch(Exception ex) { return BadRequest(new ApiResponse<object> { Success=false,Message=ex.Message }); }
    }

    [Authorize(Roles = "demo,Demo,superusuario,Superusuario,admin,Admin,Administrador")]
    [HttpGet("traslados")]
    public async Task<IActionResult> Traslados([FromQuery]int? idSucursal=null,[FromQuery]string? query=null,[FromQuery]DateTime? fechaDesde=null,[FromQuery]DateTime? fechaHasta=null) => Ok(new ApiResponse<IEnumerable<TrasladoConsultaDTO>> { Success=true,Message="Traslados obtenidos.",Data=await inventarioProvider.BuscarTrasladosAsync(idSucursal,query??"",fechaDesde,fechaHasta) });

    [Authorize(Roles = "demo,Demo,superusuario,Superusuario,admin,Admin,Administrador")]
    [HttpGet("traslados/{id:int}/pdf")]
    public async Task<IActionResult> NotaTraslado(int id)
    {
        var rows=await inventarioProvider.BuscarTrasladosAsync(null,"",null,null,id);
        if(rows.Count==0)return NotFound();
        return File(TrasladoDocumentService.GeneratePdf(rows),"application/pdf",$"{rows[0].NumeroTraslado}.pdf");
    }

    private int? ResolveBranch(int? requestedBranch)
    {
        var claim = User.FindFirst("id_sucursal")?.Value ?? User.FindFirstValue("IdSucursal");
        if (int.TryParse(claim, out var assignedBranch) && assignedBranch > 0) return assignedBranch;
        return requestedBranch is > 0 ? requestedBranch : null;
    }

    private BadRequestObjectResult BranchRequired() => BadRequest(new ApiResponse<object> { Success = false, Message = "Debes seleccionar una sucursal." });
}
