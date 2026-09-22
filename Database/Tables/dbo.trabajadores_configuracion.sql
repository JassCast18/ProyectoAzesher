IF COL_LENGTH('dbo.usuario','activo') IS NULL
    ALTER TABLE dbo.usuario ADD activo BIT NOT NULL CONSTRAINT df_usuario_activo DEFAULT 1;
IF COL_LENGTH('dbo.usuario','correo') IS NULL ALTER TABLE dbo.usuario ADD correo VARCHAR(150) NULL;
IF COL_LENGTH('dbo.usuario','apellidos') IS NULL ALTER TABLE dbo.usuario ADD apellidos VARCHAR(150) NULL;
IF COL_LENGTH('dbo.usuario','telefono') IS NULL ALTER TABLE dbo.usuario ADD telefono VARCHAR(20) NULL;
IF COL_LENGTH('dbo.usuario','fecha_expiracion_password') IS NULL ALTER TABLE dbo.usuario ADD fecha_expiracion_password DATE NULL;
IF COL_LENGTH('dbo.usuario','requiere_cambio_password') IS NULL ALTER TABLE dbo.usuario ADD requiere_cambio_password BIT NOT NULL CONSTRAINT df_usuario_cambio_password DEFAULT 0;
GO

IF COL_LENGTH('dbo.vendedor','correo') IS NULL ALTER TABLE dbo.vendedor ADD correo VARCHAR(150) NULL;
IF COL_LENGTH('dbo.vendedor','dpi') IS NULL ALTER TABLE dbo.vendedor ADD dpi VARCHAR(20) NULL;
IF COL_LENGTH('dbo.vendedor','puesto') IS NULL ALTER TABLE dbo.vendedor ADD puesto VARCHAR(80) NULL;
IF COL_LENGTH('dbo.vendedor','fecha_ingreso') IS NULL ALTER TABLE dbo.vendedor ADD fecha_ingreso DATE NULL;
IF COL_LENGTH('dbo.vendedor','activo') IS NULL ALTER TABLE dbo.vendedor ADD activo BIT NOT NULL CONSTRAINT df_vendedor_activo DEFAULT 1;
GO

IF OBJECT_ID('dbo.modulo_sistema','U') IS NULL
BEGIN
    CREATE TABLE dbo.modulo_sistema(
        id_modulo INT IDENTITY(1,1) PRIMARY KEY,
        codigo VARCHAR(40) NOT NULL UNIQUE,
        nombre VARCHAR(80) NOT NULL,
        orden INT NOT NULL,
        activo BIT NOT NULL CONSTRAINT df_modulo_sistema_activo DEFAULT 1
    );
END
GO

IF OBJECT_ID('dbo.usuario_modulo','U') IS NULL
BEGIN
    CREATE TABLE dbo.usuario_modulo(
        id_usuario INT NOT NULL,
        id_modulo INT NOT NULL,
        CONSTRAINT pk_usuario_modulo PRIMARY KEY(id_usuario,id_modulo),
        CONSTRAINT fk_usuario_modulo_usuario FOREIGN KEY(id_usuario) REFERENCES dbo.usuario(id_usuario),
        CONSTRAINT fk_usuario_modulo_modulo FOREIGN KEY(id_modulo) REFERENCES dbo.modulo_sistema(id_modulo)
    );
END
GO

IF OBJECT_ID('dbo.evaluacion_trabajador','U') IS NULL
BEGIN
    CREATE TABLE dbo.evaluacion_trabajador(
        id_evaluacion INT IDENTITY(1,1) PRIMARY KEY,
        id_vendedor INT NOT NULL,
        fecha DATETIME NOT NULL CONSTRAINT df_evaluacion_trabajador_fecha DEFAULT GETDATE(),
        periodo_desde DATE NOT NULL,
        periodo_hasta DATE NOT NULL,
        puntualidad TINYINT NOT NULL,
        servicio_cliente TINYINT NOT NULL,
        cumplimiento_metas TINYINT NOT NULL,
        trabajo_equipo TINYINT NOT NULL,
        observaciones VARCHAR(800) NULL,
        id_usuario INT NOT NULL,
        CONSTRAINT fk_evaluacion_trabajador_vendedor FOREIGN KEY(id_vendedor) REFERENCES dbo.vendedor(id_vendedor),
        CONSTRAINT fk_evaluacion_trabajador_usuario FOREIGN KEY(id_usuario) REFERENCES dbo.usuario(id_usuario),
        CONSTRAINT ck_evaluacion_trabajador_fechas CHECK(periodo_hasta>=periodo_desde),
        CONSTRAINT ck_evaluacion_trabajador_puntajes CHECK(puntualidad BETWEEN 1 AND 5 AND servicio_cliente BETWEEN 1 AND 5 AND cumplimiento_metas BETWEEN 1 AND 5 AND trabajo_equipo BETWEEN 1 AND 5)
    );
    CREATE INDEX idx_evaluacion_trabajador_vendedor ON dbo.evaluacion_trabajador(id_vendedor,fecha DESC);
