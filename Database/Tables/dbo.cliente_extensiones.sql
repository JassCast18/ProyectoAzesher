IF COL_LENGTH('dbo.cliente','fecha_nacimiento') IS NULL
    ALTER TABLE dbo.cliente ADD fecha_nacimiento DATE NULL;
GO
