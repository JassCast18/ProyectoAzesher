namespace Core.DTOs
{
    public class ProductoCatalogoDTO
    {
        public int IdProducto { get; set; }
        public string Nombre { get; set; } = string.Empty;
        public string? Descripcion { get; set; }
        public decimal Precio { get; set; }
        public int? IdSucursal { get; set; }
        public string? NombreSucursal { get; set; }
    }
}