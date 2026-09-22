IF OBJECT_ID('dbo.bitacora','U') IS NULL
BEGIN
    CREATE TABLE dbo.bitacora(
        id_bitacora BIGINT IDENTITY(1,1) NOT NULL CONSTRAINT pk_bitacora PRIMARY KEY,
        fecha DATETIME2(0) NOT NULL CONSTRAINT df_bitacora_fecha DEFAULT SYSDATETIME(),
        id_usuario INT NULL,
        nombre_usuario VARCHAR(100) NULL,
        id_sucursal INT NULL,
        modulo VARCHAR(80) NOT NULL,
        accion VARCHAR(120) NOT NULL,
        metodo VARCHAR(10) NOT NULL,
        ruta VARCHAR(300) NOT NULL,
        resultado VARCHAR(20) NOT NULL,
        codigo_http INT NOT NULL,
        direccion_ip VARCHAR(64) NULL,
        detalle VARCHAR(500) NULL,
        CONSTRAINT fk_bitacora_usuario FOREIGN KEY(id_usuario) REFERENCES dbo.usuario(id_usuario),
        CONSTRAINT fk_bitacora_sucursal FOREIGN KEY(id_sucursal) REFERENCES dbo.sucursal(id_sucursal)
    );
    CREATE INDEX idx_bitacora_fecha ON dbo.bitacora(fecha DESC);
    CREATE INDEX idx_bitacora_usuario_fecha ON dbo.bitacora(id_usuario,fecha DESC);
    CREATE INDEX idx_bitacora_modulo_fecha ON dbo.bitacora(modulo,fecha DESC);
END
GO

IF COL_LENGTH('dbo.bitacora','nombre_usuario') IS NULL ALTER TABLE dbo.bitacora ADD nombre_usuario VARCHAR(100) NULL;
IF COL_LENGTH('dbo.bitacora','id_sucursal') IS NULL ALTER TABLE dbo.bitacora ADD id_sucursal INT NULL;
IF COL_LENGTH('dbo.bitacora','modulo') IS NULL ALTER TABLE dbo.bitacora ADD modulo VARCHAR(80) NOT NULL CONSTRAINT df_bitacora_modulo DEFAULT 'sistema';
IF COL_LENGTH('dbo.bitacora','metodo') IS NULL ALTER TABLE dbo.bitacora ADD metodo VARCHAR(10) NOT NULL CONSTRAINT df_bitacora_metodo DEFAULT 'LEGACY';
IF COL_LENGTH('dbo.bitacora','ruta') IS NULL ALTER TABLE dbo.bitacora ADD ruta VARCHAR(300) NOT NULL CONSTRAINT df_bitacora_ruta DEFAULT '/';
IF COL_LENGTH('dbo.bitacora','resultado') IS NULL ALTER TABLE dbo.bitacora ADD resultado VARCHAR(20) NOT NULL CONSTRAINT df_bitacora_resultado DEFAULT 'Exitoso';
IF COL_LENGTH('dbo.bitacora','codigo_http') IS NULL ALTER TABLE dbo.bitacora ADD codigo_http INT NOT NULL CONSTRAINT df_bitacora_codigo DEFAULT 200;
IF COL_LENGTH('dbo.bitacora','direccion_ip') IS NULL ALTER TABLE dbo.bitacora ADD direccion_ip VARCHAR(64) NULL;
IF COL_LENGTH('dbo.bitacora','detalle') IS NULL ALTER TABLE dbo.bitacora ADD detalle VARCHAR(500) NULL;
GO

IF EXISTS(SELECT 1 FROM sys.columns WHERE object_id=OBJECT_ID('dbo.bitacora') AND name='id_usuario' AND is_nullable=0)
    ALTER TABLE dbo.bitacora ALTER COLUMN id_usuario INT NULL;
GO

IF NOT EXISTS(SELECT 1 FROM sys.foreign_keys WHERE name='fk_bitacora_sucursal')
    ALTER TABLE dbo.bitacora ADD CONSTRAINT fk_bitacora_sucursal FOREIGN KEY(id_sucursal) REFERENCES dbo.sucursal(id_sucursal);
IF NOT EXISTS(SELECT 1 FROM sys.indexes WHERE name='idx_bitacora_fecha' AND object_id=OBJECT_ID('dbo.bitacora')) CREATE INDEX idx_bitacora_fecha ON dbo.bitacora(fecha DESC);
IF NOT EXISTS(SELECT 1 FROM sys.indexes WHERE name='idx_bitacora_usuario_fecha' AND object_id=OBJECT_ID('dbo.bitacora')) CREATE INDEX idx_bitacora_usuario_fecha ON dbo.bitacora(id_usuario,fecha DESC);
IF NOT EXISTS(SELECT 1 FROM sys.indexes WHERE name='idx_bitacora_modulo_fecha' AND object_id=OBJECT_ID('dbo.bitacora')) CREATE INDEX idx_bitacora_modulo_fecha ON dbo.bitacora(modulo,fecha DESC);
GO
