CREATE OR ALTER PROCEDURE dbo.sp_registrar_salida_caja_core
    @IdUsuario INT, @IdSucursal INT, @Monto DECIMAL(12,2),
    @Concepto VARCHAR(120), @Observaciones VARCHAR(500)=NULL
AS
BEGIN
    SET NOCOUNT ON;
    DECLARE @IdSesion INT;
    SELECT TOP(1) @IdSesion=id_sesion FROM dbo.sesion_caja
    WHERE id_sucursal=@IdSucursal AND fecha_cierre IS NULL ORDER BY fecha_apertura DESC;
    IF @IdSesion IS NULL THROW 50501,'No existe una caja abierta en esta sucursal.',1;
    IF @Monto<=0 THROW 50502,'El monto de la salida debe ser mayor que cero.',1;
    IF NULLIF(LTRIM(RTRIM(@Concepto)),'') IS NULL THROW 50503,'Escribe el concepto de la salida.',1;
    INSERT dbo.movimiento_caja_manual(id_sesion,tipo,concepto,monto,observaciones,id_usuario)
    VALUES(@IdSesion,'salida',LTRIM(RTRIM(@Concepto)),@Monto,NULLIF(LTRIM(RTRIM(@Observaciones)),''),@IdUsuario);
END
GO
IF OBJECT_ID('dbo.sp_registrar_salida_caja','SN') IS NOT NULL DROP SYNONYM dbo.sp_registrar_salida_caja;
GO
CREATE SYNONYM dbo.sp_registrar_salida_caja FOR dbo.sp_registrar_salida_caja_core;
GO
