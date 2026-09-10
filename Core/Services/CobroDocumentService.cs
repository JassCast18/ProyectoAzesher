using System.Globalization;
using System.IO.Compression;
using System.Security;
using System.Text;
using Core.DTOs;
using QuestPDF.Fluent;
using QuestPDF.Helpers;
using QuestPDF.Infrastructure;
namespace Core.Services;
public static class CobroDocumentService
{
    public static byte[] AbonoPdf(AbonoReciboDTO item)
    {
        QuestPDF.Settings.License=LicenseType.Community;
        var logoPath=Path.Combine(AppContext.BaseDirectory,"Assets","logo.png");
        var logo=File.Exists(logoPath)?File.ReadAllBytes(logoPath):null;
        return Document.Create(document=>document.Page(page=>
        {
            page.Size(PageSizes.A4);page.Margin(30);page.DefaultTextStyle(style=>style.FontSize(10).FontColor(Colors.Grey.Darken3));
            page.Content().Border(1.5f).BorderColor("#183B56").Padding(22).Column(column=>
            {
                column.Spacing(15);column.Item().Row(row=>{row.ConstantItem(105).Height(55).Element(box=>{if(logo!=null)box.Image(logo).FitArea();else box.Text("AZE-SHER'S").Bold();});row.RelativeItem().PaddingLeft(18).Column(title=>{title.Item().Text("RECIBO DE ABONO").Bold().FontSize(21).FontColor("#183B56");title.Item().Text("Comprobante de pago de cuenta por cobrar").FontColor(Colors.Grey.Darken1);});row.ConstantItem(140).AlignRight().Column(number=>{number.Item().Text(item.NumeroAbono).Bold().FontSize(13).FontColor("#008BA8");number.Item().Text($"{item.Fecha:dd/MM/yyyy HH:mm}");});});
                column.Item().Height(4).Background("#008BA8");
                column.Item().Border(1).BorderColor(Colors.Grey.Lighten2).Background("#F8FAFC").Padding(14).Column(info=>{info.Item().Text(item.Cliente).Bold().FontSize(14);info.Item().Text($"NIT: {item.Nit??"CF"}");info.Item().Text($"Sucursal: {item.Sucursal}");info.Item().Text($"Nota de crédito relacionada: {item.NotaCredito}").Bold();});
                column.Item().Row(row=>{Amount(row.RelativeItem(),"Abono recibido",item.Monto,"#008BA8");row.ConstantItem(12);Amount(row.RelativeItem(),"Pagado a la fecha",item.PagadoAcumulado,"#183B56");row.ConstantItem(12);Amount(row.RelativeItem(),"Saldo pendiente",item.SaldoPosterior,"#B45309");});
                column.Item().Border(1).BorderColor(Colors.Grey.Lighten2).Padding(12).Column(info=>{info.Item().Text($"Forma de pago: {item.MetodoPago}").Bold();if(!string.IsNullOrWhiteSpace(item.Referencia))info.Item().Text($"Referencia: {item.Referencia}");info.Item().Text($"Saldo anterior: Q {item.SaldoAnterior:0.00}");info.Item().Text($"Total original del crédito: Q {item.TotalCredito:0.00}");});
                column.Item().PaddingTop(35).AlignCenter().Width(250).BorderTop(1).BorderColor("#183B56").PaddingTop(7).Text("Recibido por: "+(item.Usuario??"—")).AlignCenter();
            });
            page.Footer().PaddingTop(7).AlignCenter().Text("Conserve este comprobante para el control de sus pagos.").FontSize(8).FontColor(Colors.Grey.Darken1);
        })).GeneratePdf();
    }
    private static void Amount(IContainer box,string label,decimal amount,string color)=>box.Border(1).BorderColor(Colors.Grey.Lighten2).Padding(12).Column(c=>{c.Item().Text(label).FontSize(9).FontColor(Colors.Grey.Darken1);c.Item().Text($"Q {amount:0.00}").Bold().FontSize(16).FontColor(color);});

