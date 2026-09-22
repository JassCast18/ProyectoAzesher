IF OBJECT_ID('dbo.historial_estado_credito','U') IS NULL
BEGIN
    CREATE TABLE dbo.historial_estado_credito(
        id_historial INT IDENTITY(1,1) NOT NULL CONSTRAINT pk_historial_estado_credito PRIMARY KEY,
        id_cliente_credito INT NOT NULL,
        estado VARCHAR(30) NOT NULL,
        fecha DATETIME NOT NULL CONSTRAINT df_historial_estado_credito_fecha DEFAULT GETDATE(),
        id_usuario INT NULL,
        observacion VARCHAR(250) NULL,
        CONSTRAINT fk_historial_estado_credito_cliente FOREIGN KEY(id_cliente_credito) REFERENCES dbo.cliente_credito(id_cliente_credito),
        CONSTRAINT fk_historial_estado_credito_usuario FOREIGN KEY(id_usuario) REFERENCES dbo.usuario(id_usuario)
    );
    CREATE INDEX idx_historial_estado_credito_cliente_fecha ON dbo.historial_estado_credito(id_cliente_credito,fecha DESC);
END
GO

INSERT dbo.historial_estado_credito(id_cliente_credito,estado,fecha,id_usuario,observacion)
SELECT cc.id_cliente_credito,cc.estado_autorizacion,ISNULL(cc.fecha_cambio_estado,cc.fecha_autorizacion),cc.id_usuario_autorizo,'Estado inicial recuperado'
FROM dbo.cliente_credito cc
WHERE NOT EXISTS(SELECT 1 FROM dbo.historial_estado_credito h WHERE h.id_cliente_credito=cc.id_cliente_credito);
GO
