CREATE OR ALTER PROCEDURE dbo.sp_obtener_monedas_core
AS
BEGIN
    SET NOCOUNT ON;
    SELECT id_moneda AS IdMoneda, codigo AS Codigo, nombre AS Nombre, simbolo AS Simbolo
    FROM dbo.moneda WHERE activo = 1 ORDER BY nombre;
END
GO
IF OBJECT_ID('dbo.sp_obtener_monedas', 'SN') IS NOT NULL DROP SYNONYM dbo.sp_obtener_monedas;
GO
CREATE SYNONYM dbo.sp_obtener_monedas FOR dbo.sp_obtener_monedas_core;
GO
