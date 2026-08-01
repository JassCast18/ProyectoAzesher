IF OBJECT_ID('dbo.sp_obtener_clientes_catalogo_core', 'P') IS NOT NULL
BEGIN
    DROP PROCEDURE dbo.sp_obtener_clientes_catalogo_core;
END
GO

CREATE PROCEDURE dbo.sp_obtener_clientes_catalogo_core
    @Query VARCHAR(200) = ''
AS
BEGIN
    SET NOCOUNT ON;

    SELECT TOP 20
        c.id_cliente AS IdCliente,
        c.nombre AS Nombre,
        c.telefono AS Telefono,
        c.direccion AS Direccion,
        c.nit AS Nit
    FROM dbo.cliente c
    WHERE
        (@Query = ''
         OR c.nit LIKE '%' + @Query + '%'
         OR c.nombre LIKE '%' + @Query + '%')
    ORDER BY c.nombre;
END
GO

IF OBJECT_ID('dbo.sp_obtener_clientes_catalogo', 'SN') IS NOT NULL
BEGIN
    DROP SYNONYM dbo.sp_obtener_clientes_catalogo;
END
GO

CREATE SYNONYM dbo.sp_obtener_clientes_catalogo FOR dbo.sp_obtener_clientes_catalogo_core;
GO