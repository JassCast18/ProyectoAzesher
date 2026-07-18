-- ==============================================================================
-- TABLA: VENDEDOR
-- Descripción: Personal encargado de gestionar las ventas.
-- ==============================================================================
IF OBJECT_ID('dbo.vendedor', 'U') IS NOT NULL
BEGIN
    IF NOT EXISTS (SELECT 1 FROM dbo.vendedor)
        DROP TABLE dbo.vendedor;
    ELSE
        PRINT 'La tabla "vendedor" contiene datos. Omitiendo eliminación.';
END
GO

IF OBJECT_ID('dbo.vendedor', 'U') IS NULL
BEGIN
    CREATE TABLE dbo.vendedor (
        id_vendedor INT IDENTITY(1,1) PRIMARY KEY,
        nombre VARCHAR(150) NOT NULL,
        telefono VARCHAR(20)
    );
    CREATE INDEX idx_vendedor_nombre ON dbo.vendedor(nombre);
END
GO