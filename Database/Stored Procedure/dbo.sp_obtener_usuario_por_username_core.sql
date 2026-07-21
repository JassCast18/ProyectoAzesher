
IF OBJECT_ID('dbo.sp_obtener_usuario_por_username_core', 'P') IS NOT NULL
BEGIN
    DROP PROCEDURE dbo.sp_obtener_usuario_por_username_core;
END
GO

CREATE PROCEDURE dbo.sp_obtener_usuario_por_username_core
    @Username VARCHAR(50)
AS
BEGIN
    SET NOCOUNT ON;

    SELECT 
        u.id_usuario,
        u.nombre as [Nombre Usuario],
        u.username,
        u.password,
        u.rol,
        u.id_sucursal,
        s.nombre as [Sucursal]
    FROM 
        dbo.usuario u
    LEFT JOIN 
        dbo.sucursal s ON u.id_sucursal = s.id_sucursal
    WHERE 
        u.username = @Username;
END
GO


IF OBJECT_ID('dbo.sp_obtener_usuario_por_username', 'SN') IS NOT NULL
BEGIN
    DROP SYNONYM dbo.sp_obtener_usuario_por_username;
END
GO

CREATE SYNONYM dbo.sp_obtener_usuario_por_username FOR dbo.sp_obtener_usuario_por_username_core;
GO