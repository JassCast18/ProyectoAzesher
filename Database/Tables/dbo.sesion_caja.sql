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
        CONSTRAINT fk_sesion_caja_usuario FOREIGN KEY (id_usuario) REFERENCES dbo.usuario(id_usuario)
    );
    CREATE INDEX idx_sesion_caja_usuario ON dbo.sesion_caja(id_usuario);
END
GO