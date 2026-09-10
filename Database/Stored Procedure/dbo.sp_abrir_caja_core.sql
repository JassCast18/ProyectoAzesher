CREATE OR ALTER PROCEDURE dbo.sp_abrir_caja_core @IdUsuario INT,@IdSucursal INT,@MontoApertura DECIMAL(12,2) AS BEGIN SET NOCOUNT ON; IF @MontoApertura<0 THROW 50201,'El monto de apertura no puede ser negativo.',1;IF EXISTS(SELECT 1 FROM dbo.sesion_caja WHERE id_sucursal=@IdSucursal AND fecha_cierre IS NULL) THROW 50202,'Ya existe una caja abierta en esta sucursal.',1;INSERT dbo.sesion_caja(id_usuario,id_sucursal,monto_apertura)VALUES(@IdUsuario,@IdSucursal,@MontoApertura);SELECT CAST(SCOPE_IDENTITY() AS INT) IdSesion;END
GO
IF OBJECT_ID('dbo.sp_abrir_caja','SN') IS NOT NULL DROP SYNONYM dbo.sp_abrir_caja;
GO
CREATE SYNONYM dbo.sp_abrir_caja FOR dbo.sp_abrir_caja_core;
GO
