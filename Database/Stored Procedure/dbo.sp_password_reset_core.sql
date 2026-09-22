CREATE OR ALTER PROCEDURE dbo.sp_solicitar_reset_password_core @Identificador VARCHAR(150)
AS
BEGIN
 SET NOCOUNT ON;
 SELECT TOP(1) id_usuario IdUsuario,nombre Nombre,correo Correo
 FROM dbo.usuario
 WHERE activo=1 AND NULLIF(correo,'') IS NOT NULL AND (username=@Identificador OR correo=@Identificador);
END
GO

CREATE OR ALTER PROCEDURE dbo.sp_guardar_token_password_core @IdUsuario INT,@TokenHash CHAR(64),@FechaExpiracion DATETIME2
AS
BEGIN
 SET NOCOUNT ON;
 UPDATE dbo.password_reset_token SET fecha_uso=SYSUTCDATETIME() WHERE id_usuario=@IdUsuario AND fecha_uso IS NULL;
 INSERT dbo.password_reset_token(id_usuario,token_hash,fecha_expiracion) VALUES(@IdUsuario,@TokenHash,@FechaExpiracion);
END
GO

CREATE OR ALTER PROCEDURE dbo.sp_restaurar_password_core @TokenHash CHAR(64),@PasswordHash VARCHAR(255)
AS
BEGIN
 SET NOCOUNT ON; SET XACT_ABORT ON;
 BEGIN TRANSACTION;
 DECLARE @IdToken INT,@IdUsuario INT;
 SELECT @IdToken=id_token,@IdUsuario=id_usuario FROM dbo.password_reset_token WITH(UPDLOCK,HOLDLOCK)
 WHERE token_hash=@TokenHash AND fecha_uso IS NULL AND fecha_expiracion>SYSUTCDATETIME();
 IF @IdToken IS NULL THROW 50430,'El enlace no es válido o ya venció.',1;
 UPDATE dbo.usuario SET password=@PasswordHash,requiere_cambio_password=0,
   fecha_expiracion_password=CASE WHEN LOWER(rol) IN('administrador','admin','demo','superusuario') THEN NULL ELSE DATEADD(DAY,90,CAST(GETDATE() AS DATE)) END
 WHERE id_usuario=@IdUsuario AND activo=1;
 IF @@ROWCOUNT=0 THROW 50431,'El usuario ya no está activo.',1;
 UPDATE dbo.password_reset_token SET fecha_uso=SYSUTCDATETIME() WHERE id_token=@IdToken;
 COMMIT;
END
GO

IF OBJECT_ID('dbo.sp_solicitar_reset_password','SN') IS NOT NULL DROP SYNONYM dbo.sp_solicitar_reset_password;
IF OBJECT_ID('dbo.sp_guardar_token_password','SN') IS NOT NULL DROP SYNONYM dbo.sp_guardar_token_password;
IF OBJECT_ID('dbo.sp_restaurar_password','SN') IS NOT NULL DROP SYNONYM dbo.sp_restaurar_password;
GO
CREATE SYNONYM dbo.sp_solicitar_reset_password FOR dbo.sp_solicitar_reset_password_core;
CREATE SYNONYM dbo.sp_guardar_token_password FOR dbo.sp_guardar_token_password_core;
CREATE SYNONYM dbo.sp_restaurar_password FOR dbo.sp_restaurar_password_core;
GO
