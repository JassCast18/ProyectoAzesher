-- ==============================================================================
-- TABLA: USUARIO
-- Descripción: Usuarios del sistema con credenciales y roles asignados.
-- ==============================================================================
IF OBJECT_ID('dbo.usuario', 'U') IS NOT NULL
BEGIN
    IF NOT EXISTS (SELECT 1 FROM dbo.usuario)
        DROP TABLE dbo.usuario;
    ELSE
        PRINT 'La tabla "usuario" contiene datos. Omitiendo eliminación.';
END
GO

IF OBJECT_ID('dbo.usuario', 'U') IS NULL
BEGIN
    CREATE TABLE dbo.usuario (
        id_usuario INT IDENTITY(1,1) PRIMARY KEY,
        nombre VARCHAR(150) NOT NULL,
        username VARCHAR(50) NOT NULL UNIQUE,
        password VARCHAR(255) NOT NULL,
        rol VARCHAR(50) NOT NULL,
        id_sucursal INT NULL,
        CONSTRAINT fk_usuario_sucursal FOREIGN KEY (id_sucursal) REFERENCES dbo.sucursal(id_sucursal)
    );
    CREATE INDEX idx_usuario_sucursal ON dbo.usuario(id_sucursal);
    CREATE INDEX idx_usuario_username ON dbo.usuario(username);
END
GO

ALTER TABLE dbo.usuario --Permitir que existan usuarios sin restriccion de sucursal (globales)
ALTER COLUMN id_sucursal INT NULL;
GO