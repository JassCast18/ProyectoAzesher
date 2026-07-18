-- ==============================================================================
-- TABLA: BITACORA
-- Descripción: Registro de auditoría de acciones efectuadas por los usuarios.
-- ==============================================================================
IF OBJECT_ID('dbo.bitacora', 'U') IS NOT NULL
BEGIN
    IF NOT EXISTS (SELECT 1 FROM dbo.bitacora)
        DROP TABLE dbo.bitacora;
    ELSE
        PRINT 'La tabla "bitacora" contiene datos. Omitiendo eliminación.';
END
GO

IF OBJECT_ID('dbo.bitacora', 'U') IS NULL
BEGIN
    CREATE TABLE dbo.bitacora (
        id_bitacora INT IDENTITY(1,1) PRIMARY KEY,
        fecha DATETIME DEFAULT GETDATE(),
        accion VARCHAR(255) NOT NULL,
        id_usuario INT NOT NULL,
        CONSTRAINT fk_bitacora_usuario FOREIGN KEY (id_usuario) REFERENCES dbo.usuario(id_usuario)
    );
    CREATE INDEX idx_bitacora_usuario ON dbo.bitacora(id_usuario);
END
GO