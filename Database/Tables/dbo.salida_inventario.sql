IF OBJECT_ID('dbo.salida_inventario','U') IS NULL
BEGIN
 CREATE TABLE dbo.salida_inventario(id_salida INT IDENTITY(1,1) PRIMARY KEY,numero_salida VARCHAR(30) NOT NULL UNIQUE,id_sucursal INT NOT NULL,id_usuario INT NULL,fecha DATETIME NOT NULL CONSTRAINT df_salida_fecha DEFAULT GETDATE(),motivo VARCHAR(40) NOT NULL,observaciones VARCHAR(500) NULL,CONSTRAINT fk_salida_sucursal FOREIGN KEY(id_sucursal) REFERENCES dbo.sucursal(id_sucursal),CONSTRAINT fk_salida_usuario FOREIGN KEY(id_usuario) REFERENCES dbo.usuario(id_usuario));
 CREATE INDEX idx_salida_sucursal_fecha ON dbo.salida_inventario(id_sucursal,fecha DESC);
END
GO
IF OBJECT_ID('dbo.detalle_salida_inventario','U') IS NULL
BEGIN
 CREATE TABLE dbo.detalle_salida_inventario(id_detalle_salida INT IDENTITY(1,1) PRIMARY KEY,id_salida INT NOT NULL,id_producto INT NOT NULL,cantidad INT NOT NULL,CONSTRAINT fk_detalle_salida FOREIGN KEY(id_salida) REFERENCES dbo.salida_inventario(id_salida),CONSTRAINT fk_detalle_salida_producto FOREIGN KEY(id_producto) REFERENCES dbo.producto(id_producto),CONSTRAINT ck_detalle_salida_cantidad CHECK(cantidad>0));
END
GO
