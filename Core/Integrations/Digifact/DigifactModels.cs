using System.Text.Json;
using System.Text.Json.Serialization;

namespace Core.Integrations.Digifact;

public sealed record NitValidationResult(bool IsValid, bool IsConsumerFinal, string Nit, string Name, string Message);
public sealed record DigifactStatusResult(bool Enabled, bool Configured, string Environment, string Message);
public sealed record DigifactDocument(byte[] Content, string ContentType, string FileName);

public sealed class DigifactCertificateResult
{
    [JsonConverter(typeof(FlexibleStringConverter))]
    public string Code { get; set; } = "";
    public string Message { get; set; } = "";
    public string AuthNumber { get; set; } = "";
    public string ResponseData1 { get; set; } = "";
    public string ResponseData2 { get; set; } = "";
    public string ResponseData3 { get; set; } = "";
    public string Batch { get; set; } = "";
    public string Serial { get; set; } = "";
    public string EnrolledTimeStamp { get; set; } = "";
}

public sealed class DigifactCancelResult
{
    [JsonConverter(typeof(FlexibleStringConverter))]
    public string Codigo { get; set; } = "";
    public string Mensaje { get; set; } = "";
    public string Autorizacion { get; set; } = "";
    public string Serie { get; set; } = "";
    public string Numero { get; set; } = "";
}

internal sealed class FlexibleStringConverter : JsonConverter<string>
{
    public override string Read(ref Utf8JsonReader reader, Type typeToConvert, JsonSerializerOptions options) =>
        reader.TokenType switch
        {
            JsonTokenType.String => reader.GetString() ?? "",
            JsonTokenType.Number => reader.TryGetInt64(out var number) ? number.ToString() : reader.GetDecimal().ToString(System.Globalization.CultureInfo.InvariantCulture),
            JsonTokenType.True => "true",
            JsonTokenType.False => "false",
            JsonTokenType.Null => "",
            _ => throw new JsonException($"No se puede convertir {reader.TokenType} a texto.")
        };
    public override void Write(Utf8JsonWriter writer, string value, JsonSerializerOptions options) => writer.WriteStringValue(value);
}

internal sealed class TokenResponse
{
    [JsonPropertyName("token")]
    public string Token { get; set; } = "";
}

internal sealed class NitLookupEnvelope
{
    [JsonPropertyName("RESPONSE")]
    public List<NitLookupItem> Response { get; set; } = [];
}

internal sealed class NitLookupItem
{
    [JsonPropertyName("NIT")]
    public string Nit { get; set; } = "";
    [JsonPropertyName("NOMBRE")]
    public string Name { get; set; } = "";
}

internal sealed class DocumentEnvelope
{
    [JsonPropertyName("RESPONSE")]
    public List<DocumentItem> Response { get; set; } = [];
}

internal sealed class DocumentItem
{
    public string ResponseData1 { get; set; } = "";
    public string ResponseData2 { get; set; } = "";
    public string ResponseData3 { get; set; } = "";
}

public sealed class DigifactException(string message, int? statusCode = null, string? providerResponse = null)
    : Exception(message)
{
    public int? StatusCode { get; } = statusCode;
    public string? ProviderResponse { get; } = providerResponse;
}
