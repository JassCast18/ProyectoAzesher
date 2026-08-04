namespace Core.DTOs;

public class InventarioProductoDTO
{
    public int IdInventario { get; set; }
    public int IdProducto { get; set; }
    public string Nombre { get; set; } = string.Empty;
    public string? Descripcion { get; set; }
    public decimal Precio { get; set; }
    public int Stock { get; set; }
    public int IdSucursal { get; set; }
    public string SucursalNombre { get; set; } = string.Empty;
    public string EstadoStock { get; set; } = string.Empty;
}
