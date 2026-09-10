CREATE OR ALTER PROCEDURE dbo.sp_obtener_factura_core @IdFactura INT AS
BEGIN SET NOCOUNT ON;
 SELECT f.id_factura IdFactura,f.numero_factura NumeroFactura,f.fecha_emision FechaEmision,f.total,f.estado,f.nombre_receptor NombreReceptor,f.nit_receptor NitReceptor,f.direccion_receptor DireccionReceptor,f.numero_autorizacion NumeroAutorizacion,f.fecha_certificacion FechaCertificacion,f.fecha_firma FechaFirma,r.id_recibo IdRecibo,r.numero_recibo NumeroRecibo,s.nombre SucursalNombre FROM dbo.factura f JOIN dbo.recibo r ON r.id_factura=f.id_factura LEFT JOIN dbo.sucursal s ON s.id_sucursal=r.id_sucursal WHERE f.id_factura=@IdFactura;
 SELECT p.nombre ProductoNombre,dv.cantidad Cantidad,dv.precio_unitario PrecioUnitario,dv.subtotal Subtotal FROM dbo.detalle_venta dv JOIN dbo.producto p ON p.id_producto=dv.id_producto JOIN dbo.factura f ON f.id_venta=dv.id_venta WHERE f.id_factura=@IdFactura ORDER BY dv.id_detalle;
END
GO
IF OBJECT_ID('dbo.sp_obtener_factura','SN') IS NOT NULL DROP SYNONYM dbo.sp_obtener_factura;
GO
CREATE SYNONYM dbo.sp_obtener_factura FOR dbo.sp_obtener_factura_core;
GO
