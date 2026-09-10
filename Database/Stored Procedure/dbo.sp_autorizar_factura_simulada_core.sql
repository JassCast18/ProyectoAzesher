CREATE OR ALTER PROCEDURE dbo.sp_autorizar_factura_simulada_core @IdRecibo INT,@IdSucursal INT,@Nombre VARCHAR(150),@Nit VARCHAR(20),@Direccion VARCHAR(300)=NULL AS
BEGIN SET NOCOUNT ON; DECLARE @IdFactura INT,@Metodo VARCHAR(50),@EstadoRecibo VARCHAR(30);
 SELECT @IdFactura=r.id_factura,@Metodo=r.metodo_pago,@EstadoRecibo=r.estado FROM dbo.recibo r WHERE r.id_recibo=@IdRecibo AND r.id_sucursal=@IdSucursal;
 IF @IdFactura IS NULL THROW 50101,'El recibo no existe en la sucursal seleccionada.',1; IF @Metodo='credito' THROW 50102,'Las notas de crédito no pueden convertirse en factura.',1; IF @EstadoRecibo='Anulado' THROW 50103,'No se puede facturar un recibo anulado.',1;
 IF EXISTS(SELECT 1 FROM dbo.factura WHERE id_factura=@IdFactura AND estado='Autorizada') THROW 50104,'Este recibo ya tiene una factura autorizada.',1;
 DECLARE @Ahora DATETIME=GETDATE(),@Autorizacion VARCHAR(100)=CONCAT('SIM-',REPLACE(CONVERT(VARCHAR(36),NEWID()),'-',''));
 UPDATE dbo.factura SET numero_factura=CONCAT('FAC-',RIGHT('00000000'+CAST(@IdFactura AS VARCHAR(10)),8)),estado='Autorizada',fecha_emision=@Ahora,nombre_receptor=LTRIM(RTRIM(@Nombre)),nit_receptor=ISNULL(NULLIF(LTRIM(RTRIM(@Nit)),''),'CF'),direccion_receptor=NULLIF(LTRIM(RTRIM(@Direccion)),''),numero_autorizacion=@Autorizacion,fecha_certificacion=@Ahora,fecha_firma=@Ahora WHERE id_factura=@IdFactura;
 SELECT @IdFactura IdFactura;
END
GO
IF OBJECT_ID('dbo.sp_autorizar_factura_simulada','SN') IS NOT NULL DROP SYNONYM dbo.sp_autorizar_factura_simulada;
GO
CREATE SYNONYM dbo.sp_autorizar_factura_simulada FOR dbo.sp_autorizar_factura_simulada_core;
GO
