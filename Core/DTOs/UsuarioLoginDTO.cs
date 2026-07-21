namespace Core.DTOs
{
    public class UsuarioLoginDTO
    {
        public int id_usuario { get; set; }
        public required string nombre { get; set; }
        public required string username { get; set; }
        public required string password { get; set; } 
        public required string rol { get; set; }
        public int id_sucursal { get; set; }
        public required string nombre_sucursal { get; set; }
    }
}
