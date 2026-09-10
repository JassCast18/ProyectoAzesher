-- ==============================================================================
-- TABLA: SESION_CAJA
-- Descripción: Control de aperturas, cierres y arqueo de caja por usuario.
-- ==============================================================================
IF OBJECT_ID('dbo.sesion_caja', 'U') IS NOT NULL
BEGIN
    IF NOT EXISTS (SELECT 1 FROM dbo.sesion_caja)
        DROP TABLE dbo.sesion_caja;
    ELSE
        PRINT 'La tabla "sesion_caja" contiene datos. Omitiendo eliminación.';
END
GO

IF OBJECT_ID('dbo.sesion_caja', 'U') IS NULL
BEGIN
    CREATE TABLE dbo.sesion_caja (
        id_sesion INT IDENTITY(1,1) PRIMARY KEY,
        fecha_apertura DATETIME NOT NULL DEFAULT GETDATE(),
        fecha_cierre DATETIME,
        monto_cierre DECIMAL(12,2),
        id_usuario INT NOT NULL,
        id_sucursal INT NULL,
        monto_apertura DECIMAL(12,2) NOT NULL CONSTRAINT df_sesion_monto_apertura DEFAULT 0,
        monto_esperado DECIMAL(12,2) NULL,
        diferencia DECIMAL(12,2) NULL,
        observaciones VARCHAR(500) NULL,
        CONSTRAINT fk_sesion_caja_usuario FOREIGN KEY (id_usuario) REFERENCES dbo.usuario(id_usuario),
        CONSTRAINT fk_sesion_caja_sucursal FOREIGN KEY (id_sucursal) REFERENCES dbo.sucursal(id_sucursal)
    );
    CREATE INDEX idx_sesion_caja_usuario ON dbo.sesion_caja(id_usuario);
END
GO

IF COL_LENGTH('dbo.sesion_caja','id_sucursal') IS NULL ALTER TABLE dbo.sesion_caja ADD id_sucursal INT NULL;
IF COL_LENGTH('dbo.sesion_caja','monto_apertura') IS NULL ALTER TABLE dbo.sesion_caja ADD monto_apertura DECIMAL(12,2) NOT NULL CONSTRAINT df_sesion_monto_apertura DEFAULT 0;
IF COL_LENGTH('dbo.sesion_caja','monto_esperado') IS NULL ALTER TABLE dbo.sesion_caja ADD monto_esperado DECIMAL(12,2) NULL;
IF COL_LENGTH('dbo.sesion_caja','diferencia') IS NULL ALTER TABLE dbo.sesion_caja ADD diferencia DECIMAL(12,2) NULL;
IF COL_LENGTH('dbo.sesion_caja','observaciones') IS NULL ALTER TABLE dbo.sesion_caja ADD observaciones VARCHAR(500) NULL;
GO
IF NOT EXISTS(SELECT 1 FROM sys.foreign_keys WHERE name='fk_sesion_caja_sucursal') ALTER TABLE dbo.sesion_caja ADD CONSTRAINT fk_sesion_caja_sucursal FOREIGN KEY(id_sucursal) REFERENCES dbo.sucursal(id_sucursal);
GO
