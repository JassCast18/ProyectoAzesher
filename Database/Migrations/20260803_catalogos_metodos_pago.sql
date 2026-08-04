-- Datos iniciales. La estructura de estos catálogos vive en Database/Tables.
IF NOT EXISTS (SELECT 1 FROM dbo.moneda WHERE codigo = 'GTQ')
    INSERT INTO dbo.moneda (codigo, nombre, simbolo) VALUES ('GTQ', 'Quetzal', 'Q');
IF NOT EXISTS (SELECT 1 FROM dbo.moneda WHERE codigo = 'BZD')
    INSERT INTO dbo.moneda (codigo, nombre, simbolo) VALUES ('BZD', 'Dólar beliceño', 'BZ$');
GO

IF NOT EXISTS (SELECT 1 FROM dbo.tipo_pos WHERE nombre = 'BAC')
    INSERT INTO dbo.tipo_pos (nombre) VALUES ('BAC');
IF NOT EXISTS (SELECT 1 FROM dbo.tipo_pos WHERE nombre = 'VISA')
    INSERT INTO dbo.tipo_pos (nombre) VALUES ('VISA');
GO
