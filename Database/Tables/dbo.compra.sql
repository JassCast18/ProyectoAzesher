-- ==============================================================================
-- TABLA: COMPRA
-- Descripción: Registro maestro de las compras realizadas a proveedores.
-- ==============================================================================
IF OBJECT_ID('dbo.compra', 'U') IS NOT NULL
BEGIN
    IF NOT EXISTS (SELECT 1 FROM dbo.compra)
        DROP TABLE dbo.compra;
    ELSE
        PRINT 'La tabla "compra" contiene datos. Omitiendo eliminación.';
END
GO

IF OBJECT_ID('dbo.compra', 'U') IS NULL
BEGIN
    CREATE TABLE dbo.compra (
        id_compra INT IDENTITY(1,1) PRIMARY KEY,
        fecha DATETIME DEFAULT GETDATE(),
        total DECIMAL(12,2) NOT NULL,
        id_proveedor INT NOT NULL,
        id_sucursal INT NOT NULL,
        numero_pedido VARCHAR(50) NULL,
        metodo_pago VARCHAR(30) NOT NULL CONSTRAINT df_compra_metodo_pago DEFAULT 'credito',
        observaciones VARCHAR(500) NULL,
        id_sesion INT NULL,
        CONSTRAINT fk_compra_proveedor FOREIGN KEY (id_proveedor) REFERENCES dbo.proveedor(id_proveedor),
        CONSTRAINT fk_compra_sucursal FOREIGN KEY (id_sucursal) REFERENCES dbo.sucursal(id_sucursal),
        CONSTRAINT fk_compra_sesion FOREIGN KEY (id_sesion) REFERENCES dbo.sesion_caja(id_sesion)
    );
    CREATE INDEX idx_compra_proveedor ON dbo.compra(id_proveedor);
    CREATE INDEX idx_compra_sucursal_fecha ON dbo.compra(id_sucursal, fecha);
END
GO

IF COL_LENGTH('dbo.compra', 'id_sucursal') IS NULL
    ALTER TABLE dbo.compra ADD id_sucursal INT NULL;
IF COL_LENGTH('dbo.compra', 'numero_pedido') IS NULL
    ALTER TABLE dbo.compra ADD numero_pedido VARCHAR(50) NULL;
IF COL_LENGTH('dbo.compra', 'metodo_pago') IS NULL
    ALTER TABLE dbo.compra ADD metodo_pago VARCHAR(30) NOT NULL CONSTRAINT df_compra_metodo_pago DEFAULT 'credito';
IF COL_LENGTH('dbo.compra', 'observaciones') IS NULL
    ALTER TABLE dbo.compra ADD observaciones VARCHAR(500) NULL;
IF COL_LENGTH('dbo.compra', 'id_sesion') IS NULL
    ALTER TABLE dbo.compra ADD id_sesion INT NULL;
GO

IF NOT EXISTS (SELECT 1 FROM sys.foreign_keys WHERE name = 'fk_compra_sucursal' AND parent_object_id = OBJECT_ID('dbo.compra'))
    ALTER TABLE dbo.compra ADD CONSTRAINT fk_compra_sucursal FOREIGN KEY (id_sucursal) REFERENCES dbo.sucursal(id_sucursal);
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'idx_compra_sucursal_fecha' AND object_id = OBJECT_ID('dbo.compra'))
    CREATE INDEX idx_compra_sucursal_fecha ON dbo.compra(id_sucursal, fecha);
IF NOT EXISTS (SELECT 1 FROM sys.foreign_keys WHERE name = 'fk_compra_sesion' AND parent_object_id = OBJECT_ID('dbo.compra'))
    ALTER TABLE dbo.compra ADD CONSTRAINT fk_compra_sesion FOREIGN KEY (id_sesion) REFERENCES dbo.sesion_caja(id_sesion);
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'idx_compra_sesion' AND object_id = OBJECT_ID('dbo.compra'))
    CREATE INDEX idx_compra_sesion ON dbo.compra(id_sesion);
GO
