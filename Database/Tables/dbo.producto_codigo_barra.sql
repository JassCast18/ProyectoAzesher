IF OBJECT_ID('dbo.producto_codigo_barra', 'U') IS NULL
BEGIN
    CREATE TABLE dbo.producto_codigo_barra
    (
        id_codigo_barra INT IDENTITY(1,1) NOT NULL CONSTRAINT PK_producto_codigo_barra PRIMARY KEY,
        id_producto INT NOT NULL,
        codigo VARCHAR(100) NOT NULL,
        tipo VARCHAR(20) NOT NULL CONSTRAINT DF_producto_codigo_barra_tipo DEFAULT ('CODE128'),
        activo BIT NOT NULL CONSTRAINT DF_producto_codigo_barra_activo DEFAULT (1),
        fecha_registro DATETIME2(0) NOT NULL CONSTRAINT DF_producto_codigo_barra_fecha DEFAULT (SYSDATETIME()),
        id_usuario_registro INT NULL,
        fecha_desactivacion DATETIME2(0) NULL,
        id_usuario_desactivacion INT NULL,
        CONSTRAINT FK_producto_codigo_barra_producto FOREIGN KEY (id_producto) REFERENCES dbo.producto(id_producto)
    );
    CREATE UNIQUE INDEX UX_producto_codigo_barra_activo ON dbo.producto_codigo_barra(codigo) WHERE activo = 1;
    CREATE INDEX IX_producto_codigo_barra_producto ON dbo.producto_codigo_barra(id_producto, activo);
END;
GO
