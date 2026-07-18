-- ==============================================================================
-- TABLA: INVENTARIO
-- Descripción: Control de stock de productos segmentado por sucursal.
-- ==============================================================================
IF OBJECT_ID('dbo.inventario', 'U') IS NOT NULL
BEGIN
    IF NOT EXISTS (SELECT 1 FROM dbo.inventario)
        DROP TABLE dbo.inventario;
    ELSE
        PRINT 'La tabla "inventario" contiene datos. Omitiendo eliminación.';
END
GO

IF OBJECT_ID('dbo.inventario', 'U') IS NULL
BEGIN
    CREATE TABLE dbo.inventario (
        id_inventario INT IDENTITY(1,1) PRIMARY KEY,
        id_sucursal INT NOT NULL,
        id_producto INT NOT NULL,
        stock INT NOT NULL DEFAULT 0,
        CONSTRAINT fk_inventario_sucursal FOREIGN KEY (id_sucursal) REFERENCES dbo.sucursal(id_sucursal),
        CONSTRAINT fk_inventario_producto FOREIGN KEY (id_producto) REFERENCES dbo.producto(id_producto)
    );
    CREATE INDEX idx_inventario_sucursal ON dbo.inventario(id_sucursal);
    CREATE INDEX idx_inventario_producto ON dbo.inventario(id_producto);
END
GO