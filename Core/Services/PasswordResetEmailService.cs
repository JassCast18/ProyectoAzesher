using System.Net;
using System.Net.Mail;

namespace Core.Services;

public interface IPasswordResetEmailService
{
    Task Send(string destination, string name, string link);
    Task SendVerificationCode(string destination, string name, string code);
}

public sealed class PasswordResetEmailService(IConfiguration configuration) : IPasswordResetEmailService
{
    public Task Send(string destination, string name, string link)
    {
        var safeName = WebUtility.HtmlEncode(name);
        var safeLink = WebUtility.HtmlEncode(link);
        var body = $"<p>Hola {safeName}:</p><p>Usa este enlace para crear una nueva contraseña. Vence en 30 minutos y solo puede utilizarse una vez.</p><p><a href=\"{safeLink}\">Restablecer mi contraseña</a></p><p>Si no solicitaste el cambio, ignora este correo.</p>";
        return SendMessage(destination, "Restablecer contraseña - Aze-Sher", body);
    }

    public Task SendVerificationCode(string destination, string name, string code)
    {
        var safeName = WebUtility.HtmlEncode(name);
        var body = $"<p>Hola {safeName}:</p><p>Tu código para confirmar un cambio en tu cuenta es:</p><p style=\"font-size:26px;font-weight:700;letter-spacing:4px\">{code}</p><p>Vence en 10 minutos. Si no solicitaste el cambio, ignora este correo.</p>";
        return SendMessage(destination, "Código de seguridad - Aze-Sher", body);
    }

    private async Task SendMessage(string destination, string subject, string body)
    {
        var section = configuration.GetSection("Smtp");
        if (!section.GetValue<bool>("Enabled")) throw new InvalidOperationException("El envío de correo aún no está configurado.");
        var host = section["Host"] ?? throw new InvalidOperationException("Falta configurar Smtp:Host.");
        var from = section["From"] ?? throw new InvalidOperationException("Falta configurar Smtp:From.");
        var username = section["Username"];
        var password = section["Password"];
        if (string.IsNullOrWhiteSpace(username) || string.IsNullOrWhiteSpace(password))
            throw new InvalidOperationException("Faltan las credenciales SMTP.");

        using var message = new MailMessage
        {
            From = new MailAddress(from, section["FromName"] ?? "Aze-Sher"),
            Subject = subject,
            Body = body,
            IsBodyHtml = true
        };
        message.To.Add(destination);
        using var smtp = new SmtpClient(host, section.GetValue<int?>("Port") ?? 587)
        {
            EnableSsl = section.GetValue("EnableSsl", true),
            UseDefaultCredentials = false,
            Credentials = new NetworkCredential(username, password)
        };
        await smtp.SendMailAsync(message);
    }
}
