CREATE OR ALTER PROCEDURE dbo.sp_obtener_tipos_pos_core
AS
BEGIN
    SET NOCOUNT ON;
    SELECT id_tipo_pos AS IdTipoPos, nombre AS Nombre
    FROM dbo.tipo_pos WHERE activo = 1 ORDER BY nombre;
END
GO
IF OBJECT_ID('dbo.sp_obtener_tipos_pos', 'SN') IS NOT NULL DROP SYNONYM dbo.sp_obtener_tipos_pos;
GO
CREATE SYNONYM dbo.sp_obtener_tipos_pos FOR dbo.sp_obtener_tipos_pos_core;
GO
