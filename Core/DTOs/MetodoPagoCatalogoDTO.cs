namespace Core.DTOs
{
    public class MonedaCatalogoDTO
    {
        public int IdMoneda { get; set; }
        public string Codigo { get; set; } = string.Empty;
        public string Nombre { get; set; } = string.Empty;
        public string Simbolo { get; set; } = string.Empty;
    }

    public class TipoPosCatalogoDTO
    {
        public int IdTipoPos { get; set; }
        public string Nombre { get; set; } = string.Empty;
    }

    public class ClienteCreditoDTO
    {
        public int IdCliente { get; set; }
        public string Nombre { get; set; } = string.Empty;
        public string? Nit { get; set; }
        public string? Telefono { get; set; }
        public string? Direccion { get; set; }
        public decimal LimiteCredito { get; set; }
        public decimal SaldoActual { get; set; }
        public decimal Disponible { get; set; }
    }
}
