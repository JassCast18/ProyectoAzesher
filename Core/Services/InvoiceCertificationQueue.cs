using System.Threading.Channels;
using System.Collections.Concurrent;
using Core.DTOs.Interfaces;
using Core.Integrations.Digifact;

namespace Core.Services;

public sealed record InvoiceCertificationJob(int InvoiceId, int UserId);

public sealed class InvoicePdfCache
{
    private readonly ConcurrentDictionary<int, DigifactDocument> documents = new();
    public void Store(int invoiceId, DigifactDocument document)
    {
        documents[invoiceId] = document;
        if (documents.Count > 100)
            foreach (var key in documents.Keys.OrderBy(id => id).Take(documents.Count - 100)) documents.TryRemove(key, out _);
    }
    public bool TryGet(int invoiceId, out DigifactDocument? document) => documents.TryGetValue(invoiceId, out document);
}

public sealed class InvoiceCertificationQueue
{
    private readonly Channel<InvoiceCertificationJob> jobs = Channel.CreateUnbounded<InvoiceCertificationJob>(
        new UnboundedChannelOptions { SingleReader = true, SingleWriter = false });

    public bool Queue(int invoiceId, int userId) => jobs.Writer.TryWrite(new(invoiceId, userId));
    public IAsyncEnumerable<InvoiceCertificationJob> ReadAllAsync(CancellationToken cancellationToken) => jobs.Reader.ReadAllAsync(cancellationToken);
}

public sealed class InvoiceCertificationWorker(InvoiceCertificationQueue queue, InvoicePdfCache pdfCache, IServiceScopeFactory scopeFactory, ILogger<InvoiceCertificationWorker> logger) : BackgroundService
{
    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        await foreach (var job in queue.ReadAllAsync(stoppingToken))
        {
            try
            {
                await using var scope = scopeFactory.CreateAsyncScope();
                var provider = scope.ServiceProvider.GetRequiredService<IFacturacionProviderDTO>();
                var digifact = scope.ServiceProvider.GetRequiredService<IDigifactClient>();
                var nucFactory = scope.ServiceProvider.GetRequiredService<IDigifactNucFactory>();
                var notifications = scope.ServiceProvider.GetRequiredService<NotificationService>();
                var invoice = await provider.ObtenerAsync(job.InvoiceId) ?? throw new InvalidOperationException("No fue posible recuperar la factura preparada.");
                var nuc = nucFactory.CreateInvoice(invoice);
                var result = await digifact.CertifyAsync(nuc, stoppingToken);
                var certifiedAt = DateTime.TryParse(result.EnrolledTimeStamp, out var parsed) ? parsed : DateTime.Now;
                var number = string.IsNullOrWhiteSpace(result.Batch) || string.IsNullOrWhiteSpace(result.Serial) ? result.AuthNumber : $"{result.Batch}-{result.Serial}";
                await provider.RegistrarCertificacionAsync(job.InvoiceId, number, result.AuthNumber, certifiedAt, nucFactory.GetInternalReference(job.InvoiceId), result.ResponseData1);
                var pdfReady = false;
                try
                {
                    var document = await digifact.GetPdfAsync(result.AuthNumber, stoppingToken);
                    pdfCache.Store(job.InvoiceId, document);
                    pdfReady = true;
                }
                catch (Exception pdfError) { logger.LogWarning(pdfError, "La factura {InvoiceId} fue certificada, pero Digifact demoró la entrega del PDF", job.InvoiceId); }
                if (job.UserId > 0)
                {
                    var message = pdfReady ? $"La factura {number} fue certificada y su PDF está listo." : $"La factura {number} fue certificada; Digifact aún está preparando el PDF.";
                    try { await notifications.CreateForUserAsync(job.UserId, null, "factura_lista", "Factura FEL lista", message, $"/ventas/facturas?factura={job.InvoiceId}", "factura", job.InvoiceId); }
                    catch (Exception notificationError) { logger.LogWarning(notificationError, "La factura {InvoiceId} fue certificada, pero no se pudo crear su notificación", job.InvoiceId); }
                }
            }
            catch (Exception exception)
            {
                logger.LogError(exception, "No fue posible certificar la factura {InvoiceId} en segundo plano", job.InvoiceId);
                try
                {
                    await using var scope = scopeFactory.CreateAsyncScope();
                    var provider = scope.ServiceProvider.GetRequiredService<IFacturacionProviderDTO>();
                    var notifications = scope.ServiceProvider.GetRequiredService<NotificationService>();
                    await provider.MarcarErrorAsync(job.InvoiceId, exception.Message);
                    if (job.UserId > 0) await notifications.CreateForUserAsync(job.UserId, null, "factura_error", "Factura pendiente de revisión", $"La factura #{job.InvoiceId} no pudo certificarse: {exception.Message}", "/ventas/facturas", "factura", job.InvoiceId);
                }
                catch (Exception persistenceError) { logger.LogError(persistenceError, "No fue posible registrar el error FEL de la factura {InvoiceId}", job.InvoiceId); }
            }
        }
    }
}
