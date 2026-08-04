namespace Core.DTOs
{
    public class ReciboTemporalRequestDTO
    {
        public int? IdCliente { get; set; }
        public int? IdSucursal { get; set; }
        public string? SucursalNombre { get; set; }
        public string NumeroRecibo { get; set; } = string.Empty;
        public DateTime? FechaPago { get; set; }
        public string NumeroFactura { get; set; } = string.Empty;
        public DateTime? FechaVenta { get; set; }
        public string ClienteNombre { get; set; } = string.Empty;
        public string? ClienteNit { get; set; }
        public string? ClienteDomicilio { get; set; }
        public string? ClienteTelefono { get; set; }
        public int? IdVendedor { get; set; }
        public string VendedorNombre { get; set; } = string.Empty;
        public string MetodoPago { get; set; } = string.Empty;
        public string? ReferenciaPago { get; set; }
        public int? IdMoneda { get; set; }
        public string? MonedaNombre { get; set; }
        public int? IdTipoPos { get; set; }
        public string? TipoPosNombre { get; set; }
        public DateTime? FechaTransferencia { get; set; }
        public string? ComprobanteBase64 { get; set; }
        public string? ComprobanteMime { get; set; }
        public int? NumeroCuotas { get; set; }
        public decimal MontoInicial { get; set; }
        public List<CuotaCreditoDTO> Cuotas { get; set; } = new();
        public decimal Total { get; set; }
        public List<ReciboTemporalDetalleDTO> Detalles { get; set; } = new();
    }

    public class ReciboTemporalDetalleDTO
    {
        public int IdProducto { get; set; }
        public string ProductoNombre { get; set; } = string.Empty;
        public int Cantidad { get; set; }
        public decimal PrecioUnitario { get; set; }
        public decimal Subtotal { get; set; }
    }

    public class CuotaCreditoDTO
    {
        public int NumeroCuota { get; set; }
        public DateTime FechaVencimiento { get; set; }
        public decimal Monto { get; set; }
    }
}
