-- ==============================================================================
-- TABLA: FACTURA
-- Descripción: Emisión del documento contable/fiscal de la venta.
-- ==============================================================================
IF OBJECT_ID('dbo.factura', 'U') IS NOT NULL
BEGIN
    IF NOT EXISTS (SELECT 1 FROM dbo.factura)
        DROP TABLE dbo.factura;
    ELSE
        PRINT 'La tabla "factura" contiene datos. Omitiendo eliminación.';
END
GO

IF OBJECT_ID('dbo.factura', 'U') IS NULL
BEGIN
    CREATE TABLE dbo.factura (
        id_factura INT IDENTITY(1,1) PRIMARY KEY,
        numero_factura VARCHAR(50) NOT NULL UNIQUE,
        fecha_emision DATETIME DEFAULT GETDATE(),
        total DECIMAL(12,2) NOT NULL,
        estado VARCHAR(50) NOT NULL,
        id_venta INT NOT NULL,
        CONSTRAINT fk_factura_venta FOREIGN KEY (id_venta) REFERENCES dbo.venta(id_venta)
    );
    CREATE INDEX idx_factura_venta ON dbo.factura(id_venta);
END
GO