namespace Core.DTOs
{
    public class VendedorCatalogoDTO
    {
        public int IdVendedor { get; set; }
        public string Nombre { get; set; } = string.Empty;
        public int IdSucursal { get; set; }
        public string SucursalNombre { get; set; } = string.Empty;
    }
}
