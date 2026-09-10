-- ==============================================================================
-- TABLA: TRASLADO
-- Descripción: Encabezado de los movimientos de productos entre sucursales.
-- ==============================================================================
IF OBJECT_ID('dbo.traslado', 'U') IS NOT NULL
BEGIN
    IF NOT EXISTS (SELECT 1 FROM dbo.traslado)
        DROP TABLE dbo.traslado;
    ELSE
        PRINT 'La tabla "traslado" contiene datos. Omitiendo eliminación.';
END
GO

IF OBJECT_ID('dbo.traslado', 'U') IS NULL
BEGIN
    CREATE TABLE dbo.traslado (
        id_traslado INT IDENTITY(1,1) PRIMARY KEY,
        id_sucursal_origen INT NOT NULL,
        id_sucursal_destino INT NOT NULL,
        fecha DATETIME DEFAULT GETDATE(),
        estado VARCHAR(50) NOT NULL,
        numero_traslado VARCHAR(30) NULL,
        observaciones VARCHAR(500) NULL,
        id_usuario INT NULL,
        CONSTRAINT fk_traslado_origen FOREIGN KEY (id_sucursal_origen) REFERENCES dbo.sucursal(id_sucursal),
        CONSTRAINT fk_traslado_destino FOREIGN KEY (id_sucursal_destino) REFERENCES dbo.sucursal(id_sucursal),
        CONSTRAINT fk_traslado_usuario FOREIGN KEY (id_usuario) REFERENCES dbo.usuario(id_usuario)
    );
    CREATE INDEX idx_traslado_origen ON dbo.traslado(id_sucursal_origen);
    CREATE INDEX idx_traslado_destino ON dbo.traslado(id_sucursal_destino);
END
GO

IF COL_LENGTH('dbo.traslado','numero_traslado') IS NULL ALTER TABLE dbo.traslado ADD numero_traslado VARCHAR(30) NULL;
IF COL_LENGTH('dbo.traslado','observaciones') IS NULL ALTER TABLE dbo.traslado ADD observaciones VARCHAR(500) NULL;
IF COL_LENGTH('dbo.traslado','id_usuario') IS NULL ALTER TABLE dbo.traslado ADD id_usuario INT NULL;
GO
SET QUOTED_IDENTIFIER ON;
GO
IF NOT EXISTS (SELECT 1 FROM sys.foreign_keys WHERE name='fk_traslado_usuario') ALTER TABLE dbo.traslado ADD CONSTRAINT fk_traslado_usuario FOREIGN KEY(id_usuario) REFERENCES dbo.usuario(id_usuario);
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name='uq_traslado_numero' AND object_id=OBJECT_ID('dbo.traslado')) CREATE UNIQUE INDEX uq_traslado_numero ON dbo.traslado(numero_traslado) WHERE numero_traslado IS NOT NULL;
GO
