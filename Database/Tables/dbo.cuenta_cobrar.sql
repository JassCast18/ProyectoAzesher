-- ==============================================================================
-- TABLA: CUENTA_COBRAR
-- Descripción: Registro de los saldos pendientes o créditos de ventas.
-- ==============================================================================
IF OBJECT_ID('dbo.cuenta_cobrar', 'U') IS NOT NULL
BEGIN
    IF NOT EXISTS (SELECT 1 FROM dbo.cuenta_cobrar)
        DROP TABLE dbo.cuenta_cobrar;
    ELSE
        PRINT 'La tabla "cuenta_cobrar" contiene datos. Omitiendo eliminación.';
END
GO

IF OBJECT_ID('dbo.cuenta_cobrar', 'U') IS NULL
BEGIN
    CREATE TABLE dbo.cuenta_cobrar (
        id_cuenta INT IDENTITY(1,1) PRIMARY KEY,
        id_venta INT NOT NULL,
        saldo_pendiente DECIMAL(12,2) NOT NULL,
        estado VARCHAR(50) NOT NULL,
        CONSTRAINT fk_cuenta_cobrar_venta FOREIGN KEY (id_venta) REFERENCES dbo.venta(id_venta)
    );
    CREATE INDEX idx_cuenta_cobrar_venta ON dbo.cuenta_cobrar(id_venta);
END
GO