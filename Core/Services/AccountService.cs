using System.Net.Mail;
using System.Security.Cryptography;
using System.Text;
using Core.DTOs;
using Dapper;
using Microsoft.Data.SqlClient;

namespace Core.Services;

public sealed class AccountService(IConfiguration configuration, IPasswordResetEmailService email)
{
    private readonly string connectionString = configuration.GetConnectionString("DefaultConnection")
        ?? throw new InvalidOperationException("No se configuró la conexión a la base de datos.");
    private readonly byte[] verificationKey = Encoding.UTF8.GetBytes(configuration["JwtSettings:Secret"]
        ?? throw new InvalidOperationException("Falta JwtSettings:Secret."));

    private sealed class AccountRow : ProfileDTO
    {
        public string PasswordHash { get; set; } = "";
        public bool Activo { get; set; }
    }

    private sealed class ChallengeRow
    {
        public long IdVerificacion { get; set; }
        public string CodigoHash { get; set; } = "";
        public string CorreoDestino { get; set; } = "";
        public byte Intentos { get; set; }
        public DateTime FechaExpiracion { get; set; }
    }

    private sealed class ResetTokenRow
    {
        public int IdToken { get; set; }
        public int IdUsuario { get; set; }
    }

    public async Task<ProfileDTO> GetProfileAsync(int userId)
    {
        await using var db = new SqlConnection(connectionString);
        var account = await LoadAccount(db, null, userId) ?? throw new InvalidOperationException("La cuenta ya no está activa.");
        return new ProfileDTO { IdUsuario = account.IdUsuario, Nombre = account.Nombre, Apellidos = account.Apellidos,
            Telefono = account.Telefono, Username = account.Username, Correo = account.Correo, Rol = account.Rol };
    }

    public async Task<string> RequestCodeAsync(int userId, string purpose)
    {
        if (purpose is not ("perfil" or "password")) throw new InvalidOperationException("Selecciona el tipo de verificación.");
        await using var db = new SqlConnection(connectionString);
        await db.OpenAsync();
        await using var tx = (SqlTransaction)await db.BeginTransactionAsync();
        var account = await LoadAccount(db, tx, userId) ?? throw new InvalidOperationException("La cuenta ya no está activa.");
        if (IsAdmin(account.Rol)) throw new InvalidOperationException("El administrador no necesita un código de correo.");
        // La prueba de identidad siempre va al correo ya registrado, no al nuevo correo propuesto.
        var destination = account.Correo;
        if (!MailAddress.TryCreate(destination, out _)) throw new InvalidOperationException("Se necesita un correo válido para confirmar el cambio.");

        var lastIssued = await db.QueryFirstOrDefaultAsync<DateTime?>(
            "SELECT MAX(fecha_creacion) FROM dbo.usuario_verificacion_correo WHERE id_usuario=@UserId AND proposito=@Purpose",
            new { UserId = userId, Purpose = purpose }, tx);
        if (lastIssued.HasValue && lastIssued.Value > DateTime.UtcNow.AddSeconds(-60))
            throw new InvalidOperationException("Espera un minuto antes de solicitar otro código.");

        var code = RandomNumberGenerator.GetInt32(0, 100_000_000).ToString("D8");
        await db.ExecuteAsync("UPDATE dbo.usuario_verificacion_correo SET fecha_uso=SYSUTCDATETIME() WHERE id_usuario=@UserId AND proposito=@Purpose AND fecha_uso IS NULL",
            new { UserId = userId, Purpose = purpose }, tx);
        var challengeId = await db.QuerySingleAsync<long>("""
            INSERT dbo.usuario_verificacion_correo(id_usuario,proposito,correo_destino,codigo_hash,fecha_expiracion)
            OUTPUT INSERTED.id_verificacion
            VALUES(@UserId,@Purpose,@Destination,@Hash,DATEADD(MINUTE,10,SYSUTCDATETIME()))
            """, new { UserId = userId, Purpose = purpose, Destination = destination, Hash = HashCode(userId, purpose, code) }, tx);
        await tx.CommitAsync();

        try { await email.SendVerificationCode(destination, account.Nombre, code); }
        catch
        {
            await db.ExecuteAsync("UPDATE dbo.usuario_verificacion_correo SET fecha_uso=SYSUTCDATETIME() WHERE id_verificacion=@ChallengeId",
                new { ChallengeId = challengeId });
            throw;
        }
        return destination;
    }

