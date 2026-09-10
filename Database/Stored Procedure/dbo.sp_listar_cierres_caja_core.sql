CREATE OR ALTER PROCEDURE dbo.sp_listar_cierres_caja_core @IdSucursal INT,@FechaDesde DATE=NULL,@FechaHasta DATE=NULL AS BEGIN SET NOCOUNT ON;SELECT sc.id_sesion IdSesion,CONCAT('CIE-',RIGHT('00000000'+CAST(sc.id_sesion AS VARCHAR),8)) NumeroCierre,sc.fecha_apertura FechaApertura,sc.fecha_cierre FechaCierre,sc.monto_apertura MontoApertura,sc.monto_esperado MontoEsperado,sc.monto_cierre MontoCierre,sc.diferencia,sc.observaciones,u.nombre Usuario FROM dbo.sesion_caja sc JOIN dbo.usuario u ON u.id_usuario=sc.id_usuario WHERE sc.id_sucursal=@IdSucursal AND sc.fecha_cierre IS NOT NULL AND(@FechaDesde IS NULL OR CAST(sc.fecha_cierre AS DATE)>=@FechaDesde)AND(@FechaHasta IS NULL OR CAST(sc.fecha_cierre AS DATE)<=@FechaHasta)ORDER BY sc.fecha_cierre DESC;END
GO
IF OBJECT_ID('dbo.sp_listar_cierres_caja','SN') IS NOT NULL DROP SYNONYM dbo.sp_listar_cierres_caja;
GO
CREATE SYNONYM dbo.sp_listar_cierres_caja FOR dbo.sp_listar_cierres_caja_core;
GO