END
GO

IF OBJECT_ID('dbo.evaluacion_trabajador_pregunta','U') IS NULL
BEGIN
    CREATE TABLE dbo.evaluacion_trabajador_pregunta(
        id_respuesta INT IDENTITY(1,1) PRIMARY KEY,
        id_evaluacion INT NOT NULL,
        pregunta VARCHAR(180) NOT NULL,
        puntuacion TINYINT NOT NULL,
        CONSTRAINT fk_evaluacion_pregunta_evaluacion FOREIGN KEY(id_evaluacion) REFERENCES dbo.evaluacion_trabajador(id_evaluacion),
        CONSTRAINT ck_evaluacion_pregunta_puntuacion CHECK(puntuacion BETWEEN 1 AND 5)
    );
    CREATE INDEX idx_evaluacion_pregunta_evaluacion ON dbo.evaluacion_trabajador_pregunta(id_evaluacion);
END
GO

IF OBJECT_ID('dbo.historial_trabajador','U') IS NULL
BEGIN
    CREATE TABLE dbo.historial_trabajador(
        id_historial INT IDENTITY(1,1) PRIMARY KEY,
        id_vendedor INT NOT NULL,
        fecha DATETIME NOT NULL CONSTRAINT df_historial_trabajador_fecha DEFAULT GETDATE(),
        tipo VARCHAR(40) NOT NULL,
        detalle VARCHAR(600) NULL,
        estado VARCHAR(30) NULL,
        id_sucursal INT NULL,
        id_usuario INT NULL,
        CONSTRAINT fk_historial_trabajador_vendedor FOREIGN KEY(id_vendedor) REFERENCES dbo.vendedor(id_vendedor),
        CONSTRAINT fk_historial_trabajador_sucursal FOREIGN KEY(id_sucursal) REFERENCES dbo.sucursal(id_sucursal),
        CONSTRAINT fk_historial_trabajador_usuario FOREIGN KEY(id_usuario) REFERENCES dbo.usuario(id_usuario)
    );
    CREATE INDEX idx_historial_trabajador_fecha ON dbo.historial_trabajador(id_vendedor,fecha DESC);
END
GO

INSERT dbo.historial_trabajador(id_vendedor,fecha,tipo,detalle,estado,id_sucursal)
SELECT v.id_vendedor,COALESCE(CONVERT(DATETIME,v.fecha_ingreso),GETDATE()),'Registro','Registro inicial del trabajador.',CASE WHEN v.activo=1 THEN 'Activo' ELSE 'Inactivo' END,v.id_sucursal
FROM dbo.vendedor v
WHERE NOT EXISTS(SELECT 1 FROM dbo.historial_trabajador h WHERE h.id_vendedor=v.id_vendedor AND h.tipo='Registro');
GO

IF OBJECT_ID('dbo.password_reset_token','U') IS NULL
BEGIN
    CREATE TABLE dbo.password_reset_token(
        id_token INT IDENTITY(1,1) PRIMARY KEY,
        id_usuario INT NOT NULL,
        token_hash CHAR(64) NOT NULL UNIQUE,
        fecha_creacion DATETIME2 NOT NULL CONSTRAINT df_password_reset_creacion DEFAULT SYSUTCDATETIME(),
        fecha_expiracion DATETIME2 NOT NULL,
        fecha_uso DATETIME2 NULL,
        CONSTRAINT fk_password_reset_usuario FOREIGN KEY(id_usuario) REFERENCES dbo.usuario(id_usuario)
    );
    CREATE INDEX idx_password_reset_usuario ON dbo.password_reset_token(id_usuario,fecha_expiracion DESC);
END
GO

MERGE dbo.modulo_sistema AS destino
USING (VALUES
 ('dashboard','Inicio',10),('inventarios','Inventarios',20),('ventas','Ventas',30),('caja','Control de caja',40),
 ('clientes','Clientes',50),('cobros','Cobros',60),('reportes','Reportes',70),('trabajadores','Trabajadores',80),
 ('configuracion','Configuración',90),('alertas','Alertas',100)
) AS origen(codigo,nombre,orden)
ON destino.codigo=origen.codigo
WHEN MATCHED THEN UPDATE SET nombre=origen.nombre,orden=origen.orden,activo=1
WHEN NOT MATCHED THEN INSERT(codigo,nombre,orden) VALUES(origen.codigo,origen.nombre,origen.orden);
GO
