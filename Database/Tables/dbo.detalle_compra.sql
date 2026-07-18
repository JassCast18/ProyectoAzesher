-- ==============================================================================
-- TABLA: DETALLE_COMPRA
-- Descripción: Productos adquiridos en cada transacción de compra.
-- ==============================================================================
IF OBJECT_ID('dbo.detalle_compra', 'U') IS NOT NULL
BEGIN
    IF NOT EXISTS (SELECT 1 FROM dbo.detalle_compra)
        DROP TABLE dbo.detalle_compra;
    ELSE
        PRINT 'La tabla "detalle_compra" contiene datos. Omitiendo eliminación.';
END
GO

IF OBJECT_ID('dbo.detalle_compra', 'U') IS NULL
BEGIN
    CREATE TABLE dbo.detalle_compra (
        id_detalle_compra INT IDENTITY(1,1) PRIMARY KEY,
        id_compra INT NOT NULL,
        id_producto INT NOT NULL,
        cantidad INT NOT NULL,
        costo_unitario DECIMAL(12,2) NOT NULL,
        subtotal DECIMAL(12,2) NOT NULL,
        CONSTRAINT fk_dc_compra FOREIGN KEY (id_compra) REFERENCES dbo.compra(id_compra),
        CONSTRAINT fk_dc_producto FOREIGN KEY (id_producto) REFERENCES dbo.producto(id_producto)
    );
    CREATE INDEX idx_dc_compra_fk ON dbo.detalle_compra(id_compra);
    CREATE INDEX idx_dc_producto_fk ON dbo.detalle_compra(id_producto);
END
GO