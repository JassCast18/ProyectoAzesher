CREATE OR ALTER PROCEDURE dbo.sp_productos_proveedor_core @IdProveedor INT AS BEGIN SET NOCOUNT ON;SELECT p.id_producto IdProducto,p.cod_producto Codigo,p.nombre Nombre,p.descripcion Descripcion,p.precio Precio,pp.activo Activo FROM dbo.proveedor_producto pp JOIN dbo.producto p ON p.id_producto=pp.id_producto WHERE pp.id_proveedor=@IdProveedor ORDER BY p.nombre;END
GO
IF OBJECT_ID('dbo.sp_productos_proveedor','SN') IS NOT NULL DROP SYNONYM dbo.sp_productos_proveedor;
GO
CREATE SYNONYM dbo.sp_productos_proveedor FOR dbo.sp_productos_proveedor_core;
GO
