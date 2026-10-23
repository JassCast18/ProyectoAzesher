CREATE OR ALTER PROCEDURE dbo.sp_crear_cliente_core
    @Nombre VARCHAR(150), @Nit VARCHAR(20)=NULL, @Telefono VARCHAR(20)=NULL,
    @Correo VARCHAR(150)=NULL, @Direccion VARCHAR(MAX)=NULL, @FechaNacimiento DATE=NULL
AS
BEGIN
    SET NOCOUNT ON;
    IF @FechaNacimiento > CAST(GETDATE() AS DATE)
        THROW 50303, 'La fecha de nacimiento no puede ser futura.', 1;

    INSERT dbo.cliente(nombre,nit,telefono,correo,direccion,fecha_nacimiento)
    VALUES(LTRIM(RTRIM(@Nombre)),COALESCE(NULLIF(UPPER(LTRIM(RTRIM(@Nit))),''),'CF'),
           NULLIF(LTRIM(RTRIM(@Telefono)),''),NULLIF(LTRIM(RTRIM(@Correo)),''),
           NULLIF(LTRIM(RTRIM(@Direccion)),''),@FechaNacimiento);
    SELECT CAST(SCOPE_IDENTITY() AS INT) IdCliente;
END
GO

CREATE OR ALTER PROCEDURE dbo.sp_actualizar_cliente_core
    @IdCliente INT, @Nombre VARCHAR(150), @Nit VARCHAR(20)=NULL, @Telefono VARCHAR(20)=NULL,
    @Correo VARCHAR(150)=NULL, @Direccion VARCHAR(MAX)=NULL, @FechaNacimiento DATE=NULL
AS
BEGIN
    SET NOCOUNT ON;
    IF NOT EXISTS(SELECT 1 FROM dbo.cliente WHERE id_cliente=@IdCliente)
        THROW 50302, 'El cliente no existe.', 1;
    IF @FechaNacimiento > CAST(GETDATE() AS DATE)
        THROW 50303, 'La fecha de nacimiento no puede ser futura.', 1;

    UPDATE dbo.cliente
       SET nombre=LTRIM(RTRIM(@Nombre)),nit=COALESCE(NULLIF(UPPER(LTRIM(RTRIM(@Nit))),''),'CF'),
           telefono=NULLIF(LTRIM(RTRIM(@Telefono)),''),correo=NULLIF(LTRIM(RTRIM(@Correo)),''),
           direccion=NULLIF(LTRIM(RTRIM(@Direccion)),''),fecha_nacimiento=@FechaNacimiento
     WHERE id_cliente=@IdCliente;
END
GO
