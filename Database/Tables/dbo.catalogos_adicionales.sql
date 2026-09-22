IF OBJECT_ID('dbo.categoria_producto','U') IS NULL
BEGIN
    CREATE TABLE dbo.categoria_producto(
        id_categoria INT IDENTITY(1,1) PRIMARY KEY,
        nombre VARCHAR(100) NOT NULL UNIQUE,
        descripcion VARCHAR(250) NULL,
        activo BIT NOT NULL CONSTRAINT df_categoria_producto_activo DEFAULT 1
    );
END
GO

IF NOT EXISTS(SELECT 1 FROM dbo.categoria_producto WHERE nombre='General')
    INSERT dbo.categoria_producto(nombre,descripcion) VALUES('General','Productos sin una categoría específica.');
GO

IF COL_LENGTH('dbo.producto','id_categoria') IS NULL
    ALTER TABLE dbo.producto ADD id_categoria INT NULL;
GO

UPDATE dbo.producto
SET id_categoria=(SELECT TOP(1) id_categoria FROM dbo.categoria_producto WHERE nombre='General')
WHERE id_categoria IS NULL;
GO

IF NOT EXISTS(SELECT 1 FROM sys.foreign_keys WHERE name='fk_producto_categoria')
    ALTER TABLE dbo.producto ADD CONSTRAINT fk_producto_categoria FOREIGN KEY(id_categoria) REFERENCES dbo.categoria_producto(id_categoria);
GO

IF OBJECT_ID('dbo.motivo_salida_inventario','U') IS NULL
BEGIN
    CREATE TABLE dbo.motivo_salida_inventario(
        id_motivo INT IDENTITY(1,1) PRIMARY KEY,
        codigo VARCHAR(40) NOT NULL UNIQUE,
        nombre VARCHAR(100) NOT NULL,
        orden INT NOT NULL CONSTRAINT df_motivo_salida_orden DEFAULT 0,
        activo BIT NOT NULL CONSTRAINT df_motivo_salida_activo DEFAULT 1
    );
END
GO

MERGE dbo.motivo_salida_inventario AS destino
USING (VALUES
 ('danio','Daño',10),('uso_interno','Uso interno',20),('donacion','Donación',30),
 ('ajuste','Ajuste',40),('otro','Otro',50)
) AS origen(codigo,nombre,orden)
ON destino.codigo=origen.codigo
WHEN NOT MATCHED THEN INSERT(codigo,nombre,orden) VALUES(origen.codigo,origen.nombre,origen.orden);
GO

IF OBJECT_ID('dbo.pregunta_evaluacion','U') IS NULL
BEGIN
    CREATE TABLE dbo.pregunta_evaluacion(
        id_pregunta INT IDENTITY(1,1) PRIMARY KEY,
        pregunta VARCHAR(180) NOT NULL,
        orden INT NOT NULL CONSTRAINT df_pregunta_evaluacion_orden DEFAULT 0,
        activo BIT NOT NULL CONSTRAINT df_pregunta_evaluacion_activo DEFAULT 1
    );
END
GO

MERGE dbo.pregunta_evaluacion AS destino
USING (VALUES
 ('Conocimiento del producto',10),('Iniciativa y proactividad',20),
 ('Presentación personal',30),('Manejo de objeciones',40)
) AS origen(pregunta,orden)
ON destino.pregunta=origen.pregunta
WHEN NOT MATCHED THEN INSERT(pregunta,orden) VALUES(origen.pregunta,origen.orden);
GO
