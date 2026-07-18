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
        CONSTRAINT fk_traslado_origen FOREIGN KEY (id_sucursal_origen) REFERENCES dbo.sucursal(id_sucursal),
        CONSTRAINT fk_traslado_destino FOREIGN KEY (id_sucursal_destino) REFERENCES dbo.sucursal(id_sucursal)
    );
    CREATE INDEX idx_traslado_origen ON dbo.traslado(id_sucursal_origen);
    CREATE INDEX idx_traslado_destino ON dbo.traslado(id_sucursal_destino);
END
GO