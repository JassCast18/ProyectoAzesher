IF OBJECT_ID('dbo.movimiento_caja_manual', 'U') IS NULL
BEGIN
    CREATE TABLE dbo.movimiento_caja_manual (
        id_movimiento INT IDENTITY(1,1) PRIMARY KEY,
        id_sesion INT NOT NULL,
        fecha DATETIME NOT NULL CONSTRAINT df_movimiento_caja_manual_fecha DEFAULT GETDATE(),
        tipo VARCHAR(20) NOT NULL CONSTRAINT ck_movimiento_caja_manual_tipo CHECK (tipo IN ('salida')),
        concepto VARCHAR(120) NOT NULL,
        monto DECIMAL(12,2) NOT NULL CONSTRAINT ck_movimiento_caja_manual_monto CHECK (monto > 0),
        observaciones VARCHAR(500) NULL,
        id_usuario INT NOT NULL,
        CONSTRAINT fk_movimiento_caja_manual_sesion FOREIGN KEY (id_sesion) REFERENCES dbo.sesion_caja(id_sesion),
        CONSTRAINT fk_movimiento_caja_manual_usuario FOREIGN KEY (id_usuario) REFERENCES dbo.usuario(id_usuario)
    );
    CREATE INDEX idx_movimiento_caja_manual_sesion ON dbo.movimiento_caja_manual(id_sesion, fecha DESC);
END
GO
