SET ANSI_NULLS ON;
SET QUOTED_IDENTIFIER ON;
SET XACT_ABORT ON;
BEGIN TRANSACTION;

IF OBJECT_ID('dbo.notificacion', 'U') IS NULL
BEGIN
    CREATE TABLE dbo.notificacion
    (
        id_notificacion BIGINT IDENTITY(1,1) NOT NULL CONSTRAINT PK_notificacion PRIMARY KEY,
        id_usuario_destino INT NOT NULL,
        id_usuario_origen INT NULL,
        tipo VARCHAR(40) NOT NULL,
        titulo VARCHAR(150) NOT NULL,
        mensaje VARCHAR(600) NOT NULL,
        url VARCHAR(350) NULL,
        entidad VARCHAR(50) NULL,
        id_entidad INT NULL,
        fecha_creacion DATETIME2(0) NOT NULL CONSTRAINT DF_notificacion_fecha DEFAULT SYSUTCDATETIME(),
        fecha_lectura DATETIME2(0) NULL,
        fecha_resolucion DATETIME2(0) NULL,
        id_usuario_resolvio INT NULL,
        CONSTRAINT FK_notificacion_destino FOREIGN KEY(id_usuario_destino) REFERENCES dbo.usuario(id_usuario),
        CONSTRAINT FK_notificacion_origen FOREIGN KEY(id_usuario_origen) REFERENCES dbo.usuario(id_usuario),
        CONSTRAINT FK_notificacion_resolvio FOREIGN KEY(id_usuario_resolvio) REFERENCES dbo.usuario(id_usuario)
    );

    CREATE INDEX IX_notificacion_usuario_fecha
        ON dbo.notificacion(id_usuario_destino, fecha_creacion DESC);
    CREATE INDEX IX_notificacion_pendiente
        ON dbo.notificacion(tipo, entidad, id_entidad, fecha_resolucion)
        INCLUDE(id_usuario_destino, id_usuario_origen);
END;

COMMIT TRANSACTION;
