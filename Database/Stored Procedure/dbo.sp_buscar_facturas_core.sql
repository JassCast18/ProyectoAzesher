CREATE OR ALTER PROCEDURE dbo.sp_buscar_facturas_core @IdSucursal INT,@Query VARCHAR(100)='',@FechaDesde DATE=NULL,@FechaHasta DATE=NULL AS
BEGIN SET NOCOUNT ON;
 SELECT f.id_factura IdFactura,f.numero_factura NumeroFactura,f.fecha_emision FechaEmision,f.total,f.estado,f.nombre_receptor NombreReceptor,f.nit_receptor NitReceptor,f.numero_autorizacion NumeroAutorizacion,r.id_recibo IdRecibo,r.numero_recibo NumeroRecibo,f.tipo_origen TipoOrigen
 FROM dbo.factura f LEFT JOIN dbo.factura fv ON fv.id_venta=f.id_venta AND fv.id_abono IS NULL LEFT JOIN dbo.recibo r ON r.id_factura=fv.id_factura LEFT JOIN dbo.abono a ON a.id_abono=f.id_abono WHERE COALESCE(r.id_sucursal,a.id_sucursal)=@IdSucursal AND f.estado='Autorizada' AND (@FechaDesde IS NULL OR CAST(f.fecha_emision AS DATE)>=@FechaDesde) AND (@FechaHasta IS NULL OR CAST(f.fecha_emision AS DATE)<=@FechaHasta) AND (ISNULL(@Query,'')='' OR f.numero_factura LIKE '%'+@Query+'%' OR ISNULL(r.numero_recibo,'') LIKE '%'+@Query+'%' OR ISNULL(f.nit_receptor,'') LIKE '%'+@Query+'%' OR ISNULL(f.nombre_receptor,'') LIKE '%'+@Query+'%') ORDER BY f.fecha_emision DESC;
END
GO
IF OBJECT_ID('dbo.sp_buscar_facturas','SN') IS NOT NULL DROP SYNONYM dbo.sp_buscar_facturas;
GO
CREATE SYNONYM dbo.sp_buscar_facturas FOR dbo.sp_buscar_facturas_core;
GO
