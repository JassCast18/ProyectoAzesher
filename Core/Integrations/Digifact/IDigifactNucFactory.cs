using System.Text.Json;
using Core.DTOs;

namespace Core.Integrations.Digifact;

public interface IDigifactNucFactory
{
    JsonElement CreateInvoice(FacturaDetalleDTO invoice);
    string GetInternalReference(int invoiceId);
}
