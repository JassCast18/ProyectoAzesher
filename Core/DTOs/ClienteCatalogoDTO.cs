namespace Core.DTOs
{
    public class ClienteCatalogoDTO
    {
        public int IdCliente { get; set; }
        public string Nombre { get; set; } = string.Empty;
        public string? Telefono { get; set; }
        public string? Direccion { get; set; }
        public string? Nit { get; set; }
    }
}