CREATE OR ALTER PROCEDURE dbo.sp_reporte_ventas_core @IdSucursal INT,@FechaDesde DATE,@FechaHasta DATE AS BEGIN SET NOCOUNT ON;SELECT CAST(v.fecha AS DATE) Fecha,v.tipo_pago Categoria,COUNT(*) Registros,SUM(v.total) Total FROM dbo.venta v JOIN dbo.sesion_caja sc ON sc.id_sesion=v.id_sesion WHERE sc.id_sucursal=@IdSucursal AND CAST(v.fecha AS DATE) BETWEEN @FechaDesde AND @FechaHasta GROUP BY CAST(v.fecha AS DATE),v.tipo_pago ORDER BY Fecha DESC;END
GO
CREATE OR ALTER PROCEDURE dbo.sp_reporte_inventario_core @IdSucursal INT AS BEGIN SET NOCOUNT ON;SELECT p.cod_producto Codigo,p.nombre Categoria,i.stock Registros,p.precio*i.stock Total FROM dbo.inventario i JOIN dbo.producto p ON p.id_producto=i.id_producto WHERE i.id_sucursal=@IdSucursal ORDER BY i.stock,p.nombre;END
GO
CREATE OR ALTER PROCEDURE dbo.sp_reporte_cobros_core @IdSucursal INT,@FechaDesde DATE,@FechaHasta DATE AS BEGIN SET NOCOUNT ON;SELECT c.nombre Categoria,cx.numero_cuotas Registros,cx.saldo_pendiente Total,v.fecha Fecha FROM dbo.cuenta_cobrar cx JOIN dbo.venta v ON v.id_venta=cx.id_venta JOIN dbo.cliente c ON c.id_cliente=v.id_cliente JOIN dbo.sesion_caja sc ON sc.id_sesion=v.id_sesion WHERE sc.id_sucursal=@IdSucursal AND CAST(v.fecha AS DATE) BETWEEN @FechaDesde AND @FechaHasta ORDER BY cx.saldo_pendiente DESC;END
GO
CREATE OR ALTER PROCEDURE dbo.sp_reporte_caja_core @IdSucursal INT,@FechaDesde DATE,@FechaHasta DATE AS BEGIN SET NOCOUNT ON;SELECT u.nombre Categoria,sc.fecha_apertura Fecha,sc.monto_cierre Registros,ISNULL(sc.diferencia,0) Total FROM dbo.sesion_caja sc JOIN dbo.usuario u ON u.id_usuario=sc.id_usuario WHERE sc.id_sucursal=@IdSucursal AND CAST(sc.fecha_apertura AS DATE) BETWEEN @FechaDesde AND @FechaHasta ORDER BY sc.fecha_apertura DESC;END
GO
IF OBJECT_ID('dbo.sp_reporte_ventas','SN') IS NOT NULL DROP SYNONYM dbo.sp_reporte_ventas; CREATE SYNONYM dbo.sp_reporte_ventas FOR dbo.sp_reporte_ventas_core;
GO
IF OBJECT_ID('dbo.sp_reporte_inventario','SN') IS NOT NULL DROP SYNONYM dbo.sp_reporte_inventario; CREATE SYNONYM dbo.sp_reporte_inventario FOR dbo.sp_reporte_inventario_core;
GO
IF OBJECT_ID('dbo.sp_reporte_cobros','SN') IS NOT NULL DROP SYNONYM dbo.sp_reporte_cobros; CREATE SYNONYM dbo.sp_reporte_cobros FOR dbo.sp_reporte_cobros_core;
GO
IF OBJECT_ID('dbo.sp_reporte_caja','SN') IS NOT NULL DROP SYNONYM dbo.sp_reporte_caja; CREATE SYNONYM dbo.sp_reporte_caja FOR dbo.sp_reporte_caja_core;
GO
