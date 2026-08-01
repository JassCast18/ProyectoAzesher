namespace Core.DTOs
{
    public class ReciboVentaDTO
    {
        public int IdRecibo { get; set; }
        public string NumeroRecibo { get; set; } = string.Empty;
        public DateTime? FechaPago { get; set; }
        public decimal Monto { get; set; }
        public string MetodoPago { get; set; } = string.Empty;
        public string? NumeroComprobante { get; set; }

        public int IdFactura { get; set; }
        public string NumeroFactura { get; set; } = string.Empty;
        public DateTime? FechaEmisionFactura { get; set; }
        public decimal TotalFactura { get; set; }
        public string EstadoFactura { get; set; } = string.Empty;

        public int IdVenta { get; set; }
        public DateTime? FechaVenta { get; set; }
        public decimal TotalVenta { get; set; }
        public string TipoPagoVenta { get; set; } = string.Empty;

        public int IdCliente { get; set; }
        public string ClienteNombre { get; set; } = string.Empty;
        public string? ClienteNit { get; set; }
        public string? ClienteDomicilio { get; set; }
        public string? ClienteTelefono { get; set; }

        public int IdVendedor { get; set; }
        public string VendedorNombre { get; set; } = string.Empty;
        public string? SucursalNombre { get; set; }

        public List<ReciboDetalleVentaDTO> Detalles { get; set; } = new();
    }

    public class ReciboDetalleVentaDTO
    {
        public int IdDetalle { get; set; }
        public int IdProducto { get; set; }
        public string ProductoNombre { get; set; } = string.Empty;
        public int Cantidad { get; set; }
        public decimal PrecioUnitario { get; set; }
        public decimal Subtotal { get; set; }
    }
}
