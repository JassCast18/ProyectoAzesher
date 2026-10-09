-- Detalle y PDF de entradas, y aislamiento estricto de caja por sucursal.
UPDATE sc SET sc.id_sucursal=u.id_sucursal
FROM dbo.sesion_caja sc
INNER JOIN dbo.usuario u ON u.id_usuario=sc.id_usuario
WHERE sc.id_sucursal IS NULL AND u.id_sucursal IS NOT NULL;
GO

CREATE OR ALTER PROCEDURE dbo.sp_obtener_entrada_pedido_core
    @IdCompra INT,@IdSucursal INT
AS
BEGIN
    SET NOCOUNT ON;
    SELECT c.id_compra IdCompra,c.numero_pedido NumeroPedido,c.fecha Fecha,c.total Total,
           c.metodo_pago MetodoPago,c.observaciones Observaciones,pr.nombre ProveedorNombre,
           s.nombre SucursalNombre,p.id_producto IdProducto,p.codigo Codigo,p.nombre ProductoNombre,
           dc.cantidad Cantidad,dc.costo_unitario CostoUnitario,dc.subtotal Subtotal
    FROM dbo.compra c
    INNER JOIN dbo.proveedor pr ON pr.id_proveedor=c.id_proveedor
    INNER JOIN dbo.sucursal s ON s.id_sucursal=c.id_sucursal
    INNER JOIN dbo.detalle_compra dc ON dc.id_compra=c.id_compra
    INNER JOIN dbo.producto p ON p.id_producto=dc.id_producto
    WHERE c.id_compra=@IdCompra AND c.id_sucursal=@IdSucursal
    ORDER BY p.nombre;
END
GO
IF OBJECT_ID('dbo.sp_obtener_entrada_pedido','SN') IS NOT NULL DROP SYNONYM dbo.sp_obtener_entrada_pedido;
GO
CREATE SYNONYM dbo.sp_obtener_entrada_pedido FOR dbo.sp_obtener_entrada_pedido_core;
GO

CREATE OR ALTER PROCEDURE dbo.sp_estado_caja_core @IdUsuario INT,@IdSucursal INT AS BEGIN SET NOCOUNT ON;
 SELECT TOP(1) sc.id_sesion IdSesion,sc.fecha_apertura FechaApertura,sc.fecha_cierre FechaCierre,sc.monto_apertura MontoApertura,sc.monto_cierre MontoCierre,sc.monto_esperado MontoEsperado,sc.diferencia,sc.observaciones,
 ISNULL(SUM(CASE WHEN v.tipo_pago='efectivo' AND ISNULL(r.estado,'')<>'Anulado' THEN r.monto ELSE 0 END),0) VentasEfectivo,
 ISNULL(SUM(CASE WHEN v.tipo_pago='tarjeta' AND ISNULL(r.estado,'')<>'Anulado' THEN r.monto ELSE 0 END),0) VentasTarjeta,
 ISNULL(SUM(CASE WHEN v.tipo_pago='transferencia' AND ISNULL(r.estado,'')<>'Anulado' THEN r.monto ELSE 0 END),0) VentasTransferencia,
 ISNULL(SUM(CASE WHEN v.tipo_pago='credito' AND ISNULL(r.estado,'')<>'Anulado' THEN r.monto ELSE 0 END),0) VentasCredito,
 ISNULL(SUM(CASE WHEN ISNULL(r.estado,'')<>'Anulado' THEN r.monto ELSE 0 END),0) VentasTotales,
 (SELECT ISNULL(SUM(c.total),0) FROM dbo.compra c WHERE c.id_sesion=sc.id_sesion AND c.id_sucursal=@IdSucursal AND c.metodo_pago='efectivo') ComprasEfectivo,
 (SELECT ISNULL(SUM(a.monto),0) FROM dbo.abono a WHERE a.id_sesion=sc.id_sesion AND a.metodo_pago='efectivo') AbonosEfectivo,
 (SELECT ISNULL(SUM(m.monto),0) FROM dbo.movimiento_caja_manual m WHERE m.id_sesion=sc.id_sesion AND m.tipo='salida') SalidasEfectivo
 FROM dbo.sesion_caja sc LEFT JOIN dbo.venta v ON v.id_sesion=sc.id_sesion LEFT JOIN dbo.factura f ON f.id_venta=v.id_venta LEFT JOIN dbo.recibo r ON r.id_factura=f.id_factura
 WHERE sc.id_sucursal=@IdSucursal AND sc.fecha_cierre IS NULL GROUP BY sc.id_sesion,sc.fecha_apertura,sc.fecha_cierre,sc.monto_apertura,sc.monto_cierre,sc.monto_esperado,sc.diferencia,sc.observaciones ORDER BY sc.fecha_apertura DESC;
END
GO
IF OBJECT_ID('dbo.sp_estado_caja','SN') IS NOT NULL DROP SYNONYM dbo.sp_estado_caja;
GO
CREATE SYNONYM dbo.sp_estado_caja FOR dbo.sp_estado_caja_core;
GO

CREATE OR ALTER PROCEDURE dbo.sp_movimientos_caja_core @IdUsuario INT,@IdSucursal INT,@IdSesion INT=NULL AS
BEGIN
 SET NOCOUNT ON; DECLARE @Id INT=@IdSesion;
 IF @Id IS NULL SELECT TOP(1)@Id=id_sesion FROM dbo.sesion_caja WHERE id_sucursal=@IdSucursal AND fecha_cierre IS NULL ORDER BY fecha_apertura DESC;
 IF @Id IS NULL RETURN;
 IF NOT EXISTS(SELECT 1 FROM dbo.sesion_caja WHERE id_sesion=@Id AND id_sucursal=@IdSucursal) THROW 50401,'El cierre no pertenece a la sucursal seleccionada.',1;
 SELECT Tipo,Numero,Fecha,MetodoPago,Monto,Estado FROM(
  SELECT CASE WHEN r.metodo_pago='credito' THEN 'Venta a crédito' ELSE 'Recibo' END Tipo,r.numero_recibo Numero,r.fecha_pago Fecha,r.metodo_pago MetodoPago,r.monto Monto,r.estado Estado FROM dbo.venta v JOIN dbo.factura f ON f.id_venta=v.id_venta JOIN dbo.recibo r ON r.id_factura=f.id_factura WHERE v.id_sesion=@Id
  UNION ALL SELECT 'Entrada de pedido',c.numero_pedido,c.fecha,c.metodo_pago,-c.total,'Registrada' FROM dbo.compra c WHERE c.id_sesion=@Id AND c.id_sucursal=@IdSucursal
  UNION ALL SELECT 'Abono',a.numero_abono,a.fecha,a.metodo_pago,a.monto,'Registrado' FROM dbo.abono a WHERE a.id_sesion=@Id
  UNION ALL SELECT 'Salida de caja',CONCAT('SAL-',RIGHT('00000000'+CAST(m.id_movimiento AS VARCHAR),8)),m.fecha,'efectivo',-m.monto,m.concepto FROM dbo.movimiento_caja_manual m WHERE m.id_sesion=@Id
 )mov ORDER BY Fecha DESC;
END
GO
IF OBJECT_ID('dbo.sp_movimientos_caja','SN') IS NOT NULL DROP SYNONYM dbo.sp_movimientos_caja;
GO
CREATE SYNONYM dbo.sp_movimientos_caja FOR dbo.sp_movimientos_caja_core;
GO
