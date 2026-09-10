-- ==============================================================================
-- TABLA: SUCURSAL
-- Descripción: Catálogo principal de las sucursales donde opera el negocio.
-- ==============================================================================
IF OBJECT_ID('dbo.sucursal', 'U') IS NOT NULL
BEGIN
    IF NOT EXISTS (SELECT 1 FROM dbo.sucursal)
        DROP TABLE dbo.sucursal;
    ELSE
        PRINT 'La tabla "sucursal" contiene datos. Omitiendo eliminación.';
END
GO

IF OBJECT_ID('dbo.sucursal', 'U') IS NULL
BEGIN
    CREATE TABLE dbo.sucursal (
        id_sucursal INT IDENTITY(1,1) PRIMARY KEY,
        nombre VARCHAR(150) NOT NULL,
        direccion VARCHAR(MAX),
        telefono VARCHAR(20),
        color_identificacion VARCHAR(7) NOT NULL CONSTRAINT df_sucursal_color DEFAULT '#008BA8'
    );
    CREATE INDEX idx_sucursal_nombre ON dbo.sucursal(nombre);
END
GO

IF COL_LENGTH('dbo.sucursal', 'color_identificacion') IS NULL
    ALTER TABLE dbo.sucursal ADD color_identificacion VARCHAR(7) NOT NULL CONSTRAINT df_sucursal_color DEFAULT '#008BA8';
GO
