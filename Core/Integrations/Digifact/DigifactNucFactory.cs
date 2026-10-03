using System.Globalization;
using System.Security.Cryptography;
using System.Text;
using System.Text.Json;
using Core.DTOs;
using Microsoft.Extensions.Options;

namespace Core.Integrations.Digifact;

public sealed class DigifactNucFactory(IOptions<DigifactOptions> configuredOptions) : IDigifactNucFactory
{
    private readonly DigifactOptions options = configuredOptions.Value;
    private static readonly CultureInfo Invariant = CultureInfo.InvariantCulture;

    public JsonElement CreateInvoice(FacturaDetalleDTO invoice)
    {
        if (invoice.Detalles.Count == 0) throw new InvalidOperationException("La factura no contiene productos para certificar.");
        if (string.IsNullOrWhiteSpace(options.SellerName)) throw new InvalidOperationException("Falta Digifact:SellerName.");
        var branch = ResolveBranch(invoice.SucursalNombre);
        var items = invoice.Detalles.Select((line, index) => CreateItem(line, index + 1, invoice.TipoOrigen)).ToArray();
        var taxTotal = items.Sum(item => item.TaxAmount);
        var reference = GetInternalReference(invoice.IdFactura);
        var receiverNit = DigifactClient.NormalizeReceiverNit(invoice.NitReceptor);

        var nuc = new
        {
            Version = "1.00",
            CountryCode = "GT",
            Header = new
            {
                DocType = "FACT",
                IssuedDateTime = DateTimeOffset.Now.ToString("yyyy-MM-dd'T'HH:mm:sszzz"),
                Currency = "GTQ"
            },
            Seller = new
            {
                TaxID = DigifactOptions.NormalizeTaxId(options.TaxId),
                TaxIDAdditionalInfo = new[] { new { Name = "AfiliacionIVA", Data = (string?)null, Value = options.VatAffiliation } },
                Name = options.SellerName,
                Contact = string.IsNullOrWhiteSpace(options.Email) ? null : new { EmailList = new { Email = new[] { options.Email } } },
                AdditionlInfo = new[]
                {
                    new { Name = "TipoFrase", Data = "1", Value = options.PhraseType },
                    new { Name = "Escenario", Data = "1", Value = options.PhraseScenario }
                },
                BranchInfo = new
                {
                    Code = branch.Code,
                    Name = branch.Name,
                    AddressInfo = new { Address = branch.Address, City = branch.City, District = branch.District, State = branch.State, Country = "GT" }
                }
            },
            Buyer = new
            {
                TaxID = receiverNit,
                Name = receiverNit == "CF" ? "CONSUMIDOR FINAL" : invoice.NombreReceptor.Trim(),
                AddressInfo = new
                {
                    Address = string.IsNullOrWhiteSpace(invoice.DireccionReceptor) ? "CIUDAD" : invoice.DireccionReceptor.Trim(),
                    City = branch.City,
                    District = branch.District,
                    State = branch.State,
                    Country = "GT"
                }
            },
            ThirdParties = (object?)null,
            Items = items.Select(item => item.Value).ToArray(),
            Totals = new
            {
                TotalTaxes = new { TotalTax = new[] { new { Description = "IVA", Amount = Format(taxTotal) } } },
                GrandTotal = new { InvoiceTotal = Format(invoice.Total) }
            },
            AdditionalDocumentInfo = new
            {
                AdditionalInfo = new[]
                {
                    new
                    {
                        Code = reference,
                        Type = "ADENDA",
                        AditionalData = new
                        {
                            Data = new[]
                            {
                                new
                                {
                                    Info = new[]
                                    {
                                        new { Name = "OBSERVACIONES", Data = (string?)null, Value = invoice.TipoOrigen == "Abono" ? "Factura correspondiente a pago de cuenta por cobrar" : $"Recibo relacionado: {invoice.NumeroRecibo}" }
                                    },
                                    Name = "INFORMACION_ADICIONAL"
                                }
                            }
                        },
                        AditionalInfo = new[] { new { Name = "VALIDAR_REFERENCIA_INTERNA", Data = (string?)null, Value = "VALIDAR" } }
                    }
                }
            }
        };
        return JsonSerializer.SerializeToElement(nuc);
    }

    public string GetInternalReference(int invoiceId)
    {
        var hash = MD5.HashData(Encoding.UTF8.GetBytes($"AZESHER-FEL-{invoiceId}"));
        return new Guid(hash).ToString().ToUpperInvariant();
    }

    private DigifactBranchOptions ResolveBranch(string branchName)
    {
        var branch = options.Branches.FirstOrDefault(item =>
            branchName.Contains(item.MatchName, StringComparison.OrdinalIgnoreCase));
        if (branch is not null) return branch;
        if (options.Branches.Count > 0)
            throw new InvalidOperationException($"La sucursal '{branchName}' no tiene configuración fiscal en Digifact:Branches.");
        return new DigifactBranchOptions
        {
            Code = options.BranchCode, Name = options.BranchName, Address = options.BranchAddress,
            City = options.BranchCity, District = options.BranchDistrict, State = options.BranchState
        };
    }

    private static NucItem CreateItem(FacturaLineaDTO line, int number, string origin)
    {
        var gross = decimal.Round(line.Subtotal, 6, MidpointRounding.AwayFromZero);
        var taxable = decimal.Round(gross / 1.12m, 6, MidpointRounding.AwayFromZero);
        var tax = gross - taxable;
        var quantity = Math.Max(1, line.Cantidad);
        var value = new
        {
            Number = number.ToString(Invariant),
            Codes = (object?)null,
            Type = origin == "Abono" ? "Servicio" : "Bien",
            Description = line.ProductoNombre,
            Qty = Format(quantity),
            UnitOfMeasure = origin == "Abono" ? "SER" : "UNI",
            Price = Format(line.PrecioUnitario),
            Discounts = (object?)null,
            Taxes = new { Tax = new[] { new { Code = "1", Description = "IVA", TaxableAmount = Format(taxable), Amount = Format(tax) } } },
            Totals = new { TotalItem = Format(gross) }
        };
        return new(value, tax);
    }

    private static string Format(decimal value) => value.ToString("0.000000", Invariant);
    private sealed record NucItem(object Value, decimal TaxAmount);
}
