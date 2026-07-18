-- ==============================================================================
-- TABLA: COMPRA
-- Descripción: Registro maestro de las compras realizadas a proveedores.
-- ==============================================================================
IF OBJECT_ID('dbo.compra', 'U') IS NOT NULL
BEGIN
    IF NOT EXISTS (SELECT 1 FROM dbo.compra)
        DROP TABLE dbo.compra;
    ELSE
        PRINT 'La tabla "compra" contiene datos. Omitiendo eliminación.';
END
GO

IF OBJECT_ID('dbo.compra', 'U') IS NULL
BEGIN
    CREATE TABLE dbo.compra (
        id_compra INT IDENTITY(1,1) PRIMARY KEY,
        fecha DATETIME DEFAULT GETDATE(),
        total DECIMAL(12,2) NOT NULL,
        id_proveedor INT NOT NULL,
        CONSTRAINT fk_compra_proveedor FOREIGN KEY (id_proveedor) REFERENCES dbo.proveedor(id_proveedor)
    );
    CREATE INDEX idx_compra_proveedor ON dbo.compra(id_proveedor);
END
GO