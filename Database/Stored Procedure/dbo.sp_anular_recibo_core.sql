CREATE OR ALTER PROCEDURE dbo.sp_anular_recibo_core
    @IdRecibo INT,
    @IdSucursal INT,
    @IdUsuario INT,
    @Motivo VARCHAR(500)
AS
BEGIN
    SET NOCOUNT ON;
    SET XACT_ABORT ON;

    BEGIN TRY
        BEGIN TRANSACTION;

        DECLARE @IdVenta INT, @IdFactura INT, @Estado VARCHAR(30);
        SELECT @IdVenta = f.id_venta, @IdFactura = f.id_factura, @Estado = r.estado
        FROM dbo.recibo r WITH (UPDLOCK, HOLDLOCK)
        INNER JOIN dbo.factura f ON f.id_factura = r.id_factura
        WHERE r.id_recibo = @IdRecibo AND r.id_sucursal = @IdSucursal;

        IF @IdVenta IS NULL THROW 50100, 'El recibo no existe en la sucursal seleccionada.', 1;
        IF @Estado = 'Anulado' THROW 50101, 'El recibo ya se encuentra anulado.', 1;
        IF NULLIF(LTRIM(RTRIM(@Motivo)), '') IS NULL THROW 50102, 'Debes indicar el motivo de la anulación.', 1;

        IF EXISTS (
            SELECT 1 FROM dbo.cuenta_cobrar cx
            INNER JOIN dbo.abono a ON a.id_cuenta = cx.id_cuenta
            WHERE cx.id_venta = @IdVenta
        )
            THROW 50103, 'No se puede anular porque la cuenta por cobrar ya tiene abonos registrados.', 1;

        UPDATE i
        SET i.stock = i.stock + dv.cantidad
        FROM dbo.inventario i
        INNER JOIN dbo.detalle_venta dv ON dv.id_producto = i.id_producto
        WHERE dv.id_venta = @IdVenta AND i.id_sucursal = @IdSucursal;

        UPDATE dbo.recibo
        SET estado = 'Anulado', fecha_anulacion = GETDATE(), motivo_anulacion = @Motivo,
            id_usuario_anulacion = @IdUsuario
        WHERE id_recibo = @IdRecibo;

        UPDATE dbo.factura SET estado = 'Anulada' WHERE id_factura = @IdFactura;
        UPDATE dbo.cuenta_cobrar SET estado = 'Anulada' WHERE id_venta = @IdVenta;
        UPDATE q SET q.estado = 'Anulada'
        FROM dbo.cuota_cuenta_cobrar q
        INNER JOIN dbo.cuenta_cobrar cx ON cx.id_cuenta = q.id_cuenta
        WHERE cx.id_venta = @IdVenta;

        COMMIT TRANSACTION;
        SELECT @IdRecibo AS IdRecibo;
    END TRY
    BEGIN CATCH
        IF @@TRANCOUNT > 0 ROLLBACK TRANSACTION;
        THROW;
    END CATCH
END
GO

IF OBJECT_ID('dbo.sp_anular_recibo', 'SN') IS NOT NULL DROP SYNONYM dbo.sp_anular_recibo;
GO
CREATE SYNONYM dbo.sp_anular_recibo FOR dbo.sp_anular_recibo_core;
GO
