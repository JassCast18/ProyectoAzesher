-- ==============================================================================
-- TABLA: PRODUCTO
-- Descripción: Catálogo central de todos los productos disponibles.
-- ==============================================================================
IF OBJECT_ID('dbo.producto', 'U') IS NOT NULL
BEGIN
    IF NOT EXISTS (SELECT 1 FROM dbo.producto)
        DROP TABLE dbo.producto;
    ELSE
        PRINT 'La tabla "producto" contiene datos. Omitiendo eliminación.';
END
GO

IF OBJECT_ID('dbo.producto', 'U') IS NULL
BEGIN
    CREATE TABLE dbo.producto (
        id_producto INT IDENTITY(1,1) PRIMARY KEY,
        nombre VARCHAR(150) NOT NULL,
        descripcion VARCHAR(MAX),
        precio DECIMAL(12,2) NOT NULL
    );
    CREATE INDEX idx_producto_nombre ON dbo.producto(nombre);
END
GO