    public async Task<ProfileDTO> SaveProfileAsync(int userId, SaveProfileDTO input)
    {
        await using var db = new SqlConnection(connectionString);
        await db.OpenAsync();
        await using var tx = (SqlTransaction)await db.BeginTransactionAsync();
        var account = await LoadAccount(db, tx, userId) ?? throw new InvalidOperationException("La cuenta ya no está activa.");
        var emailAddress = input.Correo.Trim();
        if (!IsAdmin(account.Rol) && !await ConsumeCodeAsync(db, tx, userId, "perfil", account.Correo, input.CodigoCorreo))
        {
            await tx.CommitAsync();
            throw new InvalidOperationException("El código de correo es incorrecto, venció o agotó sus intentos.");
        }
        if (await db.ExecuteScalarAsync<int>("SELECT COUNT(1) FROM dbo.usuario WHERE username=@Username AND id_usuario<>@UserId",
            new { Username = input.Username.Trim(), UserId = userId }, tx) > 0)
            throw new InvalidOperationException("El nombre de usuario ya está registrado.");
        await db.ExecuteAsync("""
            UPDATE dbo.usuario SET nombre=@Nombre,apellidos=@Apellidos,telefono=@Telefono,
                username=@Username,correo=@Correo WHERE id_usuario=@UserId AND activo=1
            """, new {
                Nombre = input.Nombre.Trim(), Apellidos = input.Apellidos.Trim(),
                Telefono = string.IsNullOrWhiteSpace(input.Telefono) ? null : input.Telefono.Trim(),
                Username = input.Username.Trim(), Correo = emailAddress, UserId = userId
            }, tx);
        await tx.CommitAsync();
        return await GetProfileAsync(userId);
    }

    public async Task ChangePasswordAsync(int actorId, int targetId, string currentPassword, string newPassword, string? emailCode)
    {
        await using var db = new SqlConnection(connectionString);
        await db.OpenAsync();
        await using var tx = (SqlTransaction)await db.BeginTransactionAsync();
        var actor = await LoadAccount(db, tx, actorId) ?? throw new InvalidOperationException("La cuenta ya no está activa.");
        if (!BCrypt.Net.BCrypt.Verify(currentPassword, actor.PasswordHash))
            throw new InvalidOperationException("Tu contraseña actual no es correcta.");
        if (targetId != actorId && !IsAdmin(actor.Rol)) throw new UnauthorizedAccessException("No puedes cambiar la contraseña de otro usuario.");
        var target = targetId == actorId ? actor : await LoadAccount(db, tx, targetId)
            ?? throw new InvalidOperationException("El usuario seleccionado no está activo.");
        if (targetId == actorId && !IsAdmin(actor.Rol) &&
            !await ConsumeCodeAsync(db, tx, actorId, "password", actor.Correo, emailCode))
        {
            await tx.CommitAsync();
            throw new InvalidOperationException("El código de correo es incorrecto, venció o agotó sus intentos.");
        }
        await SetNewPasswordAsync(db, tx, target, newPassword);
        await tx.CommitAsync();
    }

    public async Task ResetPasswordAsync(string tokenHash, string newPassword)
    {
        await using var db = new SqlConnection(connectionString);
        await db.OpenAsync();
        await using var tx = (SqlTransaction)await db.BeginTransactionAsync();
        var token = await db.QueryFirstOrDefaultAsync<ResetTokenRow>("""
            SELECT TOP(1) id_token IdToken,id_usuario IdUsuario FROM dbo.password_reset_token WITH(UPDLOCK,HOLDLOCK)
            WHERE token_hash=@TokenHash AND fecha_uso IS NULL AND fecha_expiracion>SYSUTCDATETIME()
            """, new { TokenHash = tokenHash }, tx);
        if (token is null) throw new InvalidOperationException("El enlace no es válido o ya venció.");
        var account = await LoadAccount(db, tx, token.IdUsuario) ?? throw new InvalidOperationException("La cuenta ya no está activa.");
        await SetNewPasswordAsync(db, tx, account, newPassword);
        await db.ExecuteAsync("UPDATE dbo.password_reset_token SET fecha_uso=SYSUTCDATETIME() WHERE id_token=@IdToken",
            new { token.IdToken }, tx);
        await tx.CommitAsync();
    }

    private static async Task<AccountRow?> LoadAccount(SqlConnection db, SqlTransaction? tx, int userId) =>
        await db.QueryFirstOrDefaultAsync<AccountRow>("""
            SELECT id_usuario IdUsuario,nombre Nombre,ISNULL(apellidos,'') Apellidos,
                   ISNULL(telefono,'') Telefono,username Username,ISNULL(correo,'') Correo,
                   rol Rol,password PasswordHash,activo Activo
            FROM dbo.usuario WITH(UPDLOCK,HOLDLOCK) WHERE id_usuario=@UserId AND activo=1
            """, new { UserId = userId }, tx);

