-- ==============================================================================
-- TABLA: VENTA
-- Descripción: Encabezado general de las ventas realizadas.
-- ==============================================================================
IF OBJECT_ID('dbo.venta', 'U') IS NOT NULL
BEGIN
    IF NOT EXISTS (SELECT 1 FROM dbo.venta)
        DROP TABLE dbo.venta;
    ELSE
        PRINT 'La tabla "venta" contiene datos. Omitiendo eliminación.';
END
GO

IF OBJECT_ID('dbo.venta', 'U') IS NULL
BEGIN
    CREATE TABLE dbo.venta (
        id_venta INT IDENTITY(1,1) PRIMARY KEY,
        fecha DATETIME DEFAULT GETDATE(),
        total DECIMAL(12,2) NOT NULL,
        tipo_pago VARCHAR(50) NOT NULL,
        id_cliente INT NOT NULL,
        id_vendedor INT NOT NULL,
        id_sesion INT NOT NULL,
        CONSTRAINT fk_venta_cliente FOREIGN KEY (id_cliente) REFERENCES dbo.cliente(id_cliente),
        CONSTRAINT fk_venta_vendedor FOREIGN KEY (id_vendedor) REFERENCES dbo.vendedor(id_vendedor),
        CONSTRAINT fk_venta_sesion FOREIGN KEY (id_sesion) REFERENCES dbo.sesion_caja(id_sesion)
    );
    CREATE INDEX idx_venta_cliente ON dbo.venta(id_cliente);
    CREATE INDEX idx_venta_vendedor ON dbo.venta(id_vendedor);
    CREATE INDEX idx_venta_sesion ON dbo.venta(id_sesion);
END
GO