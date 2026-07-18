-- ==============================================================================
-- TABLA: DETALLE_TRASLADO
-- Descripción: Ítems y cantidades específicas movidas en un traslado.
-- ==============================================================================
IF OBJECT_ID('dbo.detalle_traslado', 'U') IS NOT NULL
BEGIN
    IF NOT EXISTS (SELECT 1 FROM dbo.detalle_traslado)
        DROP TABLE dbo.detalle_traslado;
    ELSE
        PRINT 'La tabla "detalle_traslado" contiene datos. Omitiendo eliminación.';
END
GO

IF OBJECT_ID('dbo.detalle_traslado', 'U') IS NULL
BEGIN
    CREATE TABLE dbo.detalle_traslado (
        id_detalle_traslado INT IDENTITY(1,1) PRIMARY KEY,
        id_traslado INT NOT NULL,
        id_producto INT NOT NULL,
        cantidad INT NOT NULL,
        CONSTRAINT fk_dt_traslado FOREIGN KEY (id_traslado) REFERENCES dbo.traslado(id_traslado),
        CONSTRAINT fk_dt_producto FOREIGN KEY (id_producto) REFERENCES dbo.producto(id_producto)
    );
    CREATE INDEX idx_dt_traslado_fk ON dbo.detalle_traslado(id_traslado);
    CREATE INDEX idx_dt_producto_fk ON dbo.detalle_traslado(id_producto);
END
GO