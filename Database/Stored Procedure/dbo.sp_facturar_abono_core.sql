SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE OR ALTER PROCEDURE dbo.sp_facturar_abono_core @IdAbono INT,@IdSucursal INT,@Nombre VARCHAR(150),@Nit VARCHAR(20)=NULL,@Direccion VARCHAR(300)=NULL
AS BEGIN
 SET NOCOUNT ON;
 DECLARE @IdVenta INT,@Monto DECIMAL(12,2),@Id INT;
 SELECT @IdVenta=v.id_venta,@Monto=a.monto FROM dbo.abono a JOIN dbo.cuenta_cobrar cx ON cx.id_cuenta=a.id_cuenta JOIN dbo.venta v ON v.id_venta=cx.id_venta WHERE a.id_abono=@IdAbono AND a.id_sucursal=@IdSucursal;
 IF @IdVenta IS NULL THROW 50601,'El abono no existe en la sucursal seleccionada.',1;
 SELECT @Id=id_factura FROM dbo.factura WHERE id_abono=@IdAbono;
 IF @Id IS NOT NULL AND EXISTS(SELECT 1 FROM dbo.factura WHERE id_factura=@Id AND estado='Autorizada' AND NULLIF(numero_autorizacion,'') IS NOT NULL) THROW 50602,'Este abono ya tiene una factura FEL autorizada.',1;
 IF @Id IS NULL
 BEGIN
  INSERT dbo.factura(numero_factura,fecha_emision,total,estado,id_venta,nombre_receptor,nit_receptor,direccion_receptor,numero_autorizacion,fecha_certificacion,fecha_firma,id_abono,tipo_origen)
  VALUES(CONCAT('TEMP-',NEWID()),GETDATE(),@Monto,'Procesando',@IdVenta,LTRIM(RTRIM(@Nombre)),ISNULL(NULLIF(LTRIM(RTRIM(@Nit)),''),'CF'),NULLIF(LTRIM(RTRIM(@Direccion)),''),NULL,NULL,NULL,@IdAbono,'Abono');
  SET @Id=SCOPE_IDENTITY();
 END
 ELSE UPDATE dbo.factura SET fecha_emision=GETDATE(),estado='Procesando',nombre_receptor=LTRIM(RTRIM(@Nombre)),nit_receptor=ISNULL(NULLIF(LTRIM(RTRIM(@Nit)),''),'CF'),direccion_receptor=NULLIF(LTRIM(RTRIM(@Direccion)),''),numero_autorizacion=NULL,fecha_certificacion=NULL,fecha_firma=NULL,ultimo_error=NULL WHERE id_factura=@Id;
 UPDATE dbo.factura SET numero_factura=CONCAT('BOR-',RIGHT('00000000'+CAST(@Id AS VARCHAR(10)),8)) WHERE id_factura=@Id;
 SELECT @Id;
END
GO
IF OBJECT_ID('dbo.sp_facturar_abono','SN') IS NOT NULL DROP SYNONYM dbo.sp_facturar_abono;
GO
CREATE SYNONYM dbo.sp_facturar_abono FOR dbo.sp_facturar_abono_core;
GO
