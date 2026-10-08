SET XACT_ABORT ON;
BEGIN TRANSACTION;

IF OBJECT_ID('dbo.usuario_password_historial', 'U') IS NULL
BEGIN
    CREATE TABLE dbo.usuario_password_historial
    (
        id_historial BIGINT IDENTITY(1,1) PRIMARY KEY,
        id_usuario INT NOT NULL REFERENCES dbo.usuario(id_usuario),
        password_hash VARCHAR(255) NOT NULL,
        fecha_cambio DATETIME2(0) NOT NULL DEFAULT SYSUTCDATETIME()
    );
    CREATE INDEX IX_usuario_password_historial_reciente
        ON dbo.usuario_password_historial(id_usuario, id_historial DESC);
END;

IF OBJECT_ID('dbo.usuario_verificacion_correo', 'U') IS NULL
BEGIN
    CREATE TABLE dbo.usuario_verificacion_correo
    (
        id_verificacion BIGINT IDENTITY(1,1) PRIMARY KEY,
        id_usuario INT NOT NULL REFERENCES dbo.usuario(id_usuario),
        proposito VARCHAR(20) NOT NULL,
        correo_destino VARCHAR(150) NOT NULL,
        codigo_hash CHAR(64) NOT NULL,
        intentos TINYINT NOT NULL DEFAULT 0,
        fecha_creacion DATETIME2(0) NOT NULL DEFAULT SYSUTCDATETIME(),
        fecha_expiracion DATETIME2(0) NOT NULL,
        fecha_uso DATETIME2(0) NULL
    );
    CREATE INDEX IX_usuario_verificacion_reciente
        ON dbo.usuario_verificacion_correo(id_usuario, proposito, id_verificacion DESC);
END;

COMMIT TRANSACTION;
