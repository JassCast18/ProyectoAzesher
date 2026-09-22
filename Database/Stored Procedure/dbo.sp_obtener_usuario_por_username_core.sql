
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
        CONCAT(u.nombre,CASE WHEN NULLIF(LTRIM(RTRIM(u.apellidos)),'') IS NULL THEN '' ELSE CONCAT(' ',u.apellidos) END) nombre,
        u.username,
        u.password,
        u.rol,u.fecha_expiracion_password,u.requiere_cambio_password,
        u.id_sucursal,
        s.nombre as nombre_sucursal,
        CASE WHEN LOWER(u.rol) IN ('administrador','admin','demo','superusuario') THEN '*'
             ELSE ISNULL((SELECT STRING_AGG(m.codigo,',') FROM dbo.usuario_modulo um JOIN dbo.modulo_sistema m ON m.id_modulo=um.id_modulo WHERE um.id_usuario=u.id_usuario AND m.activo=1),'') END permisos
    FROM 
        dbo.usuario u
    LEFT JOIN 
        dbo.sucursal s ON u.id_sucursal = s.id_sucursal
    WHERE 
        u.username = @Username AND ISNULL(u.activo,1)=1;
END
GO


IF OBJECT_ID('dbo.sp_obtener_usuario_por_username', 'SN') IS NOT NULL
BEGIN
    DROP SYNONYM dbo.sp_obtener_usuario_por_username;
END
GO

CREATE SYNONYM dbo.sp_obtener_usuario_por_username FOR dbo.sp_obtener_usuario_por_username_core;
GO
