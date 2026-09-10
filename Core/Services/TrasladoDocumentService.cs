using Core.DTOs;
using QuestPDF.Fluent;
using QuestPDF.Helpers;
using QuestPDF.Infrastructure;

namespace Core.Services;

public static class TrasladoDocumentService
{
    private const string Accent = "#008BA8";
    private const string Navy = "#183B56";

    public static byte[] GeneratePdf(IReadOnlyCollection<TrasladoConsultaDTO> rows)
    {
        QuestPDF.Settings.License = LicenseType.Community;
        var head = rows.First();
        var logo = LoadLogo();
        var totalUnits = rows.Sum(item => item.Cantidad);

        return Document.Create(document => document.Page(page =>
        {
            page.Size(PageSizes.A4);
            page.Margin(26);
            page.DefaultTextStyle(style => style.FontSize(10).FontColor(Colors.Grey.Darken3));
            page.Content().Border(1.5f).BorderColor(Navy).Padding(22).Column(column =>
            {
                column.Spacing(16);
                column.Item().Row(row =>
                {
                    row.ConstantItem(105).Height(58).Element(box =>
                    {
                        if (logo is not null) box.Image(logo).FitArea();
                        else box.AlignMiddle().Text("AZE-SHER'S").Bold().FontSize(16).FontColor(Accent);
                    });
                    row.RelativeItem().PaddingLeft(18).Column(title =>
                    {
                        title.Item().Text("NOTA DE ENVÍO").Bold().FontSize(22).FontColor(Navy);
                        title.Item().Text("Traslado interno de inventario").FontSize(9).FontColor(Colors.Grey.Darken1);
                    });
                    row.ConstantItem(150).AlignRight().Column(number =>
                    {
                        number.Item().Text("DOCUMENTO").FontSize(8).FontColor(Colors.Grey.Darken1);
                        number.Item().Text(head.NumeroTraslado).Bold().FontSize(13).FontColor(Accent);
                        number.Item().Text(head.Estado).FontSize(9);
                    });
                });
                column.Item().Height(4).Background(Accent);
                column.Item().Border(1).BorderColor(Colors.Grey.Lighten2).Background("#F8FAFC").Padding(12).Row(row =>
                {
                    Info(row.RelativeItem(), "ORIGEN", head.SucursalOrigen);
                    Info(row.RelativeItem(), "DESTINO", head.SucursalDestino);
                    Info(row.RelativeItem().AlignRight(), "FECHA", $"{head.Fecha:dd/MM/yyyy HH:mm}");
                });
                column.Item().Row(row =>
                {
                    row.RelativeItem().Text(text => { text.Span("Responsable: ").Bold(); text.Span(head.Usuario ?? "—"); });
                    row.ConstantItem(140).AlignRight().Text(text => { text.Span("Unidades: ").Bold(); text.Span(totalUnits.ToString()); });
                });
                if (!string.IsNullOrWhiteSpace(head.Observaciones))
                    column.Item().BorderLeft(3).BorderColor(Accent).Background("#F0F9FB").Padding(10).Text(text => { text.Span("Observaciones: ").Bold(); text.Span(head.Observaciones); });
                column.Item().Table(table =>
                {
                    table.ColumnsDefinition(columns => { columns.ConstantColumn(95); columns.RelativeColumn(); columns.ConstantColumn(85); });
                    table.Header(header =>
                    {
                        foreach (var title in new[] { "Código", "Producto", "Cantidad" })
                            header.Cell().Background(Navy).Border(0.5f).BorderColor(Colors.White).Padding(8).Text(title).Bold().FontColor(Colors.White);
                    });
                    foreach (var item in rows)
                    {
                        Cell(table).Text(item.Codigo ?? item.IdProducto.ToString());
                        Cell(table).Text(item.Producto);
                        Cell(table).AlignRight().Text(item.Cantidad.ToString()).Bold();
                    }
                });
                column.Item().PaddingTop(38).Row(row =>
                {
                    Signature(row.RelativeItem(), "Entrega", head.Usuario);
                    row.ConstantItem(42);
                    Signature(row.RelativeItem(), "Recibe", null);
                });
            });
            page.Footer().PaddingTop(7).Row(row =>
            {
                row.RelativeItem().Text("Documento interno de control de inventario").FontSize(8).FontColor(Colors.Grey.Darken1);
                row.RelativeItem().AlignRight().Text(text => { text.Span("Página "); text.CurrentPageNumber(); text.Span(" de "); text.TotalPages(); });
            });
        })).GeneratePdf();
    }

    private static IContainer Cell(TableDescriptor table) => table.Cell().BorderBottom(1).BorderColor(Colors.Grey.Lighten2).Padding(8);
    private static void Info(IContainer container, string label, string value) => container.Column(info =>
    {
        info.Item().Text(label).Bold().FontSize(8).FontColor(Accent);
        info.Item().Text(value).Bold().FontSize(12);
    });
    private static void Signature(IContainer container, string label, string? name) => container.AlignCenter().Column(column =>
    {
        column.Item().BorderTop(1).BorderColor(Navy).PaddingTop(6).AlignCenter().Text(label).Bold();
        if (!string.IsNullOrWhiteSpace(name)) column.Item().AlignCenter().Text(name).FontSize(8).FontColor(Colors.Grey.Darken1);
    });
    private static byte[]? LoadLogo()
    {
        var path = Path.Combine(AppContext.BaseDirectory, "Assets", "logo.png");
        return File.Exists(path) ? File.ReadAllBytes(path) : null;
    }
}
