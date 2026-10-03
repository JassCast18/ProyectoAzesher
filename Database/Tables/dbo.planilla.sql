-- Configuracion salarial y bonos de planilla para trabajadores.
IF OBJECT_ID('dbo.bono_planilla', 'U') IS NULL
BEGIN
    CREATE TABLE dbo.bono_planilla (
        id_bono INT IDENTITY(1,1) NOT NULL CONSTRAINT pk_bono_planilla PRIMARY KEY,
        codigo VARCHAR(40) NOT NULL,
        nombre VARCHAR(120) NOT NULL,
        descripcion VARCHAR(500) NULL,
        tipo_calculo VARCHAR(30) NOT NULL,
        porcentaje DECIMAL(7,4) NULL,
        meta_minima DECIMAL(14,2) NULL,
        monto_bono DECIMAL(12,2) NULL,
        activo BIT NOT NULL CONSTRAINT df_bono_planilla_activo DEFAULT 1,
        fecha_creacion DATETIME2 NOT NULL CONSTRAINT df_bono_planilla_fecha DEFAULT SYSDATETIME(),
        CONSTRAINT uq_bono_planilla_codigo UNIQUE (codigo),
        CONSTRAINT ck_bono_planilla_tipo CHECK (tipo_calculo IN ('PORCENTAJE_VENTAS','META_MONTO_VENTAS','META_CANTIDAD_VENTAS','MONTO_FIJO')),
        CONSTRAINT ck_bono_planilla_porcentaje CHECK (porcentaje IS NULL OR porcentaje > 0),
        CONSTRAINT ck_bono_planilla_meta CHECK (meta_minima IS NULL OR meta_minima > 0),
        CONSTRAINT ck_bono_planilla_monto CHECK (monto_bono IS NULL OR monto_bono > 0)
    );
END
GO

IF OBJECT_ID('dbo.configuracion_pago_trabajador', 'U') IS NULL
BEGIN
    CREATE TABLE dbo.configuracion_pago_trabajador (
        id_vendedor INT NOT NULL CONSTRAINT pk_configuracion_pago_trabajador PRIMARY KEY,
        salario_mensual DECIMAL(12,2) NOT NULL CONSTRAINT df_configuracion_pago_salario DEFAULT 3500.00,
        fecha_actualizacion DATETIME2 NOT NULL CONSTRAINT df_configuracion_pago_fecha DEFAULT SYSDATETIME(),
        id_usuario_actualizacion INT NULL,
        CONSTRAINT fk_configuracion_pago_vendedor FOREIGN KEY (id_vendedor) REFERENCES dbo.vendedor(id_vendedor),
        CONSTRAINT fk_configuracion_pago_usuario FOREIGN KEY (id_usuario_actualizacion) REFERENCES dbo.usuario(id_usuario),
        CONSTRAINT ck_configuracion_pago_salario CHECK (salario_mensual > 0)
    );
END
GO

IF OBJECT_ID('dbo.trabajador_bono', 'U') IS NULL
BEGIN
    CREATE TABLE dbo.trabajador_bono (
        id_vendedor INT NOT NULL,
        id_bono INT NOT NULL,
        activo BIT NOT NULL CONSTRAINT df_trabajador_bono_activo DEFAULT 1,
        fecha_asignacion DATETIME2 NOT NULL CONSTRAINT df_trabajador_bono_fecha DEFAULT SYSDATETIME(),
        CONSTRAINT pk_trabajador_bono PRIMARY KEY (id_vendedor, id_bono),
        CONSTRAINT fk_trabajador_bono_vendedor FOREIGN KEY (id_vendedor) REFERENCES dbo.vendedor(id_vendedor),
        CONSTRAINT fk_trabajador_bono_bono FOREIGN KEY (id_bono) REFERENCES dbo.bono_planilla(id_bono)
    );
END
GO

IF NOT EXISTS (SELECT 1 FROM dbo.bono_planilla WHERE codigo = 'VENTAS_1_PCT')
BEGIN
    INSERT dbo.bono_planilla(codigo,nombre,descripcion,tipo_calculo,porcentaje,activo)
    VALUES('VENTAS_1_PCT','Bono del 1% sobre ventas','Agrega el 1% del total vendido por el trabajador durante el periodo.','PORCENTAJE_VENTAS',1,1);
END
GO
