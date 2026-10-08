using System.Net.Mail;
using System.Security.Claims;
using System.Text.RegularExpressions;
using Core.DTOs;
using Core.DTOs.Interfaces;
using Core.Models;
using Core.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Core.Controllers;

[ApiController]
[Authorize]
[Route("api/perfil")]
public sealed class ProfileController(AccountService accounts, IAuthProviderDTO auth) : ControllerBase
{
    private int UserId => int.TryParse(User.FindFirstValue(ClaimTypes.NameIdentifier), out var id) ? id : 0;
    private static ApiResponse<object> Failure(string message) => new() { Success = false, Message = message };

    [HttpGet]
    public async Task<IActionResult> Get()
    {
        try { return Ok(new ApiResponse<object> { Success = true, Data = await accounts.GetProfileAsync(UserId) }); }
        catch (InvalidOperationException ex) { return BadRequest(Failure(ex.Message)); }
    }

    [HttpPost("verificacion")]
    public async Task<IActionResult> RequestCode(RequestEmailCodeDTO request)
    {
        try
        {
            var destination = await accounts.RequestCodeAsync(UserId, request.Proposito);
            return Ok(new ApiResponse<object> { Success = true, Message = $"Enviamos un código a {destination}. Vence en 10 minutos." });
        }
        catch (Exception ex) when (ex is InvalidOperationException or FormatException or SmtpException)
        { return BadRequest(Failure(ex is SmtpException ? "No fue posible enviar el correo de verificación." : ex.Message)); }
    }

    [HttpPut]
    public async Task<IActionResult> Save(SaveProfileDTO request)
    {
        if (string.IsNullOrWhiteSpace(request.Nombre) || string.IsNullOrWhiteSpace(request.Apellidos) ||
            string.IsNullOrWhiteSpace(request.Username) || !MailAddress.TryCreate(request.Correo, out _) ||
            (!string.IsNullOrWhiteSpace(request.Telefono) && !Regex.IsMatch(request.Telefono, "^[0-9]{8}$")))
            return BadRequest(Failure("Completa nombres, apellidos, usuario, correo válido y teléfono de ocho dígitos si lo ingresas."));
        try
        {
            var profile = await accounts.SaveProfileAsync(UserId, request);
            var login = await auth.ObtenerUsuarioParaLoginAsync(profile.Username);
            if (login is null) throw new InvalidOperationException("No fue posible actualizar la sesión.");
            login.password = string.Empty;
            return Ok(new ApiResponse<object> { Success = true, Message = "Perfil actualizado.", Data = new { Perfil = profile, Token = auth.GenerarTokenJwt(login) } });
        }
        catch (Exception ex) when (ex is InvalidOperationException or Microsoft.Data.SqlClient.SqlException)
        { return BadRequest(Failure(ex is Microsoft.Data.SqlClient.SqlException ? "No fue posible guardar el perfil. Revisa que el usuario y correo no estén duplicados." : ex.Message)); }
    }

    [HttpPost("password")]
    public Task<IActionResult> ChangeSelfPassword(ChangePasswordDTO request) => ChangePassword(UserId, request);

    [HttpPost("usuarios/{targetId:int}/password")]
    [Authorize(Roles = "demo,Demo,superusuario,Superusuario,admin,Admin,Administrador,administrador")]
    public Task<IActionResult> ChangeUserPassword(int targetId, ChangePasswordDTO request) => ChangePassword(targetId, request);

    private async Task<IActionResult> ChangePassword(int targetId, ChangePasswordDTO request)
    {
        if (string.IsNullOrWhiteSpace(request.PasswordActual) || !PasswordPolicy.IsValid(request.PasswordNueva))
            return BadRequest(Failure(PasswordPolicy.Message + " Ingresa también tu contraseña actual."));
        try
        {
            await accounts.ChangePasswordAsync(UserId, targetId, request.PasswordActual, request.PasswordNueva, request.CodigoCorreo);
            return Ok(new ApiResponse<object> { Success = true, Message = "Contraseña actualizada." });
        }
        catch (UnauthorizedAccessException) { return Forbid(); }
        catch (InvalidOperationException ex) { return BadRequest(Failure(ex.Message)); }
    }
}
