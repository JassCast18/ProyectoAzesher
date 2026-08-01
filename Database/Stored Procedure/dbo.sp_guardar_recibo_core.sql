IF OBJECT_ID('dbo.sp_guardar_recibo_core', 'P') IS NOT NULL
BEGIN
    DROP PROCEDURE dbo.sp_guardar_recibo_core;
END
GO

CREATE PROCEDURE dbo.sp_guardar_recibo_core
    @IdFactura INT,
    @Monto DECIMAL(12,2),
    @MetodoPago VARCHAR(50),
    @NumeroComprobante VARCHAR(100) = NULL
AS
BEGIN
    SET NOCOUNT ON;

    DECLARE @IdRecibo INT;

    INSERT INTO dbo.recibo (
        numero_recibo,
        fecha_pago,
        monto,
        metodo_pago,
        numero_comprobante,
        id_factura
    )
    VALUES (
        'PENDIENTE',
        GETDATE(),
        @Monto,
        @MetodoPago,
        @NumeroComprobante,
        @IdFactura
    );

    SET @IdRecibo = CAST(SCOPE_IDENTITY() AS INT);

    UPDATE dbo.recibo
    SET numero_recibo = CONCAT('REC-', RIGHT('000000' + CAST(@IdRecibo AS VARCHAR(10)), 6))
    WHERE id_recibo = @IdRecibo;

    SELECT @IdRecibo AS IdRecibo;
END
GO