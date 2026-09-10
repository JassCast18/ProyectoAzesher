namespace Core.DTOs
{
    public class ReciboConsultaDTO
    {
        public int IdRecibo { get; set; }
        public string NumeroRecibo { get; set; } = string.Empty;
        public DateTime? FechaPago { get; set; }
        public decimal Monto { get; set; }
        public decimal? SaldoPendiente { get; set; }
        public string MetodoPago { get; set; } = string.Empty;
        public string Estado { get; set; } = string.Empty;
        public DateTime? FechaAnulacion { get; set; }
        public string? MotivoAnulacion { get; set; }
        public string NumeroFactura { get; set; } = string.Empty;
        public int IdFactura { get; set; }
        public bool EsFacturada { get; set; }
        public int IdCliente { get; set; }
        public string ClienteNombre { get; set; } = string.Empty;
        public string? ClienteNit { get; set; }
        public string VendedorNombre { get; set; } = string.Empty;
        public string SucursalNombre { get; set; } = string.Empty;
    }

    public class AnularReciboRequestDTO
    {
        public int IdSucursal { get; set; }
        public string Motivo { get; set; } = string.Empty;
    }
}
