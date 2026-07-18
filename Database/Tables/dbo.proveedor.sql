-- ==============================================================================
-- TABLA: PROVEEDOR
-- Descripción: Información de los proveedores que suministran los productos.
-- ==============================================================================
IF OBJECT_ID('dbo.proveedor', 'U') IS NOT NULL
BEGIN
    IF NOT EXISTS (SELECT 1 FROM dbo.proveedor)
        DROP TABLE dbo.proveedor;
    ELSE
        PRINT 'La tabla "proveedor" contiene datos. Omitiendo eliminación.';
END
GO

IF OBJECT_ID('dbo.proveedor', 'U') IS NULL
BEGIN
    CREATE TABLE dbo.proveedor (
        id_proveedor INT IDENTITY(1,1) PRIMARY KEY,
        nombre VARCHAR(150) NOT NULL,
        telefono VARCHAR(20),
        direccion VARCHAR(MAX)
    );
    CREATE INDEX idx_proveedor_nombre ON dbo.proveedor(nombre);
END
GO