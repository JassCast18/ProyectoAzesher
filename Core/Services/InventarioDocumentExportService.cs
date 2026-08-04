using System.Globalization;
using System.IO.Compression;
using System.Security;
using System.Text;
using Core.DTOs;
using QuestPDF.Fluent;
using QuestPDF.Helpers;
using QuestPDF.Infrastructure;

namespace Core.Services;

public static class InventarioDocumentExportService
{
    public static byte[] GeneratePdf(IReadOnlyCollection<InventarioProductoDTO> products, string branch, DateTime generatedAt)
    {
        QuestPDF.Settings.License = LicenseType.Community;
        return Document.Create(document => document.Page(page =>
        {
            page.Size(PageSizes.A4.Landscape());
            page.Margin(26);
            page.DefaultTextStyle(style => style.FontSize(9).FontColor(Colors.Grey.Darken3));
            page.Header().BorderBottom(2).BorderColor("#0f766e").PaddingBottom(12).Row(row =>
            {
                row.RelativeItem().Column(column =>
                {
                    column.Item().Text("REPORTE DE INVENTARIO").Bold().FontSize(20).FontColor("#0f766e");
                    column.Item().Text($"Sucursal: {branch}").FontSize(11);
                });
                row.ConstantItem(220).AlignRight().Column(column =>
                {
                    column.Item().AlignRight().Text("Corte de inventario").Bold();
                    column.Item().AlignRight().Text(generatedAt.ToString("dd/MM/yyyy HH:mm:ss"));
                });
            });
            page.Content().PaddingTop(14).Column(column =>
            {
                column.Spacing(12);
                column.Item().Row(row =>
                {
                    Summary(row, "Productos", products.Count.ToString());
                    Summary(row, "Unidades", products.Sum(product => product.Stock).ToString());
                    Summary(row, "Existencia baja", products.Count(product => product.Stock is > 0 and <= 5).ToString());
                    Summary(row, "Sin existencias", products.Count(product => product.Stock <= 0).ToString());
                });
                column.Item().Table(table =>
                {
                    table.ColumnsDefinition(columns =>
                    {
                        columns.ConstantColumn(55); columns.RelativeColumn(3); columns.RelativeColumn(4);
                        columns.ConstantColumn(70); columns.ConstantColumn(85); columns.ConstantColumn(95); columns.ConstantColumn(100);
                    });
                    table.Header(header =>
                    {
                        foreach (var title in new[] { "Código", "Producto", "Descripción", "Stock", "Precio", "Valor", "Estado" })
                            header.Cell().Background("#e2e8f0").Padding(6).Text(title).Bold();
                    });
                    foreach (var product in products)
                    {
                        Cell(table, product.IdProducto.ToString()); Cell(table, product.Nombre); Cell(table, product.Descripcion ?? "—");
                        Cell(table, product.Stock.ToString()); Cell(table, $"Q {product.Precio:0.00}");
                        Cell(table, $"Q {product.Stock * product.Precio:0.00}"); Cell(table, product.EstadoStock);
                    }
                });
            });
            page.Footer().AlignCenter().Text(text =>
            {
                text.Span("Página "); text.CurrentPageNumber(); text.Span(" de "); text.TotalPages();
            });
        })).GeneratePdf();
    }

    public static byte[] GenerateXlsx(IReadOnlyCollection<InventarioProductoDTO> products, string branch, DateTime generatedAt)
    {
        var rows = new StringBuilder();
        var row = 1;
        AddRow(rows, row++, "Reporte de inventario", branch, "Corte", generatedAt.ToString("dd/MM/yyyy HH:mm:ss"), "", "", "");
        AddRow(rows, row++, "Código", "Producto", "Descripción", "Stock", "Precio", "Valor en inventario", "Estado");
        foreach (var product in products)
            AddRow(rows, row++, product.IdProducto, product.Nombre, product.Descripcion ?? "", product.Stock, product.Precio, product.Stock * product.Precio, product.EstadoStock);

        var sheet = $"<?xml version=\"1.0\" encoding=\"UTF-8\"?><worksheet xmlns=\"http://schemas.openxmlformats.org/spreadsheetml/2006/main\"><sheetData>{rows}</sheetData></worksheet>";
        using var stream = new MemoryStream();
        using (var archive = new ZipArchive(stream, ZipArchiveMode.Create, true))
        {
            Write(archive, "[Content_Types].xml", "<?xml version=\"1.0\" encoding=\"UTF-8\"?><Types xmlns=\"http://schemas.openxmlformats.org/package/2006/content-types\"><Default Extension=\"rels\" ContentType=\"application/vnd.openxmlformats-package.relationships+xml\"/><Default Extension=\"xml\" ContentType=\"application/xml\"/><Override PartName=\"/xl/workbook.xml\" ContentType=\"application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml\"/><Override PartName=\"/xl/worksheets/sheet1.xml\" ContentType=\"application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml\"/></Types>");
            Write(archive, "_rels/.rels", "<?xml version=\"1.0\" encoding=\"UTF-8\"?><Relationships xmlns=\"http://schemas.openxmlformats.org/package/2006/relationships\"><Relationship Id=\"rId1\" Type=\"http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument\" Target=\"xl/workbook.xml\"/></Relationships>");
            Write(archive, "xl/workbook.xml", "<?xml version=\"1.0\" encoding=\"UTF-8\"?><workbook xmlns=\"http://schemas.openxmlformats.org/spreadsheetml/2006/main\" xmlns:r=\"http://schemas.openxmlformats.org/officeDocument/2006/relationships\"><sheets><sheet name=\"Inventario\" sheetId=\"1\" r:id=\"rId1\"/></sheets></workbook>");
            Write(archive, "xl/_rels/workbook.xml.rels", "<?xml version=\"1.0\" encoding=\"UTF-8\"?><Relationships xmlns=\"http://schemas.openxmlformats.org/package/2006/relationships\"><Relationship Id=\"rId1\" Type=\"http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet\" Target=\"worksheets/sheet1.xml\"/></Relationships>");
            Write(archive, "xl/worksheets/sheet1.xml", sheet);
        }
        return stream.ToArray();
    }

    private static void Summary(RowDescriptor row, string label, string value) => row.RelativeItem().PaddingRight(8).Border(1).BorderColor(Colors.Grey.Lighten2).Padding(9).Column(c => { c.Item().Text(label).FontColor(Colors.Grey.Darken1); c.Item().Text(value).Bold().FontSize(15); });
    private static void Cell(TableDescriptor table, string value) => table.Cell().BorderBottom(1).BorderColor(Colors.Grey.Lighten3).Padding(6).Text(value);
    private static void AddRow(StringBuilder rows, int row, params object[] values) { rows.Append($"<row r=\"{row}\">"); for (var i = 0; i < values.Length; i++) rows.Append(CellName(i, row, values[i])); rows.Append("</row>"); }
    private static string CellName(int index, int row, object value) { var column = ((char)('A' + index)).ToString(); if (value is decimal or int or long or double) return $"<c r=\"{column}{row}\"><v>{Convert.ToString(value, CultureInfo.InvariantCulture)}</v></c>"; return $"<c r=\"{column}{row}\" t=\"inlineStr\"><is><t>{SecurityElement.Escape(Convert.ToString(value) ?? "")}</t></is></c>"; }
    private static void Write(ZipArchive archive, string path, string content) { var entry = archive.CreateEntry(path, CompressionLevel.Fastest); using var writer = new StreamWriter(entry.Open(), new UTF8Encoding(false)); writer.Write(content); }
}
