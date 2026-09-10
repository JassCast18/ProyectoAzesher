CREATE OR ALTER PROCEDURE dbo.sp_buscar_recibos_facturables_core @IdSucursal INT,@Query VARCHAR(100)='' AS
BEGIN SET NOCOUNT ON;
 SELECT TOP(40) r.id_recibo IdRecibo,r.numero_recibo NumeroRecibo,r.fecha_pago FechaPago,r.monto,c.nombre ClienteNombre,c.nit ClienteNit,c.direccion ClienteDireccion,f.id_factura IdFactura,f.estado EstadoFactura,
 CAST(CASE WHEN r.estado<>'Anulado' AND r.metodo_pago<>'credito' AND f.estado IN ('Pendiente','Emitida') AND NULLIF(f.numero_autorizacion,'') IS NULL THEN 1 ELSE 0 END AS BIT) PuedeFacturar,
 CASE WHEN r.estado='Anulado' THEN 'El recibo está anulado.' WHEN r.metodo_pago='credito' THEN 'Es una nota de crédito y no puede facturarse.' WHEN f.estado='Autorizada' OR NULLIF(f.numero_autorizacion,'') IS NOT NULL THEN 'Este recibo ya tiene una factura autorizada.' WHEN f.estado IN ('Pendiente','Emitida') THEN NULL ELSE 'El estado del documento no permite facturarlo.' END MotivoNoFacturable
 FROM dbo.recibo r JOIN dbo.factura f ON f.id_factura=r.id_factura JOIN dbo.venta v ON v.id_venta=f.id_venta JOIN dbo.cliente c ON c.id_cliente=v.id_cliente
 WHERE r.id_sucursal=@IdSucursal AND (ISNULL(@Query,'')='' OR r.numero_recibo LIKE '%'+@Query+'%' OR c.nombre LIKE '%'+@Query+'%' OR ISNULL(c.nit,'') LIKE '%'+@Query+'%') ORDER BY r.fecha_pago DESC;
END
GO
IF OBJECT_ID('dbo.sp_buscar_recibos_facturables','SN') IS NOT NULL DROP SYNONYM dbo.sp_buscar_recibos_facturables;
GO
CREATE SYNONYM dbo.sp_buscar_recibos_facturables FOR dbo.sp_buscar_recibos_facturables_core;
GO
