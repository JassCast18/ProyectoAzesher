using System.Text.Json;

namespace Core.Integrations.Digifact;

public interface IDigifactClient
{
    DigifactStatusResult GetStatus();
    Task<DigifactStatusResult> TestConnectionAsync(CancellationToken cancellationToken = default);
    Task<NitValidationResult> ValidateNitAsync(string? nit, CancellationToken cancellationToken = default);
    Task<DigifactCertificateResult> CertifyAsync(JsonElement nuc, CancellationToken cancellationToken = default);
    Task<DigifactCancelResult> CancelAsync(string authorization, string receiverTaxId, DateTime issuedAt, string reason, CancellationToken cancellationToken = default);
    Task<DigifactDocument> GetPdfAsync(string authorization, CancellationToken cancellationToken = default);
}
