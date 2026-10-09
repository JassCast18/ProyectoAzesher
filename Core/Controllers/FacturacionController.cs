using Core.DTOs;
using Core.DTOs.Interfaces;
using Core.Integrations.Digifact;
using Core.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;
using Core.Services;
using QuestPDF.Fluent;
using QuestPDF.Helpers;
using QuestPDF.Infrastructure;

namespace Core.Controllers;

[Authorize, ApiController, Route("api/facturacion")]
public class FacturacionController(IFacturacionProviderDTO provider, IDigifactClient digifact, IDigifactNucFactory nucFactory, NotificationService notifications, ILogger<FacturacionController> logger, InvoiceCertificationQueue certificationQueue, InvoicePdfCache pdfCache) : ControllerBase
{
    [HttpGet("digifact/estado")]
    public IActionResult DigifactStatus() => Ok(Result("Estado de integración.", digifact.GetStatus()));

    [HttpPost("digifact/probar")]
    public async Task<IActionResult> TestDigifact()
    {
        try { return Ok(Result("Conexión realizada.", await digifact.TestConnectionAsync(HttpContext.RequestAborted))); }
        catch (DigifactException exception) { return ProviderError(exception); }
    }

    [HttpPost("validar-nit")]
    public async Task<IActionResult> ValidateNit(ValidarNitDTO request)
    {
        try
        {
            var validation = await digifact.ValidateNitAsync(request.Nit, HttpContext.RequestAborted);
            return validation.IsValid
                ? Ok(Result(validation.Message, validation))
                : BadRequest(new ApiResponse<object> { Success = false, Message = validation.Message, Data = validation });
        }
        catch (DigifactException exception) { return ProviderError(exception); }
    }

    [HttpGet("recibos")]
    public async Task<IActionResult> Receipts(int idSucursal, string? query = null) =>
        Ok(Result("Recibos facturables.", await provider.BuscarRecibosAsync(Branch(idSucursal), query ?? "")));

    [HttpPost]
    public async Task<IActionResult> Create(AutorizarFacturaDTO request)
    {
        if (string.IsNullOrWhiteSpace(request.Nombre)) return BadRequest(Failure("El nombre del receptor es obligatorio."));
        request.IdSucursal = Branch(request.IdSucursal);
        try
        {
            var validation = await digifact.ValidateNitAsync(request.Nit, HttpContext.RequestAborted);
            if (!validation.IsValid) return BadRequest(Failure(validation.Message));
            request.Nit = validation.Nit;
            if (!validation.IsConsumerFinal) request.Nombre = validation.Name;
            var id = await provider.AutorizarAsync(request);
            var userId = int.TryParse(User.FindFirstValue(ClaimTypes.NameIdentifier), out var parsedUser) ? parsedUser : 0;
            certificationQueue.Queue(id, userId);
            return Accepted(Result("La factura se generará en segundo plano. Te notificaremos cuando esté lista.", new { IdFactura = id, Estado = "Pendiente" }));
        }
        catch (DigifactException exception) { return ProviderError(exception); }
        catch (Exception exception) { return BadRequest(Failure(exception.Message)); }
    }

    [HttpPost("abonos")]
    public async Task<IActionResult> InvoicePayment(FacturarAbonoDTO request)
    {
        if (string.IsNullOrWhiteSpace(request.Nombre)) return BadRequest(Failure("El nombre del receptor es obligatorio."));
        request.IdSucursal = Branch(request.IdSucursal);
        try
        {
            var validation = await digifact.ValidateNitAsync(request.Nit, HttpContext.RequestAborted);
            if (!validation.IsValid) return BadRequest(Failure(validation.Message));
            request.Nit = validation.Nit;
            if (!validation.IsConsumerFinal) request.Nombre = validation.Name;
            var id = await provider.FacturarAbonoAsync(request);
            var userId = int.TryParse(User.FindFirstValue(ClaimTypes.NameIdentifier), out var parsedUser) ? parsedUser : 0;
            certificationQueue.Queue(id, userId);
            return Accepted(Result("La factura del abono se generará en segundo plano. Te notificaremos cuando esté lista.", new { IdFactura = id, Estado = "Pendiente" }));
        }
        catch (DigifactException exception) { return ProviderError(exception); }
        catch (Exception exception) { return BadRequest(Failure(exception.Message)); }
    }

    [HttpGet]
    public async Task<IActionResult> Search(int idSucursal, string? query = null, DateTime? fechaDesde = null, DateTime? fechaHasta = null) =>
        Ok(Result("Facturas obtenidas.", await provider.BuscarAsync(Branch(idSucursal), query ?? "", fechaDesde, fechaHasta)));

    [HttpPost("{id:int}/anular")]
    public async Task<IActionResult> Cancel(int id, AnularFacturaDTO request)
    {
        if (string.IsNullOrWhiteSpace(request.Motivo)) return BadRequest(Failure("El motivo de anulación es obligatorio."));
        var invoice = await provider.ObtenerAsync(id);
        if (invoice is null) return NotFound(Failure("La factura no existe."));
        if (invoice.Estado == "Anulada") return BadRequest(Failure("La factura ya está anulada."));
        if (string.IsNullOrWhiteSpace(invoice.NumeroAutorizacion) || invoice.NumeroAutorizacion.StartsWith("SIM-", StringComparison.OrdinalIgnoreCase))
            return BadRequest(Failure("La factura no posee una autorización FEL válida."));
        try
        {
            await digifact.CancelAsync(invoice.NumeroAutorizacion, invoice.NitReceptor, invoice.FechaEmision, request.Motivo, HttpContext.RequestAborted);
            await provider.MarcarAnuladaAsync(id, request.Motivo.Trim());
            return Ok(Result("Factura anulada correctamente en Digifact y en el sistema.", new { IdFactura = id }));
        }
        catch (DigifactException exception) { return ProviderError(exception); }
        catch (Exception exception) { return BadRequest(Failure(exception.Message)); }
    }

