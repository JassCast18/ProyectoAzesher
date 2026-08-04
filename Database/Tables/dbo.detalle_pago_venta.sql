-- Datos complementarios del método de pago utilizado en una venta.
IF OBJECT_ID('dbo.detalle_pago_venta', 'U') IS NULL
BEGIN
    CREATE TABLE dbo.detalle_pago_venta (
        id_detalle_pago INT IDENTITY(1,1) PRIMARY KEY,
        id_venta INT NOT NULL,
        id_moneda INT NULL,
        id_tipo_pos INT NULL,
        fecha_transferencia DATE NULL,
        comprobante_transferencia VARBINARY(MAX) NULL,
        comprobante_mime VARCHAR(100) NULL,
        CONSTRAINT uq_detalle_pago_venta UNIQUE (id_venta),
        CONSTRAINT fk_detalle_pago_venta FOREIGN KEY (id_venta) REFERENCES dbo.venta(id_venta),
        CONSTRAINT fk_detalle_pago_moneda FOREIGN KEY (id_moneda) REFERENCES dbo.moneda(id_moneda),
        CONSTRAINT fk_detalle_pago_pos FOREIGN KEY (id_tipo_pos) REFERENCES dbo.tipo_pos(id_tipo_pos)
    );
END
GO
