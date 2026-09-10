-- Colores iniciales diferenciados; posteriormente son editables desde Datos maestros.
UPDATE dbo.sucursal
SET color_identificacion = CASE
    WHEN LOWER(nombre) LIKE '%melchor%' THEN '#008BA8'
    WHEN LOWER(nombre) LIKE '%cruces%' THEN '#D97706'
    ELSE color_identificacion
END;
GO
