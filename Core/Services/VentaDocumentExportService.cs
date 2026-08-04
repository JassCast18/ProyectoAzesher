using System.Globalization;
using System.IO.Compression;
using System.Security;
using System.Text;
using Core.DTOs;

namespace Core.Services;

public static class VentaDocumentExportService
{
    public static byte[] GenerateDocx(ReciboVentaDTO receipt)
    {
        var isCredit = receipt.MetodoPago.Equals("credito", StringComparison.OrdinalIgnoreCase);
        var paid = isCredit ? receipt.MontoInicial ?? 0 : receipt.Monto;
        var title = isCredit ? "NOTA DE CRÉDITO" : "RECIBO DE PAGO";
        var body = new StringBuilder();
        AddParagraph(body, title, true, 32);
        AddParagraph(body, $"Documento: {receipt.NumeroRecibo}");
        AddParagraph(body, $"Factura: {receipt.NumeroFactura}");
        AddParagraph(body, $"Cliente: {receipt.ClienteNombre} - NIT: {receipt.ClienteNit ?? "CF"}");
        AddParagraph(body, $"Sucursal: {receipt.SucursalNombre ?? "Sin sucursal"}");
        AddParagraph(body, $"Vendedor: {receipt.VendedorNombre}");
        AddParagraph(body, $"Método de pago: {receipt.MetodoPago}");
        if (!string.IsNullOrWhiteSpace(receipt.NumeroComprobante)) AddParagraph(body, $"Referencia: {receipt.NumeroComprobante}");
        AddParagraph(body, "");
        AddParagraph(body, "DETALLE", true, 24);
        foreach (var item in receipt.Detalles)
            AddParagraph(body, $"{item.ProductoNombre} | {item.Cantidad} x Q {item.PrecioUnitario:0.00} | Q {item.Subtotal:0.00}");
        AddParagraph(body, "");
        AddParagraph(body, $"Monto recibido: Q {paid:0.00}", true, 26);
        if (isCredit)
        {
            AddParagraph(body, $"Restante: Q {receipt.SaldoPendiente ?? 0:0.00}", true, 26);
            AddParagraph(body, $"Cuotas: {receipt.NumeroCuotas}");
            if (receipt.PrimeraCuotaFecha.HasValue)
                AddParagraph(body, $"Primera cuota: Q {receipt.PrimeraCuotaMonto ?? 0:0.00} - {receipt.PrimeraCuotaFecha:dd/MM/yyyy}");
        }

        var documentXml = $"<?xml version=\"1.0\" encoding=\"UTF-8\" standalone=\"yes\"?><w:document xmlns:w=\"http://schemas.openxmlformats.org/wordprocessingml/2006/main\"><w:body>{body}<w:sectPr><w:pgSz w:w=\"11906\" w:h=\"16838\"/><w:pgMar w:top=\"900\" w:right=\"900\" w:bottom=\"900\" w:left=\"900\"/></w:sectPr></w:body></w:document>";

        using var stream = new MemoryStream();
        using (var archive = new ZipArchive(stream, ZipArchiveMode.Create, true))
        {
            WriteEntry(archive, "[Content_Types].xml", "<?xml version=\"1.0\" encoding=\"UTF-8\"?><Types xmlns=\"http://schemas.openxmlformats.org/package/2006/content-types\"><Default Extension=\"rels\" ContentType=\"application/vnd.openxmlformats-package.relationships+xml\"/><Default Extension=\"xml\" ContentType=\"application/xml\"/><Override PartName=\"/word/document.xml\" ContentType=\"application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml\"/></Types>");
            WriteEntry(archive, "_rels/.rels", "<?xml version=\"1.0\" encoding=\"UTF-8\"?><Relationships xmlns=\"http://schemas.openxmlformats.org/package/2006/relationships\"><Relationship Id=\"rId1\" Type=\"http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument\" Target=\"word/document.xml\"/></Relationships>");
            WriteEntry(archive, "word/document.xml", documentXml);
        }
        return stream.ToArray();
    }