    public static byte[] EstadoCuentaXlsx(EstadoCuentaDTO state)
    {
        var rows=new StringBuilder();var number=1;var summary=state.Resumen;
        AddRow(rows,number++,"ESTADO DE CUENTA","","","","");
        AddRow(rows,number++,"Cliente",summary?.Cliente??"","NIT",summary?.Nit??"CF","Saldo pendiente",summary?.SaldoPendiente??0);
        AddRow(rows,number++,"Fecha","Tipo","Documento","Cargo","Abono","Estado");
        foreach(var item in state.Movimientos)AddRow(rows,number++,item.Fecha,item.Tipo,item.Documento,item.Debito,item.Credito,item.Estado);
        var sheet=$"<?xml version=\"1.0\" encoding=\"UTF-8\"?><worksheet xmlns=\"http://schemas.openxmlformats.org/spreadsheetml/2006/main\"><sheetData>{rows}</sheetData></worksheet>";
        using var stream=new MemoryStream();using(var archive=new ZipArchive(stream,ZipArchiveMode.Create,true)){Write(archive,"[Content_Types].xml","<?xml version=\"1.0\" encoding=\"UTF-8\"?><Types xmlns=\"http://schemas.openxmlformats.org/package/2006/content-types\"><Default Extension=\"rels\" ContentType=\"application/vnd.openxmlformats-package.relationships+xml\"/><Default Extension=\"xml\" ContentType=\"application/xml\"/><Override PartName=\"/xl/workbook.xml\" ContentType=\"application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml\"/><Override PartName=\"/xl/worksheets/sheet1.xml\" ContentType=\"application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml\"/></Types>");Write(archive,"_rels/.rels","<?xml version=\"1.0\" encoding=\"UTF-8\"?><Relationships xmlns=\"http://schemas.openxmlformats.org/package/2006/relationships\"><Relationship Id=\"rId1\" Type=\"http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument\" Target=\"xl/workbook.xml\"/></Relationships>");Write(archive,"xl/workbook.xml","<?xml version=\"1.0\" encoding=\"UTF-8\"?><workbook xmlns=\"http://schemas.openxmlformats.org/spreadsheetml/2006/main\" xmlns:r=\"http://schemas.openxmlformats.org/officeDocument/2006/relationships\"><sheets><sheet name=\"Estado de cuenta\" sheetId=\"1\" r:id=\"rId1\"/></sheets></workbook>");Write(archive,"xl/_rels/workbook.xml.rels","<?xml version=\"1.0\" encoding=\"UTF-8\"?><Relationships xmlns=\"http://schemas.openxmlformats.org/package/2006/relationships\"><Relationship Id=\"rId1\" Type=\"http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet\" Target=\"worksheets/sheet1.xml\"/></Relationships>");Write(archive,"xl/worksheets/sheet1.xml",sheet);}return stream.ToArray();
    }
    private static void AddRow(StringBuilder rows,int row,params object[] values){var columns=new[]{"A","B","C","D","E","F"};rows.Append($"<row r=\"{row}\">");for(var i=0;i<values.Length;i++)rows.Append(Cell(columns[i],row,values[i]));rows.Append("</row>");}
    private static string Cell(string column,int row,object value){if(value is decimal or int or long or double)return $"<c r=\"{column}{row}\"><v>{Convert.ToString(value,CultureInfo.InvariantCulture)}</v></c>";var text=value is DateTime date?date.ToString("dd/MM/yyyy"):Convert.ToString(value)??"";return $"<c r=\"{column}{row}\" t=\"inlineStr\"><is><t>{SecurityElement.Escape(text)}</t></is></c>";}
    private static void Write(ZipArchive archive,string path,string value){var entry=archive.CreateEntry(path,CompressionLevel.Fastest);using var writer=new StreamWriter(entry.Open(),new UTF8Encoding(false));writer.Write(value);}
}