    private async Task<bool> ConsumeCodeAsync(SqlConnection db, SqlTransaction tx, int userId,
        string purpose, string destination, string? code)
    {
        if (string.IsNullOrWhiteSpace(code)) return false;
        var challenge = await db.QueryFirstOrDefaultAsync<ChallengeRow>("""
            SELECT TOP(1) id_verificacion IdVerificacion,codigo_hash CodigoHash,
                   correo_destino CorreoDestino,intentos Intentos,fecha_expiracion FechaExpiracion
            FROM dbo.usuario_verificacion_correo WITH(UPDLOCK,HOLDLOCK)
            WHERE id_usuario=@UserId AND proposito=@Purpose AND fecha_uso IS NULL
            ORDER BY id_verificacion DESC
            """, new { UserId = userId, Purpose = purpose }, tx);
        if (challenge is null || challenge.Intentos >= 5 || challenge.FechaExpiracion <= DateTime.UtcNow ||
            !string.Equals(challenge.CorreoDestino, destination, StringComparison.OrdinalIgnoreCase)) return false;
        var supplied = Convert.FromHexString(HashCode(userId, purpose, code.Trim()));
        var expected = Convert.FromHexString(challenge.CodigoHash);
        if (!CryptographicOperations.FixedTimeEquals(supplied, expected))
        {
            await db.ExecuteAsync("UPDATE dbo.usuario_verificacion_correo SET intentos=intentos+1 WHERE id_verificacion=@IdVerificacion",
                new { challenge.IdVerificacion }, tx);
            return false;
        }
        await db.ExecuteAsync("UPDATE dbo.usuario_verificacion_correo SET fecha_uso=SYSUTCDATETIME() WHERE id_verificacion=@IdVerificacion",
            new { challenge.IdVerificacion }, tx);
        return true;
    }

    private async Task SetNewPasswordAsync(SqlConnection db, SqlTransaction tx, AccountRow account, string newPassword)
    {
        if (!PasswordPolicy.IsValid(newPassword)) throw new InvalidOperationException(PasswordPolicy.Message);
        var history = await db.QueryAsync<string>("""
            SELECT TOP(2) password_hash FROM dbo.usuario_password_historial
            WHERE id_usuario=@UserId ORDER BY id_historial DESC
            """, new { UserId = account.IdUsuario }, tx);
        if (new[] { account.PasswordHash }.Concat(history).Any(hash => BCrypt.Net.BCrypt.Verify(newPassword, hash)))
            throw new InvalidOperationException("Elige una contraseña distinta de la actual y de las dos anteriores.");
        var newHash = BCrypt.Net.BCrypt.HashPassword(newPassword);
        await db.ExecuteAsync("""
            UPDATE dbo.usuario SET password=@NewHash,requiere_cambio_password=0,
            fecha_expiracion_password=CASE WHEN LOWER(rol) IN('administrador','admin','demo','superusuario')
                THEN NULL ELSE DATEADD(DAY,90,CAST(GETDATE() AS DATE)) END
            WHERE id_usuario=@UserId AND activo=1;
            INSERT dbo.usuario_password_historial(id_usuario,password_hash)
                VALUES(@UserId,@OldHash);
            DELETE FROM dbo.usuario_password_historial
            WHERE id_usuario=@UserId AND id_historial NOT IN
                (SELECT TOP(2) id_historial FROM dbo.usuario_password_historial
                 WHERE id_usuario=@UserId ORDER BY id_historial DESC);
            UPDATE dbo.password_reset_token SET fecha_uso=SYSUTCDATETIME()
                WHERE id_usuario=@UserId AND fecha_uso IS NULL;
            UPDATE dbo.usuario_verificacion_correo SET fecha_uso=SYSUTCDATETIME()
                WHERE id_usuario=@UserId AND fecha_uso IS NULL;
            """, new { UserId = account.IdUsuario, NewHash = newHash, OldHash = account.PasswordHash }, tx);
    }

    private string HashCode(int userId, string purpose, string code) =>
        Convert.ToHexString(HMACSHA256.HashData(verificationKey, Encoding.UTF8.GetBytes($"{userId}:{purpose}:{code}")));

    public static bool IsAdmin(string role) => role.Trim().ToLowerInvariant() is "administrador" or "admin" or "demo" or "superusuario";
}
