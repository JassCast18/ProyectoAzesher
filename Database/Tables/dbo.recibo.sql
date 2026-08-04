-- ==============================================================================
-- TABLA: RECIBO
-- Descripción: Comprobante de pago emitido sobre una factura específica.
-- ==============================================================================
IF OBJECT_ID('dbo.recibo', 'U') IS NOT NULL
BEGIN
    IF NOT EXISTS (SELECT 1 FROM dbo.recibo)
        DROP TABLE dbo.recibo;
    ELSE
        PRINT 'La tabla "recibo" contiene datos. Omitiendo eliminación.';
END
GO

IF OBJECT_ID('dbo.recibo', 'U') IS NULL
BEGIN
    CREATE TABLE dbo.recibo (
        id_recibo INT IDENTITY(1,1) PRIMARY KEY,
        numero_recibo VARCHAR(50) NOT NULL UNIQUE,
        fecha_pago DATETIME DEFAULT GETDATE(),
        monto DECIMAL(12,2) NOT NULL,
        metodo_pago VARCHAR(50) NOT NULL,
        numero_comprobante VARCHAR(100),
        id_factura INT NOT NULL,
        id_sucursal INT NULL,
        estado VARCHAR(30) NOT NULL CONSTRAINT df_recibo_estado DEFAULT 'Autorizado',
        fecha_anulacion DATETIME NULL,
        motivo_anulacion VARCHAR(500) NULL,
        id_usuario_anulacion INT NULL,
        CONSTRAINT fk_recibo_factura FOREIGN KEY (id_factura) REFERENCES dbo.factura(id_factura),
        CONSTRAINT fk_recibo_sucursal FOREIGN KEY (id_sucursal) REFERENCES dbo.sucursal(id_sucursal),
        CONSTRAINT fk_recibo_usuario_anulacion FOREIGN KEY (id_usuario_anulacion) REFERENCES dbo.usuario(id_usuario)
    );
    CREATE INDEX idx_recibo_factura ON dbo.recibo(id_factura);
    CREATE INDEX idx_recibo_sucursal ON dbo.recibo(id_sucursal);
    CREATE INDEX idx_recibo_estado_fecha ON dbo.recibo(estado, fecha_pago);
END
GO

IF COL_LENGTH('dbo.recibo', 'id_sucursal') IS NULL
    ALTER TABLE dbo.recibo ADD id_sucursal INT NULL;
IF COL_LENGTH('dbo.recibo', 'estado') IS NULL
    ALTER TABLE dbo.recibo ADD estado VARCHAR(30) NOT NULL CONSTRAINT df_recibo_estado DEFAULT 'Autorizado';
IF COL_LENGTH('dbo.recibo', 'fecha_anulacion') IS NULL
    ALTER TABLE dbo.recibo ADD fecha_anulacion DATETIME NULL;
IF COL_LENGTH('dbo.recibo', 'motivo_anulacion') IS NULL
    ALTER TABLE dbo.recibo ADD motivo_anulacion VARCHAR(500) NULL;
IF COL_LENGTH('dbo.recibo', 'id_usuario_anulacion') IS NULL
    ALTER TABLE dbo.recibo ADD id_usuario_anulacion INT NULL;
GO

IF NOT EXISTS (SELECT 1 FROM sys.foreign_keys WHERE name = 'fk_recibo_sucursal' AND parent_object_id = OBJECT_ID('dbo.recibo'))
    ALTER TABLE dbo.recibo ADD CONSTRAINT fk_recibo_sucursal FOREIGN KEY (id_sucursal) REFERENCES dbo.sucursal(id_sucursal);
IF NOT EXISTS (SELECT 1 FROM sys.foreign_keys WHERE name = 'fk_recibo_usuario_anulacion' AND parent_object_id = OBJECT_ID('dbo.recibo'))
    ALTER TABLE dbo.recibo ADD CONSTRAINT fk_recibo_usuario_anulacion FOREIGN KEY (id_usuario_anulacion) REFERENCES dbo.usuario(id_usuario);
GO

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'idx_recibo_sucursal' AND object_id = OBJECT_ID('dbo.recibo'))
    CREATE INDEX idx_recibo_sucursal ON dbo.recibo(id_sucursal);
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'idx_recibo_estado_fecha' AND object_id = OBJECT_ID('dbo.recibo'))
    CREATE INDEX idx_recibo_estado_fecha ON dbo.recibo(estado, fecha_pago);
GO
