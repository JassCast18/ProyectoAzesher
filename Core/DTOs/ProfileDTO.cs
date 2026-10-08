namespace Core.DTOs;

public class ProfileDTO
{
    public int IdUsuario { get; set; }
    public string Nombre { get; set; } = "";
    public string Apellidos { get; set; } = "";
    public string Telefono { get; set; } = "";
    public string Username { get; set; } = "";
    public string Correo { get; set; } = "";
    public string Rol { get; set; } = "";
}

public sealed class SaveProfileDTO
{
    public string Nombre { get; set; } = "";
    public string Apellidos { get; set; } = "";
    public string Telefono { get; set; } = "";
    public string Username { get; set; } = "";
    public string Correo { get; set; } = "";
    public string? CodigoCorreo { get; set; }
}

public sealed class RequestEmailCodeDTO
{
    public string Proposito { get; set; } = "";
}

public sealed class ChangePasswordDTO
{
    public string PasswordActual { get; set; } = "";
    public string PasswordNueva { get; set; } = "";
    public string? CodigoCorreo { get; set; }
}
