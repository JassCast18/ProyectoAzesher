using System.Configuration;
using System.Data;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using Core.DTOs;
using Core.DTOs.Interfaces;
using Core.Models;
using Dapper;
using Microsoft.Data.SqlClient;
using Microsoft.IdentityModel.Tokens;

namespace Core.Provider
{
    public class AuthProvider(IConfiguration configuration) : IAuthProviderDTO
    {
        private readonly string _connectionString = configuration.GetConnectionString("DefaultConnection")
        ?? throw new ArgumentNullException(nameof(configuration));

        private readonly IConfiguration _configuration = configuration;
        public async Task<UsuarioLoginDTO?> ObtenerUsuarioParaLoginAsync(string username)
        {
            try
            {
                using (var db = new SqlConnection(_connectionString))
                {
                    var parametros = new DynamicParameters();
                    parametros.Add("@Username", username);

                    var resultado = await db.QueryFirstOrDefaultAsync<UsuarioLoginDTO>(
                        "sp_obtener_usuario_por_username",
                        parametros,
                        commandType: CommandType.StoredProcedure
                    );

                    return resultado;
                }
            }
            catch (SqlException ex)
            {
                throw new Exception($"Error en la base de datos al intentar iniciar sesión: {ex.Message}");
            }
        }

        public string GenerarTokenJwt(UsuarioLoginDTO usuario)
        {
            var jwtSettings = _configuration.GetSection("JwtSettings");
            var secretKey = jwtSettings["Secret"];
            var key = Encoding.ASCII.GetBytes(secretKey!);

            var claims = new List<Claim>
            {
                new Claim(ClaimTypes.NameIdentifier, usuario.id_usuario.ToString()),
                new Claim(ClaimTypes.Name, usuario.username),
                new Claim(ClaimTypes.Role, usuario.rol ?? "User"),
                new Claim("id_sucursal", usuario.id_sucursal.ToString()?? ""),
                new Claim("nombre_sucursal", usuario.nombre_sucursal ?? "")
            };

            var tokenDescriptor = new SecurityTokenDescriptor
            {
                Subject = new ClaimsIdentity(claims),
                Expires = DateTime.UtcNow.AddHours(8), // El token expira en 8 horas
                Issuer = jwtSettings["Issuer"],
                Audience = jwtSettings["Audience"],
                SigningCredentials = new SigningCredentials(new SymmetricSecurityKey(key), SecurityAlgorithms.HmacSha256Signature)
            };

            var tokenHandler = new JwtSecurityTokenHandler();
            var token = tokenHandler.CreateToken(tokenDescriptor);

            return tokenHandler.WriteToken(token);
        }

        public async Task<List<Sucursal>> ObtenerSucursalesPorUsuarioAsync(int? idSucursal)
        {
            using (var connection = new SqlConnection(_connectionString))
            {
                var parametros = new DynamicParameters();
                parametros.Add("@IdSucursalUsuario", idSucursal);

                var resultado = await connection.QueryAsync<Sucursal>(
                    "dbo.sp_obtener_sucursales",
                    parametros,
                    commandType: CommandType.StoredProcedure
                );

                return resultado.ToList();
            }
        }
    }
}
