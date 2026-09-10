-- Relación muchos a muchos entre proveedores y productos suministrados.
IF OBJECT_ID('dbo.proveedor_producto','U') IS NULL
BEGIN
    CREATE TABLE dbo.proveedor_producto (
        id_proveedor INT NOT NULL,
        id_producto INT NOT NULL,
        activo BIT NOT NULL CONSTRAINT df_proveedor_producto_activo DEFAULT 1,
        fecha_asignacion DATETIME NOT NULL CONSTRAINT df_proveedor_producto_fecha DEFAULT GETDATE(),
        CONSTRAINT pk_proveedor_producto PRIMARY KEY(id_proveedor,id_producto),
        CONSTRAINT fk_proveedor_producto_proveedor FOREIGN KEY(id_proveedor) REFERENCES dbo.proveedor(id_proveedor),
        CONSTRAINT fk_proveedor_producto_producto FOREIGN KEY(id_producto) REFERENCES dbo.producto(id_producto)
    );
END
GO
