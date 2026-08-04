-- Catálogo de terminales POS disponibles.
IF OBJECT_ID('dbo.tipo_pos', 'U') IS NULL
BEGIN
    CREATE TABLE dbo.tipo_pos (
        id_tipo_pos INT IDENTITY(1,1) PRIMARY KEY,
        nombre VARCHAR(100) NOT NULL,
        activo BIT NOT NULL CONSTRAINT df_tipo_pos_activo DEFAULT 1,
        CONSTRAINT uq_tipo_pos_nombre UNIQUE (nombre)
    );
END
GO
