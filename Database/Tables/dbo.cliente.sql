-- ==============================================================================
-- TABLA: CLIENTE
-- Descripción: Registro de los clientes y sus datos de facturación (NIT).
-- ==============================================================================
IF OBJECT_ID('dbo.cliente', 'U') IS NOT NULL
BEGIN
    IF NOT EXISTS (SELECT 1 FROM dbo.cliente)
        DROP TABLE dbo.cliente;
    ELSE
        PRINT 'La tabla "cliente" contiene datos. Omitiendo eliminación.';
END
GO

IF OBJECT_ID('dbo.cliente', 'U') IS NULL
BEGIN
    CREATE TABLE dbo.cliente (
        id_cliente INT IDENTITY(1,1) PRIMARY KEY,
        nombre VARCHAR(150) NOT NULL,
        telefono VARCHAR(20),
        direccion VARCHAR(MAX),
        nit VARCHAR(20)
    );
    CREATE INDEX idx_cliente_nit ON dbo.cliente(nit);
    CREATE INDEX idx_cliente_nombre ON dbo.cliente(nombre);
END
GO