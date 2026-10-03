SET XACT_ABORT ON;
GO
IF COL_LENGTH('dbo.factura','referencia_interna') IS NULL ALTER TABLE dbo.factura ADD referencia_interna VARCHAR(36) NULL;
IF COL_LENGTH('dbo.factura','xml_certificado') IS NULL ALTER TABLE dbo.factura ADD xml_certificado NVARCHAR(MAX) NULL;
IF COL_LENGTH('dbo.factura','ultimo_error') IS NULL ALTER TABLE dbo.factura ADD ultimo_error NVARCHAR(2000) NULL;
IF COL_LENGTH('dbo.factura','fecha_anulacion') IS NULL ALTER TABLE dbo.factura ADD fecha_anulacion DATETIME NULL;
IF COL_LENGTH('dbo.factura','motivo_anulacion') IS NULL ALTER TABLE dbo.factura ADD motivo_anulacion VARCHAR(500) NULL;
GO

CREATE OR ALTER PROCEDURE dbo.sp_registrar_certificacion_digifact
    @IdFactura INT,@NumeroFactura VARCHAR(50),@NumeroAutorizacion VARCHAR(100),@FechaCertificacion DATETIME,
    @ReferenciaInterna VARCHAR(36),@XmlCertificado NVARCHAR(MAX)=NULL
AS
BEGIN
    SET NOCOUNT ON;
    IF NOT EXISTS(SELECT 1 FROM dbo.factura WHERE id_factura=@IdFactura) THROW 50701,'La factura no existe.',1;
    UPDATE dbo.factura SET numero_factura=@NumeroFactura,estado='Autorizada',numero_autorizacion=@NumeroAutorizacion,
        fecha_certificacion=@FechaCertificacion,fecha_firma=@FechaCertificacion,referencia_interna=@ReferenciaInterna,
        xml_certificado=@XmlCertificado,ultimo_error=NULL
    WHERE id_factura=@IdFactura;
END
GO

CREATE OR ALTER PROCEDURE dbo.sp_marcar_error_factura_digifact @IdFactura INT,@Error NVARCHAR(2000)
AS
BEGIN
    SET NOCOUNT ON;
    UPDATE dbo.factura SET estado='Rechazada',ultimo_error=LEFT(@Error,2000),numero_autorizacion=NULL,
        fecha_certificacion=NULL,fecha_firma=NULL
    WHERE id_factura=@IdFactura AND (numero_autorizacion IS NULL OR numero_autorizacion LIKE 'SIM-%');
END
GO

CREATE OR ALTER PROCEDURE dbo.sp_marcar_factura_anulada_digifact @IdFactura INT,@Motivo VARCHAR(500)
AS
BEGIN
    SET NOCOUNT ON;
    UPDATE dbo.factura SET estado='Anulada',fecha_anulacion=GETDATE(),motivo_anulacion=@Motivo
    WHERE id_factura=@IdFactura AND estado='Autorizada';
    IF @@ROWCOUNT=0 THROW 50702,'La factura no está autorizada o ya fue anulada.',1;
END
GO
