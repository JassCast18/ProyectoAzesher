namespace Core.DTOs;

public sealed class ProductoCodigoBarraDTO
{
    public int IdCodigoBarra { get; set; }
    public int IdProducto { get; set; }
    public string Codigo { get; set; } = string.Empty;
    public string Tipo { get; set; } = "CODE128";
    public bool Activo { get; set; }
    public DateTime FechaRegistro { get; set; }
}

public sealed class GuardarProductoCodigoBarraDTO
{
    public string Codigo { get; set; } = string.Empty;
    public string Tipo { get; set; } = "CODE128";
}

public sealed class EscaneoCodigoBarraDTO
{
    public string Codigo { get; set; } = string.Empty;
}
