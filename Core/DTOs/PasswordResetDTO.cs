namespace Core.DTOs;
public class PasswordResetUserDTO { public int IdUsuario{get;set;} public string Nombre{get;set;}=""; public string Correo{get;set;}=""; }
public class ForgotPasswordRequestDTO { public string Identificador{get;set;}=""; }
public class ResetPasswordRequestDTO { public string Token{get;set;}=""; public string Password{get;set;}=""; }