    public static byte[] GenerateXlsx(ReciboVentaDTO receipt)
    {
        var rows = new StringBuilder();
        var rowNumber = 1;
        AddExcelRow(rows, rowNumber++, "Producto", "Cantidad", "Precio unitario", "Subtotal");
        foreach (var item in receipt.Detalles)
            AddExcelRow(rows, rowNumber++, item.ProductoNombre, item.Cantidad, item.PrecioUnitario, item.Subtotal);
        AddExcelRow(rows, rowNumber++, "Total venta", "", "", receipt.Monto);
        if (receipt.MetodoPago.Equals("credito", StringComparison.OrdinalIgnoreCase))
        {
            AddExcelRow(rows, rowNumber++, "Pago inicial", "", "", receipt.MontoInicial ?? 0);
            AddExcelRow(rows, rowNumber, "Saldo pendiente", "", "", receipt.SaldoPendiente ?? 0);
        }

        var sheet = $"<?xml version=\"1.0\" encoding=\"UTF-8\"?><worksheet xmlns=\"http://schemas.openxmlformats.org/spreadsheetml/2006/main\"><sheetData>{rows}</sheetData></worksheet>";
        using var stream = new MemoryStream();
        using (var archive = new ZipArchive(stream, ZipArchiveMode.Create, true))
        {
            WriteEntry(archive, "[Content_Types].xml", "<?xml version=\"1.0\" encoding=\"UTF-8\"?><Types xmlns=\"http://schemas.openxmlformats.org/package/2006/content-types\"><Default Extension=\"rels\" ContentType=\"application/vnd.openxmlformats-package.relationships+xml\"/><Default Extension=\"xml\" ContentType=\"application/xml\"/><Override PartName=\"/xl/workbook.xml\" ContentType=\"application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml\"/><Override PartName=\"/xl/worksheets/sheet1.xml\" ContentType=\"application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml\"/></Types>");
            WriteEntry(archive, "_rels/.rels", "<?xml version=\"1.0\" encoding=\"UTF-8\"?><Relationships xmlns=\"http://schemas.openxmlformats.org/package/2006/relationships\"><Relationship Id=\"rId1\" Type=\"http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument\" Target=\"xl/workbook.xml\"/></Relationships>");
            WriteEntry(archive, "xl/workbook.xml", "<?xml version=\"1.0\" encoding=\"UTF-8\"?><workbook xmlns=\"http://schemas.openxmlformats.org/spreadsheetml/2006/main\" xmlns:r=\"http://schemas.openxmlformats.org/officeDocument/2006/relationships\"><sheets><sheet name=\"Detalle de venta\" sheetId=\"1\" r:id=\"rId1\"/></sheets></workbook>");
            WriteEntry(archive, "xl/_rels/workbook.xml.rels", "<?xml version=\"1.0\" encoding=\"UTF-8\"?><Relationships xmlns=\"http://schemas.openxmlformats.org/package/2006/relationships\"><Relationship Id=\"rId1\" Type=\"http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet\" Target=\"worksheets/sheet1.xml\"/></Relationships>");
            WriteEntry(archive, "xl/worksheets/sheet1.xml", sheet);
        }
        return stream.ToArray();
    }

    private static void AddParagraph(StringBuilder body, string text, bool bold = false, int size = 22)
    {
        var properties = bold ? $"<w:rPr><w:b/><w:sz w:val=\"{size}\"/></w:rPr>" : $"<w:rPr><w:sz w:val=\"{size}\"/></w:rPr>";
        body.Append($"<w:p><w:r>{properties}<w:t xml:space=\"preserve\">{Escape(text)}</w:t></w:r></w:p>");
    }

    private static void AddExcelRow(StringBuilder rows, int row, object a, object b, object c, object d) =>
        rows.Append($"<row r=\"{row}\">{Cell("A", row, a)}{Cell("B", row, b)}{Cell("C", row, c)}{Cell("D", row, d)}</row>");

    private static string Cell(string column, int row, object value)
    {
        if (value is decimal or int or long or double)
            return $"<c r=\"{column}{row}\"><v>{Convert.ToString(value, CultureInfo.InvariantCulture)}</v></c>";
        return $"<c r=\"{column}{row}\" t=\"inlineStr\"><is><t>{Escape(Convert.ToString(value) ?? string.Empty)}</t></is></c>";
    }

    private static string Escape(string value) => SecurityElement.Escape(value) ?? string.Empty;

    private static void WriteEntry(ZipArchive archive, string path, string content)
    {
        var entry = archive.CreateEntry(path, CompressionLevel.Fastest);
        using var writer = new StreamWriter(entry.Open(), new UTF8Encoding(false));
        writer.Write(content);
    }
}
