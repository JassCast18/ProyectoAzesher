CREATE OR ALTER PROCEDURE dbo.sp_obtener_recibo_venta_core
    @IdRecibo INT
AS
BEGIN
    SET NOCOUNT ON;

    SELECT
        r.id_recibo AS IdRecibo,
        r.numero_recibo AS NumeroRecibo,
        r.fecha_pago AS FechaPago,
        r.monto AS Monto,
        r.metodo_pago AS MetodoPago,
        r.numero_comprobante AS NumeroComprobante,
        r.estado AS EstadoRecibo,
        m.nombre AS MonedaNombre,
        m.codigo AS MonedaCodigo,
        tp.nombre AS TipoPosNombre,
        dp.fecha_transferencia AS FechaTransferencia,
        cx.saldo_pendiente AS SaldoPendiente,
        cx.monto_inicial AS MontoInicial,
        cx.numero_cuotas AS NumeroCuotas,
        primera.fecha_vencimiento AS PrimeraCuotaFecha,
        primera.monto AS PrimeraCuotaMonto,
        f.id_factura AS IdFactura,
        f.numero_factura AS NumeroFactura,
        f.fecha_emision AS FechaEmisionFactura,
        f.total AS TotalFactura,
        f.estado AS EstadoFactura,
        v.id_venta AS IdVenta,
        v.fecha AS FechaVenta,
        v.total AS TotalVenta,
        v.tipo_pago AS TipoPagoVenta,
        c.id_cliente AS IdCliente,
        c.nombre AS ClienteNombre,
        c.nit AS ClienteNit,
        c.direccion AS ClienteDomicilio,
        c.telefono AS ClienteTelefono,
        vd.id_vendedor AS IdVendedor,
        vd.nombre AS VendedorNombre,
        r.id_sucursal AS IdSucursal,
        su.nombre AS SucursalNombre
    FROM dbo.recibo r
    INNER JOIN dbo.factura f ON f.id_factura = r.id_factura
    INNER JOIN dbo.venta v ON v.id_venta = f.id_venta
    INNER JOIN dbo.cliente c ON c.id_cliente = v.id_cliente
    INNER JOIN dbo.vendedor vd ON vd.id_vendedor = v.id_vendedor
    LEFT JOIN dbo.sucursal su ON su.id_sucursal = r.id_sucursal
    LEFT JOIN dbo.detalle_pago_venta dp ON dp.id_venta = v.id_venta
    LEFT JOIN dbo.moneda m ON m.id_moneda = dp.id_moneda
    LEFT JOIN dbo.tipo_pos tp ON tp.id_tipo_pos = dp.id_tipo_pos
    LEFT JOIN dbo.cuenta_cobrar cx ON cx.id_venta = v.id_venta
    OUTER APPLY (
        SELECT TOP 1 fecha_vencimiento, monto
        FROM dbo.cuota_cuenta_cobrar q
        WHERE q.id_cuenta = cx.id_cuenta
        ORDER BY q.numero_cuota
    ) primera
    WHERE r.id_recibo = @IdRecibo;

    SELECT
        dv.id_detalle AS IdDetalle,
        dv.id_producto AS IdProducto,
        p.nombre AS ProductoNombre,
        dv.cantidad AS Cantidad,
        dv.precio_unitario AS PrecioUnitario,
        dv.subtotal AS Subtotal
    FROM dbo.detalle_venta dv
    INNER JOIN dbo.producto p ON p.id_producto = dv.id_producto
    INNER JOIN dbo.factura f ON f.id_venta = dv.id_venta
    INNER JOIN dbo.recibo r ON r.id_factura = f.id_factura
    WHERE r.id_recibo = @IdRecibo
    ORDER BY dv.id_detalle;
END
GO

IF OBJECT_ID('dbo.sp_obtener_recibo_venta', 'SN') IS NOT NULL
    DROP SYNONYM dbo.sp_obtener_recibo_venta;
GO
CREATE SYNONYM dbo.sp_obtener_recibo_venta FOR dbo.sp_obtener_recibo_venta_core;
GO
