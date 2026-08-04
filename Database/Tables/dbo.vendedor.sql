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
        telefono VARCHAR(20),
        id_sucursal INT NULL,
        CONSTRAINT fk_vendedor_sucursal FOREIGN KEY (id_sucursal) REFERENCES dbo.sucursal(id_sucursal)
    );
    CREATE INDEX idx_vendedor_nombre ON dbo.vendedor(nombre);
    CREATE INDEX idx_vendedor_sucursal ON dbo.vendedor(id_sucursal);
END
GO

IF COL_LENGTH('dbo.vendedor', 'id_sucursal') IS NULL
    ALTER TABLE dbo.vendedor ADD id_sucursal INT NULL;
GO

IF NOT EXISTS (SELECT 1 FROM sys.foreign_keys WHERE name = 'fk_vendedor_sucursal' AND parent_object_id = OBJECT_ID('dbo.vendedor'))
    ALTER TABLE dbo.vendedor ADD CONSTRAINT fk_vendedor_sucursal FOREIGN KEY (id_sucursal) REFERENCES dbo.sucursal(id_sucursal);
GO

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'idx_vendedor_sucursal' AND object_id = OBJECT_ID('dbo.vendedor'))
    CREATE INDEX idx_vendedor_sucursal ON dbo.vendedor(id_sucursal);
GO
