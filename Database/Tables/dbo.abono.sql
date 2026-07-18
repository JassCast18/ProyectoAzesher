-- ==============================================================================
-- TABLA: ABONO
-- Descripción: Movimientos y pagos parciales a cuentas por cobrar.
-- ==============================================================================
IF OBJECT_ID('dbo.abono', 'U') IS NOT NULL
BEGIN
    IF NOT EXISTS (SELECT 1 FROM dbo.abono)
        DROP TABLE dbo.abono;
    ELSE
        PRINT 'La tabla "abono" contiene datos. Omitiendo eliminación.';
END
GO

IF OBJECT_ID('dbo.abono', 'U') IS NULL
BEGIN
    CREATE TABLE dbo.abono (
        id_abono INT IDENTITY(1,1) PRIMARY KEY,
        id_cuenta INT NOT NULL,
        fecha DATETIME DEFAULT GETDATE(),
        monto DECIMAL(12,2) NOT NULL,
        CONSTRAINT fk_abono_cuenta FOREIGN KEY (id_cuenta) REFERENCES dbo.cuenta_cobrar(id_cuenta)
    );
    CREATE INDEX idx_abono_cuenta ON dbo.abono(id_cuenta);
END
GO