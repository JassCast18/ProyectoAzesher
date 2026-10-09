namespace Core.DTOs;

public sealed class NotificationDTO
{
    public long IdNotificacion { get; set; }
    public string Tipo { get; set; } = "";
    public string Titulo { get; set; } = "";
    public string Mensaje { get; set; } = "";
    public string? Url { get; set; }
    public string? Entidad { get; set; }
    public int? IdEntidad { get; set; }
    public DateTime FechaCreacion { get; set; }
    public DateTime? FechaLectura { get; set; }
    public DateTime? FechaResolucion { get; set; }
    public bool Leida => FechaLectura.HasValue;
    public bool Resuelta => FechaResolucion.HasValue;
}

public sealed class NotificationListDTO
{
    public int NoLeidas { get; set; }
    public List<NotificationDTO> Registros { get; set; } = [];
}
