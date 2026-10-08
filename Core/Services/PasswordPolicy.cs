namespace Core.Services;

public static class PasswordPolicy
{
    public const string Message = "La contraseña debe tener al menos 8 caracteres, letras, números y un símbolo.";

    public static bool IsValid(string? password) =>
        !string.IsNullOrWhiteSpace(password) &&
        password.Length >= 8 &&
        password.Any(char.IsLetter) &&
        password.Any(char.IsDigit) &&
        password.Any(character => !char.IsLetterOrDigit(character) && !char.IsWhiteSpace(character));
}
