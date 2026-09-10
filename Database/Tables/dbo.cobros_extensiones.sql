-- Extensiones estructurales para el módulo de cobros.
IF COL_LENGTH('dbo.abono','numero_abono') IS NULL ALTER TABLE dbo.abono ADD numero_abono VARCHAR(30) NULL;
IF COL_LENGTH('dbo.abono','metodo_pago') IS NULL ALTER TABLE dbo.abono ADD metodo_pago VARCHAR(30) NOT NULL CONSTRAINT df_abono_metodo DEFAULT 'efectivo';
IF COL_LENGTH('dbo.abono','referencia') IS NULL ALTER TABLE dbo.abono ADD referencia VARCHAR(100) NULL;
IF COL_LENGTH('dbo.abono','saldo_anterior') IS NULL ALTER TABLE dbo.abono ADD saldo_anterior DECIMAL(12,2) NULL;
IF COL_LENGTH('dbo.abono','saldo_posterior') IS NULL ALTER TABLE dbo.abono ADD saldo_posterior DECIMAL(12,2) NULL;
IF COL_LENGTH('dbo.abono','id_recibo_origen') IS NULL ALTER TABLE dbo.abono ADD id_recibo_origen INT NULL;
IF COL_LENGTH('dbo.abono','id_sucursal') IS NULL ALTER TABLE dbo.abono ADD id_sucursal INT NULL;
IF COL_LENGTH('dbo.abono','id_sesion') IS NULL ALTER TABLE dbo.abono ADD id_sesion INT NULL;
IF COL_LENGTH('dbo.abono','id_usuario') IS NULL ALTER TABLE dbo.abono ADD id_usuario INT NULL;
GO
IF NOT EXISTS(SELECT 1 FROM sys.foreign_keys WHERE name='fk_abono_recibo') ALTER TABLE dbo.abono ADD CONSTRAINT fk_abono_recibo FOREIGN KEY(id_recibo_origen) REFERENCES dbo.recibo(id_recibo);
IF NOT EXISTS(SELECT 1 FROM sys.foreign_keys WHERE name='fk_abono_sucursal') ALTER TABLE dbo.abono ADD CONSTRAINT fk_abono_sucursal FOREIGN KEY(id_sucursal) REFERENCES dbo.sucursal(id_sucursal);
IF NOT EXISTS(SELECT 1 FROM sys.foreign_keys WHERE name='fk_abono_sesion') ALTER TABLE dbo.abono ADD CONSTRAINT fk_abono_sesion FOREIGN KEY(id_sesion) REFERENCES dbo.sesion_caja(id_sesion);
IF NOT EXISTS(SELECT 1 FROM sys.foreign_keys WHERE name='fk_abono_usuario') ALTER TABLE dbo.abono ADD CONSTRAINT fk_abono_usuario FOREIGN KEY(id_usuario) REFERENCES dbo.usuario(id_usuario);
IF NOT EXISTS(SELECT 1 FROM sys.indexes WHERE name='idx_abono_sucursal_fecha' AND object_id=OBJECT_ID('dbo.abono')) CREATE INDEX idx_abono_sucursal_fecha ON dbo.abono(id_sucursal,fecha);
GO

IF COL_LENGTH('dbo.cuota_cuenta_cobrar','monto_pagado') IS NULL
    ALTER TABLE dbo.cuota_cuenta_cobrar ADD monto_pagado DECIMAL(12,2) NOT NULL CONSTRAINT df_cuota_monto_pagado DEFAULT 0;
GO

IF COL_LENGTH('dbo.cliente_credito','dias_maximos_pago') IS NULL ALTER TABLE dbo.cliente_credito ADD dias_maximos_pago INT NOT NULL CONSTRAINT df_cliente_credito_dias DEFAULT 30;
IF COL_LENGTH('dbo.cliente_credito','fecha_vencimiento_autorizacion') IS NULL ALTER TABLE dbo.cliente_credito ADD fecha_vencimiento_autorizacion DATE NULL;
IF COL_LENGTH('dbo.cliente_credito','observaciones') IS NULL ALTER TABLE dbo.cliente_credito ADD observaciones VARCHAR(500) NULL;
IF COL_LENGTH('dbo.cliente_credito','fecha_autorizacion') IS NULL ALTER TABLE dbo.cliente_credito ADD fecha_autorizacion DATETIME NOT NULL CONSTRAINT df_cliente_credito_fecha DEFAULT GETDATE();
IF COL_LENGTH('dbo.cliente_credito','id_usuario_autorizo') IS NULL ALTER TABLE dbo.cliente_credito ADD id_usuario_autorizo INT NULL;
GO
IF NOT EXISTS(SELECT 1 FROM sys.foreign_keys WHERE name='fk_cliente_credito_usuario') ALTER TABLE dbo.cliente_credito ADD CONSTRAINT fk_cliente_credito_usuario FOREIGN KEY(id_usuario_autorizo) REFERENCES dbo.usuario(id_usuario);
GO
