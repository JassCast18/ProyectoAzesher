CREATE OR ALTER PROCEDURE dbo.sp_crear_proveedor_core @Nombre VARCHAR(150),@Telefono VARCHAR(20)=NULL,@Direccion VARCHAR(MAX)=NULL AS BEGIN SET NOCOUNT ON; INSERT dbo.proveedor(nombre,telefono,direccion) VALUES(LTRIM(RTRIM(@Nombre)),NULLIF(LTRIM(RTRIM(@Telefono)),''),NULLIF(LTRIM(RTRIM(@Direccion)),''));SELECT CAST(SCOPE_IDENTITY() AS INT) IdProveedor;END
GO
IF OBJECT_ID('dbo.sp_crear_proveedor','SN') IS NOT NULL DROP SYNONYM dbo.sp_crear_proveedor;
GO
CREATE SYNONYM dbo.sp_crear_proveedor FOR dbo.sp_crear_proveedor_core;
GO
