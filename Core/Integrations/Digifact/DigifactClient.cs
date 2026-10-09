using System.Net;
using System.Net.Http.Json;
using System.Text;
using System.Text.Json;
using Microsoft.Extensions.Options;

namespace Core.Integrations.Digifact;

public sealed class DigifactClient(HttpClient http, IOptions<DigifactOptions> configuredOptions) : IDigifactClient
{
    private static readonly JsonSerializerOptions JsonOptions = new(JsonSerializerDefaults.Web)
    {
        PropertyNameCaseInsensitive = true
    };
    private readonly DigifactOptions options = configuredOptions.Value;
    private readonly SemaphoreSlim tokenLock = new(1, 1);
    private string? token;
    private DateTimeOffset tokenExpiresAt = DateTimeOffset.MinValue;

    public DigifactStatusResult GetStatus()
    {
        var configured = options.HasCredentials;
        var message = !options.Enabled
            ? "La integración con Digifact está desactivada."
            : configured
                ? "Credenciales TEST configuradas."
                : "Faltan Digifact__TaxId, Digifact__Username o Digifact__Password.";
        return new(options.Enabled, configured, options.Environment, message);
    }

    public async Task<DigifactStatusResult> TestConnectionAsync(CancellationToken cancellationToken = default)
    {
        EnsureConfigured();
        await GetTokenAsync(true, cancellationToken);
        return new(true, true, options.Environment, "Conexión con Digifact realizada correctamente.");
    }

    public async Task<NitValidationResult> ValidateNitAsync(string? input, CancellationToken cancellationToken = default)
    {
        var nit = NormalizeReceiverNit(input);
        if (nit == "CF")
            return new(true, true, "CF", "CONSUMIDOR FINAL", "Consumidor Final no requiere consulta.");

        if (!IsLocallyValidNit(nit))
            return new(false, false, nit, "", "El formato o dígito verificador del NIT no es válido.");

        EnsureConfigured();
        using var response = await SendAuthorizedAsync(() =>
        {
            var path = $"Shared?COUNTRY=GT&TAXID={Uri.EscapeDataString(options.NormalizedTaxId)}&DATA1=SHARED_GETINFONITcom&DATA2={Uri.EscapeDataString($"NIT|{nit}")}&USERNAME={Uri.EscapeDataString(options.Username)}";
            return new HttpRequestMessage(HttpMethod.Get, path);
        }, cancellationToken);

        var json = await response.Content.ReadAsStringAsync(cancellationToken);
        if (!response.IsSuccessStatusCode) throw BuildException(response.StatusCode, json, "No fue posible consultar el NIT.");
        var envelope = JsonSerializer.Deserialize<NitLookupEnvelope>(json, JsonOptions);
        var result = envelope?.Response.FirstOrDefault();
        return result is null || string.IsNullOrWhiteSpace(result.Name)
            ? new(false, false, nit, "", options.Environment.Equals("Test", StringComparison.OrdinalIgnoreCase)
                ? "El NIT tiene un formato válido, pero Digifact no lo encontró en su ambiente TEST. Verifica el número o consulta con Digifact si ese contribuyente está disponible para pruebas."
                : "El NIT tiene un formato válido, pero no fue encontrado en el registro consultado por Digifact.")
            : new(true, false, DigifactOptions.NormalizeTaxId(result.Nit), result.Name.Trim(), "NIT validado correctamente.");
    }

    public async Task<DigifactCertificateResult> CertifyAsync(JsonElement nuc, CancellationToken cancellationToken = default)
    {
        EnsureConfigured();
        using var response = await SendAuthorizedAsync(() =>
        {
            var path = $"v2/transform/nuc_json?TAXID={Uri.EscapeDataString(options.NormalizedTaxId)}&FORMAT={Uri.EscapeDataString("PDF|HTML|XML")}&USERNAME={Uri.EscapeDataString(options.Username)}";
            return new HttpRequestMessage(HttpMethod.Post, path)
            {
                Content = new StringContent(nuc.GetRawText(), Encoding.UTF8, "application/json")
            };
        }, cancellationToken);
        var json = await response.Content.ReadAsStringAsync(cancellationToken);
        if (!response.IsSuccessStatusCode) throw BuildException(response.StatusCode, json, "Digifact rechazó la certificación.");
        var result = JsonSerializer.Deserialize<DigifactCertificateResult>(json, JsonOptions)
            ?? throw new DigifactException("Digifact devolvió una respuesta vacía al certificar.");
        if (result.Code != "1" || string.IsNullOrWhiteSpace(result.AuthNumber))
            throw new DigifactException(result.Message.Length > 0 ? result.Message : "El DTE no fue certificado.", (int)response.StatusCode, json);
        return result;
    }

