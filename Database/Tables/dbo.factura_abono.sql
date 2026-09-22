SET QUOTED_IDENTIFIER ON;
SET ANSI_NULLS ON;
SET ANSI_PADDING ON;
SET ANSI_WARNINGS ON;
SET CONCAT_NULL_YIELDS_NULL ON;
SET ARITHABORT ON;
SET NUMERIC_ROUNDABORT OFF;
GO
IF COL_LENGTH('dbo.factura','id_abono') IS NULL ALTER TABLE dbo.factura ADD id_abono INT NULL;
IF COL_LENGTH('dbo.factura','tipo_origen') IS NULL ALTER TABLE dbo.factura ADD tipo_origen VARCHAR(20) NOT NULL CONSTRAINT df_factura_tipo_origen DEFAULT 'Venta';
GO
IF NOT EXISTS(SELECT 1 FROM sys.foreign_keys WHERE name='fk_factura_abono') ALTER TABLE dbo.factura ADD CONSTRAINT fk_factura_abono FOREIGN KEY(id_abono) REFERENCES dbo.abono(id_abono);
IF NOT EXISTS(SELECT 1 FROM sys.indexes WHERE name='uq_factura_abono' AND object_id=OBJECT_ID('dbo.factura')) CREATE UNIQUE INDEX uq_factura_abono ON dbo.factura(id_abono) WHERE id_abono IS NOT NULL;
GO
