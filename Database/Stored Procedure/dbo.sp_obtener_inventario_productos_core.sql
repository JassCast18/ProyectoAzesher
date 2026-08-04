CREATE OR ALTER PROCEDURE dbo.sp_obtener_inventario_productos_core
    @IdSucursal INT,
    @Query VARCHAR(200) = ''
AS
BEGIN
    SET NOCOUNT ON;

    DECLARE @Busqueda VARCHAR(200) = LTRIM(RTRIM(ISNULL(@Query, '')));

    SELECT
        i.id_inventario AS IdInventario,
        p.id_producto AS IdProducto,
        p.nombre AS Nombre,
        p.descripcion AS Descripcion,
        p.precio AS Precio,
        i.stock AS Stock,
        s.id_sucursal AS IdSucursal,
        s.nombre AS SucursalNombre,
        CASE
            WHEN i.stock <= 0 THEN 'Sin existencias'
            WHEN i.stock <= 5 THEN 'Existencia baja'
            ELSE 'Disponible'
        END AS EstadoStock
    FROM dbo.inventario i
    INNER JOIN dbo.producto p ON p.id_producto = i.id_producto
    INNER JOIN dbo.sucursal s ON s.id_sucursal = i.id_sucursal
    WHERE i.id_sucursal = @IdSucursal
      AND (
          @Busqueda = ''
          OR p.nombre LIKE '%' + @Busqueda + '%'
          OR ISNULL(p.descripcion, '') LIKE '%' + @Busqueda + '%'
          OR CONVERT(VARCHAR(20), p.id_producto) = @Busqueda
      )
    ORDER BY p.nombre, p.id_producto;
END;
GO

IF OBJECT_ID('dbo.sp_obtener_inventario_productos', 'SN') IS NOT NULL
    DROP SYNONYM dbo.sp_obtener_inventario_productos;
GO

CREATE SYNONYM dbo.sp_obtener_inventario_productos
FOR dbo.sp_obtener_inventario_productos_core;
GO
