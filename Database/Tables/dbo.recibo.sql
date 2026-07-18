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
        CONSTRAINT fk_recibo_factura FOREIGN KEY (id_factura) REFERENCES dbo.factura(id_factura)
    );
    CREATE INDEX idx_recibo_factura ON dbo.recibo(id_factura);
END
GO