    [HttpGet("{id:int}/pdf")]
    public async Task<IActionResult> Pdf(int id)
    {
        var invoice = await provider.ObtenerAsync(id);
        if (invoice is null) return NotFound();

        if (pdfCache.TryGet(id, out var cached) && cached is not null)
            return File(cached.Content, cached.ContentType, cached.FileName);

        if (!string.IsNullOrWhiteSpace(invoice.NumeroAutorizacion) &&
            !invoice.NumeroAutorizacion.StartsWith("SIM-", StringComparison.OrdinalIgnoreCase))
        {
            try
            {
                var official = await digifact.GetPdfAsync(invoice.NumeroAutorizacion, HttpContext.RequestAborted);
                return File(official.Content, official.ContentType, official.FileName);
            }
            catch (DigifactException exception) { return ProviderError(exception); }
        }

        QuestPDF.Settings.License = LicenseType.Community;
        var bytes = Document.Create(document => document.Page(page =>
        {
            page.Size(PageSizes.A4);
            page.Margin(30);
            page.Header().Column(column =>
            {
                column.Item().Text("FACTURA ELECTRÓNICA (BORRADOR)").Bold().FontSize(20).FontColor("#0f766e");
                column.Item().Text($"{invoice.NumeroFactura} · {invoice.SucursalNombre}");
            });
            page.Content().PaddingTop(20).Column(column =>
            {
                column.Spacing(12);
                column.Item().Border(1).Padding(12).Text($"Receptor: {invoice.NombreReceptor}\nNIT: {invoice.NitReceptor}\nDirección: {invoice.DireccionReceptor ?? "—"}\nAutorización: {invoice.NumeroAutorizacion}\nFecha: {invoice.FechaCertificacion:dd/MM/yyyy HH:mm}");
                foreach (var line in invoice.Detalles)
                    column.Item().Row(row =>
                    {
                        row.RelativeItem().Text(line.ProductoNombre);
                        row.ConstantItem(50).Text(line.Cantidad.ToString());
                        row.ConstantItem(90).AlignRight().Text($"Q {line.Subtotal:0.00}");
                    });
                column.Item().BorderTop(1).PaddingTop(10).AlignRight().Text($"TOTAL Q {invoice.Total:0.00}").Bold().FontSize(16);
                column.Item().Text($"Recibo relacionado: {invoice.NumeroRecibo}").FontColor(Colors.Grey.Darken1);
            });
            page.Footer().AlignCenter().Text("BORRADOR SIN VALIDEZ FISCAL · Pendiente de certificación Digifact.");
        })).GeneratePdf();
        return File(bytes, "application/pdf", $"BORRADOR-{invoice.NumeroFactura}.pdf");
    }

    private int Branch(int requested)
    {
        var claim = User.FindFirst("id_sucursal")?.Value ?? User.FindFirst("IdSucursal")?.Value;
        return int.TryParse(claim, out var assigned) && assigned > 0 ? assigned : requested;
    }

    private async Task<IActionResult> Certify(int id, string successMessage)
    {
        try
        {
            var invoice = await provider.ObtenerAsync(id) ?? throw new InvalidOperationException("No fue posible recuperar la factura preparada.");
            var nuc = nucFactory.CreateInvoice(invoice);
            var result = await digifact.CertifyAsync(nuc, HttpContext.RequestAborted);
            var certifiedAt = DateTime.TryParse(result.EnrolledTimeStamp, out var parsed) ? parsed : DateTime.Now;
            var number = string.IsNullOrWhiteSpace(result.Batch) || string.IsNullOrWhiteSpace(result.Serial)
                ? result.AuthNumber
                : $"{result.Batch}-{result.Serial}";
            await provider.RegistrarCertificacionAsync(id, number, result.AuthNumber, certifiedAt,
                nucFactory.GetInternalReference(id), result.ResponseData1);
            return Ok(Result(successMessage, new { IdFactura = id, Numero = number, UUID = result.AuthNumber }));
        }
        catch (Exception exception)
        {
            try { await provider.MarcarErrorAsync(id, exception.Message); } catch { }
            try
            {
                var userId = int.TryParse(User.FindFirstValue(ClaimTypes.NameIdentifier), out var parsedUser) ? parsedUser : 0;
                if (userId > 0) await notifications.CreateForUserAsync(userId, null, "factura_error", "Factura pendiente de revisión",
                    $"La factura #{id} no pudo certificarse: {exception.Message}", "/ventas/facturas", "factura", id);
            }
            catch (Exception notificationError) { logger.LogError(notificationError, "No fue posible notificar el error FEL de la factura {InvoiceId}", id); }
            return exception is DigifactException digifactException
                ? ProviderError(digifactException)
                : BadRequest(Failure(exception.Message));
        }
    }

    private ObjectResult ProviderError(DigifactException exception) =>
        StatusCode(exception.StatusCode is >= 400 and < 600 ? exception.StatusCode.Value : 502, Failure(exception.Message));
    private static ApiResponse<object> Failure(string message) => new() { Success = false, Message = message };
    private static ApiResponse<object> Result(string message, object data) => new() { Success = true, Message = message, Data = data };
}
