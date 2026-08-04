IF OBJECT_ID('dbo.sp_obtener_productos_catalogo_core', 'P') IS NOT NULL
BEGIN
    DROP PROCEDURE dbo.sp_obtener_productos_catalogo_core;
END
GO

CREATE PROCEDURE dbo.sp_obtener_productos_catalogo_core
    @Query VARCHAR(200) = '',
    @IdSucursal INT = NULL
AS
BEGIN
    SET NOCOUNT ON;

    SELECT TOP 20
        p.id_producto AS IdProducto,
        p.nombre AS Nombre,
        p.descripcion AS Descripcion,
        p.precio AS Precio,
        i.id_sucursal AS IdSucursal,
        s.nombre AS NombreSucursal,
        i.stock AS Stock
    FROM dbo.producto p
    LEFT JOIN dbo.inventario i ON i.id_producto = p.id_producto
    LEFT JOIN dbo.sucursal s ON s.id_sucursal = i.id_sucursal
    WHERE
        (@Query = ''
         OR CAST(p.id_producto AS VARCHAR(20)) LIKE '%' + @Query + '%'
         OR p.nombre LIKE '%' + @Query + '%'
         OR ISNULL(p.descripcion, '') LIKE '%' + @Query + '%')
        AND (@IdSucursal IS NULL OR i.id_sucursal = @IdSucursal)
        AND ISNULL(i.stock, 0) > 0
    ORDER BY p.nombre;
END
GO

IF OBJECT_ID('dbo.sp_obtener_productos_catalogo', 'SN') IS NOT NULL
BEGIN
    DROP SYNONYM dbo.sp_obtener_productos_catalogo;
END
GO

CREATE SYNONYM dbo.sp_obtener_productos_catalogo FOR dbo.sp_obtener_productos_catalogo_core;
GO
