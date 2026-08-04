-- Calendario de cuotas generado para una cuenta por cobrar.
IF OBJECT_ID('dbo.cuota_cuenta_cobrar', 'U') IS NULL
BEGIN
    CREATE TABLE dbo.cuota_cuenta_cobrar (
        id_cuota INT IDENTITY(1,1) PRIMARY KEY,
        id_cuenta INT NOT NULL,
        numero_cuota INT NOT NULL,
        fecha_vencimiento DATE NOT NULL,
        monto DECIMAL(12,2) NOT NULL,
        estado VARCHAR(30) NOT NULL CONSTRAINT df_cuota_estado DEFAULT 'Pendiente',
        CONSTRAINT fk_cuota_cuenta FOREIGN KEY (id_cuenta) REFERENCES dbo.cuenta_cobrar(id_cuenta),
        CONSTRAINT uq_cuota_cuenta_numero UNIQUE (id_cuenta, numero_cuota)
    );
END
GO

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'idx_cuota_fecha' AND object_id = OBJECT_ID('dbo.cuota_cuenta_cobrar'))
    CREATE INDEX idx_cuota_fecha ON dbo.cuota_cuenta_cobrar(fecha_vencimiento, estado);
GO