    public async Task<DigifactCancelResult> CancelAsync(string authorization, string receiverTaxId, DateTime issuedAt, string reason, CancellationToken cancellationToken = default)
    {
        EnsureConfigured();
        if (string.IsNullOrWhiteSpace(authorization)) throw new ArgumentException("La factura no tiene UUID de autorización.");
        if (string.IsNullOrWhiteSpace(reason)) throw new ArgumentException("El motivo de anulación es obligatorio.");
        using var response = await SendAuthorizedAsync(() => new HttpRequestMessage(HttpMethod.Post, "CancelFelGT")
        {
            Content = JsonContent.Create(new
            {
                Taxid = DigifactOptions.NormalizeTaxId(options.TaxId),
                Autorizacion = authorization,
                IdReceptor = NormalizeReceiverNit(receiverTaxId),
                FechaEmisionDocumentoAnular = issuedAt.ToString("yyyy-MM-ddTHH:mm:ss"),
                MotivoAnulacion = reason.Trim(),
                Username = options.Username
            })
        }, cancellationToken);
        var json = await response.Content.ReadAsStringAsync(cancellationToken);
        if (!response.IsSuccessStatusCode) throw BuildException(response.StatusCode, json, "No fue posible anular la factura en Digifact.");
        var result = JsonSerializer.Deserialize<DigifactCancelResult>(json, JsonOptions)
            ?? throw new DigifactException("Digifact devolvió una respuesta vacía al anular.");
        if (result.Codigo != "1") throw new DigifactException(result.Mensaje.Length > 0 ? result.Mensaje : "La factura no fue anulada.", (int)response.StatusCode, json);
        return result;
    }

    public async Task<DigifactDocument> GetPdfAsync(string authorization, CancellationToken cancellationToken = default)
    {
        EnsureConfigured();
        using var response = await SendAuthorizedAsync(() =>
        {
            var path = $"GetDocument?AUTHNUMBER={Uri.EscapeDataString(authorization)}&TAXID={Uri.EscapeDataString(options.NormalizedTaxId)}&FORMAT=PDF&USERNAME={Uri.EscapeDataString(options.Username)}";
            return new HttpRequestMessage(HttpMethod.Get, path);
        }, cancellationToken);
        var json = await response.Content.ReadAsStringAsync(cancellationToken);
        if (!response.IsSuccessStatusCode) throw BuildException(response.StatusCode, json, "No fue posible descargar el PDF oficial.");
        var item = JsonSerializer.Deserialize<DocumentEnvelope>(json, JsonOptions)?.Response.FirstOrDefault();
        if (item is null)
            throw new DigifactException("Digifact no encontró el PDF de esta factura.", 404, json);
        foreach (var encoded in new[] { item.ResponseData3, item.ResponseData2, item.ResponseData1 })
        {
            if (string.IsNullOrWhiteSpace(encoded)) continue;
            try
            {
                var bytes = Convert.FromBase64String(encoded);
                if (bytes.Length >= 4 && bytes[0] == '%' && bytes[1] == 'P' && bytes[2] == 'D' && bytes[3] == 'F')
                    return new(bytes, "application/pdf", $"FEL-{authorization}.pdf");
            }
            catch (FormatException) { }
        }
        throw new DigifactException("Digifact respondió el documento, pero ninguno de sus campos contiene un PDF válido.", 502, json);
    }

