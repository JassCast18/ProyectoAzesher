IF OBJECT_ID('dbo.sp_obtener_vendedores_catalogo_core', 'P') IS NOT NULL
BEGIN
    DROP PROCEDURE dbo.sp_obtener_vendedores_catalogo_core;
END
GO

CREATE PROCEDURE dbo.sp_obtener_vendedores_catalogo_core
    @IdSucursal INT
AS
BEGIN
    SET NOCOUNT ON;

    SELECT
        v.id_vendedor AS IdVendedor,
        v.nombre AS Nombre,
        v.id_sucursal AS IdSucursal,
        s.nombre AS SucursalNombre
    FROM dbo.vendedor v
    INNER JOIN dbo.sucursal s ON s.id_sucursal = v.id_sucursal
    WHERE v.id_sucursal = @IdSucursal AND ISNULL(v.activo,1)=1
    ORDER BY v.nombre;
END
GO

IF OBJECT_ID('dbo.sp_obtener_vendedores_catalogo', 'SN') IS NOT NULL
BEGIN
    DROP SYNONYM dbo.sp_obtener_vendedores_catalogo;
END
GO

CREATE SYNONYM dbo.sp_obtener_vendedores_catalogo
FOR dbo.sp_obtener_vendedores_catalogo_core;
GO
