using System.Net;
using System.Net.Mail;
namespace Core.Services;
public interface IPasswordResetEmailService { Task Send(string destination,string name,string link); }
public class PasswordResetEmailService(IConfiguration configuration):IPasswordResetEmailService
{
 public async Task Send(string destination,string name,string link)
 {
  var section=configuration.GetSection("Smtp");
  if(!section.GetValue<bool>("Enabled")) throw new InvalidOperationException("El envío de correo aún no está configurado.");
  var host=section["Host"]??throw new InvalidOperationException("Falta configurar Smtp:Host.");
  var from=section["From"]??throw new InvalidOperationException("Falta configurar Smtp:From.");
  using var message=new MailMessage(from,destination,"Restablecer contraseña - Aze-Sher's",$"Hola {name}:\n\nUsa este enlace para crear una nueva contraseña. Vence en 30 minutos y sólo puede utilizarse una vez:\n\n{link}\n\nSi no solicitaste el cambio, ignora este correo.");
  using var smtp=new SmtpClient(host,section.GetValue<int?>("Port")??587){EnableSsl=section.GetValue("EnableSsl",true)};
  var username=section["Username"];var password=section["Password"];
  if(!string.IsNullOrWhiteSpace(username)) smtp.Credentials=new NetworkCredential(username,password);
  await smtp.SendMailAsync(message);
 }
}
