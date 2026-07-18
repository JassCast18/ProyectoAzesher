-- ==============================================================================
-- TABLA: DETALLE_VENTA
-- Descripción: Relación de ítems, cantidades y precios por cada venta.
-- ==============================================================================
IF OBJECT_ID('dbo.detalle_venta', 'U') IS NOT NULL
BEGIN
    IF NOT EXISTS (SELECT 1 FROM dbo.detalle_venta)
        DROP TABLE dbo.detalle_venta;
    ELSE
        PRINT 'La tabla "detalle_venta" contiene datos. Omitiendo eliminación.';
END
GO

IF OBJECT_ID('dbo.detalle_venta', 'U') IS NULL
BEGIN
    CREATE TABLE dbo.detalle_venta (
        id_detalle INT IDENTITY(1,1) PRIMARY KEY,
        id_venta INT NOT NULL,
        id_producto INT NOT NULL,
        cantidad INT NOT NULL,
        precio_unitario DECIMAL(12,2) NOT NULL,
        subtotal DECIMAL(12,2) NOT NULL,
        CONSTRAINT fk_dv_venta FOREIGN KEY (id_venta) REFERENCES dbo.venta(id_venta),
        CONSTRAINT fk_dv_producto FOREIGN KEY (id_producto) REFERENCES dbo.producto(id_producto)
    );
    CREATE INDEX idx_dv_venta_fk ON dbo.detalle_venta(id_venta);
    CREATE INDEX idx_dv_producto_fk ON dbo.detalle_venta(id_producto);
END
GO