namespace Core.DTOs;
public class SalidaInventarioRequestDTO{public int IdSucursal{get;set;}public string Motivo{get;set;}="";public string? Observaciones{get;set;}public List<SalidaInventarioDetalleDTO> Detalles{get;set;}=[];}
public class SalidaInventarioDetalleDTO{public int IdProducto{get;set;}public int Cantidad{get;set;}}
public class SalidaInventarioConsultaDTO{public int IdSalida{get;set;}public string NumeroSalida{get;set;}="";public DateTime Fecha{get;set;}public string Motivo{get;set;}="";public string? Observaciones{get;set;}public string? Usuario{get;set;}public int Unidades{get;set;}public int Productos{get;set;}}