    private async Task<HttpResponseMessage> SendAuthorizedAsync(Func<HttpRequestMessage> requestFactory, CancellationToken cancellationToken)
    {
        var currentToken = await GetTokenAsync(false, cancellationToken);
        var request = requestFactory();
        request.Headers.TryAddWithoutValidation("Authorization", currentToken);
        var response = await http.SendAsync(request, cancellationToken);
        if (response.StatusCode != HttpStatusCode.Unauthorized) return response;

        response.Dispose();
        currentToken = await GetTokenAsync(true, cancellationToken);
        request = requestFactory();
        request.Headers.TryAddWithoutValidation("Authorization", currentToken);
        return await http.SendAsync(request, cancellationToken);
    }

    private async Task<string> GetTokenAsync(bool forceRefresh, CancellationToken cancellationToken)
    {
        EnsureConfigured();
        if (!forceRefresh && token is not null && tokenExpiresAt > DateTimeOffset.UtcNow.AddMinutes(2)) return token;
        await tokenLock.WaitAsync(cancellationToken);
        try
        {
            if (!forceRefresh && token is not null && tokenExpiresAt > DateTimeOffset.UtcNow.AddMinutes(2)) return token;
            using var response = await http.PostAsJsonAsync("login/get_token", new { Username = options.LoginUsername, options.Password }, cancellationToken);
            var json = await response.Content.ReadAsStringAsync(cancellationToken);
            if (!response.IsSuccessStatusCode) throw BuildException(response.StatusCode, json, "No fue posible iniciar sesión en Digifact.");
            token = JsonSerializer.Deserialize<TokenResponse>(json, JsonOptions)?.Token;
            if (string.IsNullOrWhiteSpace(token)) throw new DigifactException("Digifact no devolvió un token de acceso.");
            tokenExpiresAt = ReadJwtExpiration(token) ?? DateTimeOffset.UtcNow.AddMinutes(25);
            return token;
        }
        finally { tokenLock.Release(); }
    }

    private void EnsureConfigured()
    {
        if (!options.Enabled) throw new DigifactException("La integración con Digifact está desactivada.", 503);
        if (!options.HasCredentials) throw new DigifactException("La integración con Digifact no está configurada. Completa Core/.env.", 503);
    }

    private static DigifactException BuildException(HttpStatusCode status, string content, string fallback)
    {
        var message = fallback;
        try
        {
            using var document = JsonDocument.Parse(content);
            var root = document.RootElement;
            foreach (var name in new[] { "message", "Message", "mensaje", "Mensaje", "description", "Description" })
                if (root.TryGetProperty(name, out var value) && !string.IsNullOrWhiteSpace(value.ToString())) { message = value.ToString(); break; }
        }
        catch (JsonException) { }
        return new(message, (int)status, content);
    }

    public static string NormalizeReceiverNit(string? input)
    {
        var value = DigifactOptions.NormalizeTaxId(input);
        return string.IsNullOrWhiteSpace(value) || value == "CF" ? "CF" : value;
    }

    public static bool IsLocallyValidNit(string nit)
    {
        if (nit == "CF") return true;
        if (nit.Length < 2 || nit[..^1].Any(c => !char.IsDigit(c)) || !(char.IsDigit(nit[^1]) || nit[^1] == 'K')) return false;
        var body = nit[..^1];
        var sum = body.Select((digit, index) => (digit - '0') * (body.Length + 1 - index)).Sum();
        var result = (11 - sum % 11) % 11;
        return nit[^1] == (result == 10 ? 'K' : (char)('0' + result));
    }

    private static DateTimeOffset? ReadJwtExpiration(string jwt)
    {
        try
        {
            var payload = jwt.Split('.')[1].Replace('-', '+').Replace('_', '/');
            payload = payload.PadRight(payload.Length + (4 - payload.Length % 4) % 4, '=');
            using var document = JsonDocument.Parse(Convert.FromBase64String(payload));
            return document.RootElement.TryGetProperty("exp", out var exp)
                ? DateTimeOffset.FromUnixTimeSeconds(exp.GetInt64())
                : null;
        }
        catch (Exception) { return null; }
    }
}
