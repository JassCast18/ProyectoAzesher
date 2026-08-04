-- Catálogo dinámico de monedas disponibles para pagos.
IF OBJECT_ID('dbo.moneda', 'U') IS NULL
BEGIN
    CREATE TABLE dbo.moneda (
        id_moneda INT IDENTITY(1,1) PRIMARY KEY,
        codigo VARCHAR(10) NOT NULL,
        nombre VARCHAR(100) NOT NULL,
        simbolo VARCHAR(10) NOT NULL,
        activo BIT NOT NULL CONSTRAINT df_moneda_activo DEFAULT 1,
        CONSTRAINT uq_moneda_codigo UNIQUE (codigo)
    );
END
GO
