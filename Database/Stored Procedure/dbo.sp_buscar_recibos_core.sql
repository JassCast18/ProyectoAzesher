CREATE OR ALTER PROCEDURE dbo.sp_buscar_recibos_core
    @IdSucursal INT,
    @Query VARCHAR(200) = '',
    @FechaDesde DATE = NULL,
    @FechaHasta DATE = NULL,
    @TipoDocumento VARCHAR(20) = 'recibo',
    @MetodoPago VARCHAR(30) = ''
AS
BEGIN
    SET NOCOUNT ON;

    SELECT TOP 200
        r.id_recibo AS IdRecibo,
        r.numero_recibo AS NumeroRecibo,
        r.fecha_pago AS FechaPago,
        CASE WHEN r.metodo_pago = 'credito' THEN ISNULL(cx.monto_inicial, 0) ELSE r.monto END AS Monto,
        cx.saldo_pendiente AS SaldoPendiente,
        r.metodo_pago AS MetodoPago,
        r.estado AS Estado,
        r.fecha_anulacion AS FechaAnulacion,
        r.motivo_anulacion AS MotivoAnulacion,
        f.numero_factura AS NumeroFactura,
        f.id_factura AS IdFactura,
        CAST(CASE WHEN f.estado = 'Autorizada' THEN 1 ELSE 0 END AS BIT) AS EsFacturada,
        c.id_cliente AS IdCliente,
        c.nombre AS ClienteNombre,
        c.nit AS ClienteNit,
        vd.nombre AS VendedorNombre,
        s.nombre AS SucursalNombre
    FROM dbo.recibo r
    INNER JOIN dbo.factura f ON f.id_factura = r.id_factura
    INNER JOIN dbo.venta v ON v.id_venta = f.id_venta
    INNER JOIN dbo.cliente c ON c.id_cliente = v.id_cliente
    INNER JOIN dbo.vendedor vd ON vd.id_vendedor = v.id_vendedor
    INNER JOIN dbo.sucursal s ON s.id_sucursal = r.id_sucursal
    LEFT JOIN dbo.cuenta_cobrar cx ON cx.id_venta = v.id_venta
    WHERE r.id_sucursal = @IdSucursal
      AND ((LOWER(ISNULL(@TipoDocumento, 'recibo')) = 'nota' AND r.metodo_pago = 'credito')
           OR (LOWER(ISNULL(@TipoDocumento, 'recibo')) <> 'nota' AND r.metodo_pago <> 'credito'))
      AND (ISNULL(@MetodoPago, '') = '' OR LOWER(r.metodo_pago) = LOWER(@MetodoPago))
      AND (@Query = ''
           OR r.numero_recibo LIKE '%' + @Query + '%'
           OR c.nombre LIKE '%' + @Query + '%'
           OR ISNULL(c.nit, '') LIKE '%' + @Query + '%')
      AND (@FechaDesde IS NULL OR r.fecha_pago >= @FechaDesde)
      AND (@FechaHasta IS NULL OR r.fecha_pago < DATEADD(DAY, 1, @FechaHasta))
    ORDER BY r.fecha_pago DESC, r.id_recibo DESC;
END
GO

IF OBJECT_ID('dbo.sp_buscar_recibos', 'SN') IS NOT NULL DROP SYNONYM dbo.sp_buscar_recibos;
GO
CREATE SYNONYM dbo.sp_buscar_recibos FOR dbo.sp_buscar_recibos_core;
GO
