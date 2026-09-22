CREATE OR ALTER PROCEDURE dbo.sp_listar_cobros_core
    @IdSucursal INT, @Query VARCHAR(150)='', @Orden VARCHAR(30)='deuda_desc', @SoloConDeuda BIT=0
AS
BEGIN
    SET NOCOUNT ON;
    INSERT dbo.historial_estado_credito(id_cliente_credito,estado,fecha,id_usuario,observacion)
    SELECT id_cliente_credito,'Rechazado por vigencia',GETDATE(),NULL,'La autorización llegó a su fecha de vencimiento.'
    FROM dbo.cliente_credito
    WHERE activo=1 AND fecha_vencimiento_autorizacion<CAST(GETDATE() AS DATE);
    UPDATE dbo.cliente_credito
       SET activo=0,estado_autorizacion='Rechazado por vigencia',fecha_cambio_estado=GETDATE()
     WHERE activo=1
       AND fecha_vencimiento_autorizacion<CAST(GETDATE() AS DATE);

    SELECT cc.id_cliente_credito IdClienteCredito,c.id_cliente IdCliente,c.nombre Cliente,c.nit Nit,c.telefono Telefono,
           cc.limite_credito LimiteCredito,ISNULL(x.SaldoPendiente,0) SaldoPendiente,
           cc.limite_credito-ISNULL(x.SaldoPendiente,0) CreditoDisponible,ISNULL(x.CuentasPendientes,0) CuentasPendientes,
           ISNULL(x.CuotasVencidas,0) CuotasVencidas,x.ProximoVencimiento,cc.activo Activo,
           cc.estado_autorizacion EstadoAutorizacion,cc.fecha_cambio_estado FechaCambioEstado
    FROM dbo.cliente_credito cc
    JOIN dbo.cliente c ON c.id_cliente=cc.id_cliente
    OUTER APPLY(
        SELECT SUM(cx.saldo_pendiente) SaldoPendiente,COUNT(CASE WHEN cx.estado='Pendiente' THEN 1 END) CuentasPendientes,
               SUM(ISNULL(q.Vencidas,0)) CuotasVencidas,MIN(q.Proxima) ProximoVencimiento
        FROM dbo.venta v JOIN dbo.factura f ON f.id_venta=v.id_venta JOIN dbo.recibo r ON r.id_factura=f.id_factura
        JOIN dbo.cuenta_cobrar cx ON cx.id_venta=v.id_venta
        OUTER APPLY(SELECT SUM(CASE WHEN estado<>'Pagada' AND fecha_vencimiento<CAST(GETDATE() AS DATE) THEN 1 ELSE 0 END) Vencidas,
                           MIN(CASE WHEN estado<>'Pagada' THEN fecha_vencimiento END) Proxima FROM dbo.cuota_cuenta_cobrar WHERE id_cuenta=cx.id_cuenta)q
        WHERE v.id_cliente=c.id_cliente AND r.id_sucursal=@IdSucursal AND cx.estado<>'Anulada'
    )x
    WHERE ((cc.activo=1 AND (cc.fecha_vencimiento_autorizacion IS NULL OR cc.fecha_vencimiento_autorizacion>=CAST(GETDATE() AS DATE))) OR ISNULL(x.SaldoPendiente,0)>0)
      AND (@Query='' OR c.nombre LIKE '%'+@Query+'%' OR ISNULL(c.nit,'') LIKE '%'+@Query+'%')
      AND (@SoloConDeuda=0 OR ISNULL(x.SaldoPendiente,0)>0)
    ORDER BY CASE WHEN @Orden='nombre_asc' THEN c.nombre END ASC,
             CASE WHEN @Orden='nombre_desc' THEN c.nombre END DESC,
             CASE WHEN @Orden='deuda_asc' THEN ISNULL(x.SaldoPendiente,0) END ASC,
             CASE WHEN @Orden NOT IN('nombre_asc','nombre_desc','deuda_asc') THEN ISNULL(x.SaldoPendiente,0) END DESC,c.nombre;
END
GO

CREATE OR ALTER PROCEDURE dbo.sp_cuentas_pendientes_cobro_core @IdSucursal INT,@Query VARCHAR(150)=''
AS
BEGIN
 SET NOCOUNT ON;
 SELECT cx.id_cuenta IdCuenta,c.id_cliente IdCliente,c.nombre Cliente,c.nit Nit,c.correo Correo,c.telefono Telefono,r.id_recibo IdReciboOrigen,r.numero_recibo NotaCredito,
        v.fecha FechaVenta,v.total TotalVenta,cx.monto_inicial MontoInicial,cx.saldo_pendiente SaldoPendiente,cx.numero_cuotas NumeroCuotas,
        MIN(CASE WHEN q.estado<>'Pagada' THEN q.fecha_vencimiento END) ProximoVencimiento,
        SUM(CASE WHEN q.estado='Pagada' THEN 1 ELSE 0 END) CuotasPagadas
 FROM dbo.cuenta_cobrar cx JOIN dbo.venta v ON v.id_venta=cx.id_venta JOIN dbo.cliente c ON c.id_cliente=v.id_cliente
 JOIN dbo.factura f ON f.id_venta=v.id_venta JOIN dbo.recibo r ON r.id_factura=f.id_factura
 LEFT JOIN dbo.cuota_cuenta_cobrar q ON q.id_cuenta=cx.id_cuenta
 WHERE r.id_sucursal=@IdSucursal AND cx.estado='Pendiente' AND cx.saldo_pendiente>0
   AND (@Query='' OR c.nombre LIKE '%'+@Query+'%' OR ISNULL(c.nit,'') LIKE '%'+@Query+'%' OR r.numero_recibo LIKE '%'+@Query+'%')
 GROUP BY cx.id_cuenta,c.id_cliente,c.nombre,c.nit,c.correo,c.telefono,r.id_recibo,r.numero_recibo,v.fecha,v.total,cx.monto_inicial,cx.saldo_pendiente,cx.numero_cuotas
 ORDER BY ProximoVencimiento,c.nombre;
END
GO

CREATE OR ALTER PROCEDURE dbo.sp_estado_cuenta_cliente_core @IdSucursal INT,@IdCliente INT,@FechaDesde DATE=NULL,@FechaHasta DATE=NULL
AS
BEGIN
 SET NOCOUNT ON;
 SELECT c.id_cliente IdCliente,c.nombre Cliente,c.nit Nit,c.telefono Telefono,cc.limite_credito LimiteCredito,
        ISNULL(SUM(CASE WHEN cx.estado<>'Anulada' THEN cx.saldo_pendiente ELSE 0 END),0) SaldoPendiente,
        cc.limite_credito-ISNULL(SUM(CASE WHEN cx.estado<>'Anulada' THEN cx.saldo_pendiente ELSE 0 END),0) CreditoDisponible,
        cc.activo Activo,cc.estado_autorizacion EstadoAutorizacion,cc.fecha_cambio_estado FechaCambioEstado
 FROM dbo.cliente c JOIN dbo.cliente_credito cc ON cc.id_cliente=c.id_cliente
 LEFT JOIN dbo.venta v ON v.id_cliente=c.id_cliente LEFT JOIN dbo.factura f ON f.id_venta=v.id_venta LEFT JOIN dbo.recibo r ON r.id_factura=f.id_factura AND r.id_sucursal=@IdSucursal
 LEFT JOIN dbo.cuenta_cobrar cx ON cx.id_venta=v.id_venta AND r.id_recibo IS NOT NULL
 WHERE c.id_cliente=@IdCliente GROUP BY c.id_cliente,c.nombre,c.nit,c.telefono,cc.limite_credito,cc.activo,cc.estado_autorizacion,cc.fecha_cambio_estado;

 SELECT cx.id_cuenta IdCuenta,r.numero_recibo NotaCredito,v.fecha Fecha,v.total Total,cx.monto_inicial MontoInicial,
        cx.saldo_pendiente SaldoPendiente,cx.numero_cuotas NumeroCuotas,cx.estado Estado
 FROM dbo.cuenta_cobrar cx JOIN dbo.venta v ON v.id_venta=cx.id_venta JOIN dbo.factura f ON f.id_venta=v.id_venta JOIN dbo.recibo r ON r.id_factura=f.id_factura
 WHERE v.id_cliente=@IdCliente AND r.id_sucursal=@IdSucursal AND cx.estado<>'Anulada'
 ORDER BY v.fecha DESC;

 SELECT m.IdMovimiento,m.IdCuenta,m.Fecha,m.Tipo,m.Documento,m.Debito,m.Credito,m.Estado,m.FechaVencimiento
 FROM(
   SELECT -cx.id_cuenta IdMovimiento,cx.id_cuenta IdCuenta,v.fecha Fecha,'Compra a credito' Tipo,
          r.numero_recibo Documento,v.total-cx.monto_inicial Debito,0 Credito,cx.estado Estado,NULL FechaVencimiento
   FROM dbo.cuenta_cobrar cx JOIN dbo.venta v ON v.id_venta=cx.id_venta
   JOIN dbo.factura f ON f.id_venta=v.id_venta JOIN dbo.recibo r ON r.id_factura=f.id_factura
   WHERE v.id_cliente=@IdCliente AND r.id_sucursal=@IdSucursal AND cx.estado<>'Anulada'
   UNION ALL
   SELECT a.id_abono,a.id_cuenta,a.fecha,'Abono',a.numero_abono,0,a.monto,'Pagado',NULL
   FROM dbo.abono a JOIN dbo.cuenta_cobrar cx ON cx.id_cuenta=a.id_cuenta JOIN dbo.venta v ON v.id_venta=cx.id_venta
   WHERE v.id_cliente=@IdCliente AND a.id_sucursal=@IdSucursal
   UNION ALL
   SELECT -1000000000-h.id_historial,0,h.fecha,'Estado de crédito',
          CONCAT(h.estado,CASE WHEN u.nombre IS NULL THEN '' ELSE CONCAT(' · ',u.nombre) END),0,0,h.estado,NULL
   FROM dbo.historial_estado_credito h
   JOIN dbo.cliente_credito cc ON cc.id_cliente_credito=h.id_cliente_credito
   LEFT JOIN dbo.usuario u ON u.id_usuario=h.id_usuario
   WHERE cc.id_cliente=@IdCliente
 )m WHERE (@FechaDesde IS NULL OR CAST(m.Fecha AS DATE)>=@FechaDesde) AND (@FechaHasta IS NULL OR CAST(m.Fecha AS DATE)<=@FechaHasta)
 ORDER BY m.Fecha DESC,m.IdMovimiento DESC;
END
GO

CREATE OR ALTER PROCEDURE dbo.sp_registrar_abono_core
 @IdCuenta INT,@IdSucursal INT,@IdUsuario INT,@Monto DECIMAL(12,2),@MetodoPago VARCHAR(30),@Referencia VARCHAR(100)=NULL,@Correo VARCHAR(150)=NULL,@Telefono VARCHAR(30)=NULL
AS
BEGIN
 SET NOCOUNT ON; SET XACT_ABORT ON;
 BEGIN TRY
  BEGIN TRANSACTION;
  DECLARE @Saldo DECIMAL(12,2),@IdRecibo INT,@IdSesion INT=NULL;
  SELECT @Saldo=cx.saldo_pendiente,@IdRecibo=r.id_recibo FROM dbo.cuenta_cobrar cx WITH(UPDLOCK,HOLDLOCK)
  JOIN dbo.venta v ON v.id_venta=cx.id_venta JOIN dbo.factura f ON f.id_venta=v.id_venta JOIN dbo.recibo r ON r.id_factura=f.id_factura
  WHERE cx.id_cuenta=@IdCuenta AND r.id_sucursal=@IdSucursal AND cx.estado='Pendiente';
  IF @Saldo IS NULL THROW 50301,'La cuenta no existe o ya fue cancelada.',1;
  IF @Monto<=0 OR @Monto>@Saldo THROW 50302,'El abono debe ser mayor que cero y no puede superar el saldo pendiente.',1;
  IF @MetodoPago NOT IN('efectivo','transferencia','cheque','tarjeta') THROW 50303,'La forma de pago no es válida.',1;
  IF @MetodoPago='efectivo'
  BEGIN
   SELECT TOP(1)@IdSesion=id_sesion FROM dbo.sesion_caja WHERE id_sucursal=@IdSucursal AND fecha_cierre IS NULL ORDER BY fecha_apertura DESC;
   IF @IdSesion IS NULL THROW 50304,'No hay una caja abierta en esta sucursal para recibir efectivo.',1;
  END;
  INSERT dbo.abono(id_cuenta,fecha,monto,numero_abono,metodo_pago,referencia,saldo_anterior,saldo_posterior,id_recibo_origen,id_sucursal,id_sesion,id_usuario,correo_contacto,telefono_contacto)
  VALUES(@IdCuenta,GETDATE(),@Monto,'PENDIENTE',@MetodoPago,NULLIF(LTRIM(RTRIM(@Referencia)),''),@Saldo,@Saldo-@Monto,@IdRecibo,@IdSucursal,@IdSesion,@IdUsuario,NULLIF(LTRIM(RTRIM(@Correo)),''),NULLIF(LTRIM(RTRIM(@Telefono)),''));
  DECLARE @IdAbono INT=CAST(SCOPE_IDENTITY() AS INT);
  UPDATE dbo.abono SET numero_abono=CONCAT('AB-',RIGHT('00000000'+CAST(@IdAbono AS VARCHAR(10)),8)) WHERE id_abono=@IdAbono;
  DECLARE @Restante DECIMAL(12,2)=@Monto,@IdCuota INT,@Falta DECIMAL(12,2),@Aplicado DECIMAL(12,2);
  WHILE @Restante>0
  BEGIN
   SET @IdCuota=NULL;
   SELECT TOP(1)@IdCuota=id_cuota,@Falta=monto-monto_pagado FROM dbo.cuota_cuenta_cobrar WITH(UPDLOCK) WHERE id_cuenta=@IdCuenta AND estado<>'Pagada' ORDER BY numero_cuota;
   IF @IdCuota IS NULL BREAK;
   SET @Aplicado=CASE WHEN @Restante<@Falta THEN @Restante ELSE @Falta END;
   UPDATE dbo.cuota_cuenta_cobrar SET monto_pagado=monto_pagado+@Aplicado,estado=CASE WHEN monto_pagado+@Aplicado>=monto THEN 'Pagada' ELSE 'Parcial' END WHERE id_cuota=@IdCuota;
   SET @Restante=@Restante-@Aplicado;
  END;
  UPDATE dbo.cuenta_cobrar SET saldo_pendiente=@Saldo-@Monto,estado=CASE WHEN @Saldo-@Monto=0 THEN 'Pagada' ELSE 'Pendiente' END WHERE id_cuenta=@IdCuenta;
  COMMIT;
  SELECT @IdAbono IdAbono;
 END TRY BEGIN CATCH IF @@TRANCOUNT>0 ROLLBACK;THROW;END CATCH
END
GO

CREATE OR ALTER PROCEDURE dbo.sp_obtener_abono_core @IdAbono INT
AS
BEGIN
 SET NOCOUNT ON;
 SELECT a.id_abono IdAbono,a.numero_abono NumeroAbono,a.fecha,a.monto,a.metodo_pago MetodoPago,a.referencia,
        a.saldo_anterior SaldoAnterior,a.saldo_posterior SaldoPosterior,r.numero_recibo NotaCredito,c.nombre Cliente,c.nit Nit,
        s.nombre Sucursal,u.nombre Usuario,cx.id_cuenta IdCuenta,v.total TotalCredito,a.correo_contacto Correo,a.telefono_contacto Telefono,
        ISNULL((SELECT SUM(monto) FROM dbo.abono WHERE id_cuenta=cx.id_cuenta AND fecha<=a.fecha),0) PagadoAcumulado
 FROM dbo.abono a JOIN dbo.cuenta_cobrar cx ON cx.id_cuenta=a.id_cuenta JOIN dbo.venta v ON v.id_venta=cx.id_venta
 JOIN dbo.cliente c ON c.id_cliente=v.id_cliente JOIN dbo.recibo r ON r.id_recibo=a.id_recibo_origen
 JOIN dbo.sucursal s ON s.id_sucursal=a.id_sucursal LEFT JOIN dbo.usuario u ON u.id_usuario=a.id_usuario
 WHERE a.id_abono=@IdAbono;
END
GO

CREATE OR ALTER PROCEDURE dbo.sp_listar_abonos_core @IdSucursal INT,@Query VARCHAR(150)='',@FechaDesde DATE=NULL,@FechaHasta DATE=NULL,@MetodoPago VARCHAR(30)=''
AS
BEGIN
 SET NOCOUNT ON;
 SELECT a.id_abono IdAbono,a.numero_abono NumeroAbono,a.fecha,a.monto,a.metodo_pago MetodoPago,c.nombre Cliente,c.nit Nit,
        f.id_factura IdFactura,f.numero_factura NumeroFactura,CAST(CASE WHEN f.id_factura IS NULL THEN 0 ELSE 1 END AS BIT) EsFacturada
 FROM dbo.abono a JOIN dbo.cuenta_cobrar cx ON cx.id_cuenta=a.id_cuenta JOIN dbo.venta v ON v.id_venta=cx.id_venta JOIN dbo.cliente c ON c.id_cliente=v.id_cliente
 LEFT JOIN dbo.factura f ON f.id_abono=a.id_abono AND f.estado='Autorizada'
 WHERE a.id_sucursal=@IdSucursal
   AND (@Query='' OR a.numero_abono LIKE '%'+@Query+'%' OR c.nombre LIKE '%'+@Query+'%' OR ISNULL(c.nit,'') LIKE '%'+@Query+'%')
   AND (@FechaDesde IS NULL OR CAST(a.fecha AS DATE)>=@FechaDesde) AND (@FechaHasta IS NULL OR CAST(a.fecha AS DATE)<=@FechaHasta)
   AND (@MetodoPago='' OR a.metodo_pago=@MetodoPago)
 ORDER BY a.fecha DESC;
END
GO

CREATE OR ALTER PROCEDURE dbo.sp_listar_autorizaciones_credito_core @Query VARCHAR(150)=''
AS
BEGIN
 SET NOCOUNT ON;
 INSERT dbo.historial_estado_credito(id_cliente_credito,estado,fecha,id_usuario,observacion)
 SELECT id_cliente_credito,'Rechazado por vigencia',GETDATE(),NULL,'La autorización llegó a su fecha de vencimiento.'
 FROM dbo.cliente_credito
 WHERE activo=1 AND fecha_vencimiento_autorizacion<CAST(GETDATE() AS DATE);
 UPDATE dbo.cliente_credito SET activo=0,estado_autorizacion='Rechazado por vigencia',fecha_cambio_estado=GETDATE()
 WHERE activo=1 AND fecha_vencimiento_autorizacion<CAST(GETDATE() AS DATE);
 SELECT c.id_cliente IdCliente,c.nombre Cliente,c.nit Nit,c.telefono Telefono,cc.id_cliente_credito IdClienteCredito,
        cc.limite_credito LimiteCredito,ISNULL(cc.dias_maximos_pago,30) DiasMaximosPago,cc.fecha_vencimiento_autorizacion FechaVencimientoAutorizacion,
        cc.observaciones,ISNULL(cc.activo,0) Activo,ISNULL(x.SaldoPendiente,0) SaldoPendiente,
        CASE WHEN cc.id_cliente_credito IS NULL THEN 'Sin autorización' ELSE ISNULL(cc.estado_autorizacion,CASE WHEN cc.activo=1 THEN 'Autorizado' ELSE 'Denegado' END) END EstadoAutorizacion
 FROM dbo.cliente c LEFT JOIN dbo.cliente_credito cc ON cc.id_cliente=c.id_cliente
 OUTER APPLY(SELECT SUM(cx.saldo_pendiente) SaldoPendiente FROM dbo.venta v JOIN dbo.cuenta_cobrar cx ON cx.id_venta=v.id_venta WHERE v.id_cliente=c.id_cliente AND cx.estado='Pendiente')x
 WHERE @Query='' OR c.nombre LIKE '%'+@Query+'%' OR ISNULL(c.nit,'') LIKE '%'+@Query+'%' ORDER BY c.nombre;
END
GO

CREATE OR ALTER PROCEDURE dbo.sp_guardar_autorizacion_credito_core
 @IdCliente INT,@LimiteCredito DECIMAL(12,2),@DiasMaximosPago INT,@FechaVencimientoAutorizacion DATE=NULL,@Observaciones VARCHAR(500)=NULL,@Activo BIT,@IdUsuario INT
AS
BEGIN
 SET NOCOUNT ON;
 IF @LimiteCredito<=0 THROW 50310,'El límite de crédito debe ser mayor que cero.',1;
 IF @DiasMaximosPago<=0 THROW 50311,'Los días máximos de pago deben ser mayores que cero.',1;
 IF @FechaVencimientoAutorizacion IS NOT NULL AND @FechaVencimientoAutorizacion<CAST(GETDATE() AS DATE) THROW 50312,'La vigencia no puede terminar antes de hoy.',1;
 DECLARE @DeudaActual DECIMAL(12,2)=(SELECT ISNULL(SUM(cx.saldo_pendiente),0) FROM dbo.venta v JOIN dbo.cuenta_cobrar cx ON cx.id_venta=v.id_venta WHERE v.id_cliente=@IdCliente AND cx.estado='Pendiente');
 DECLARE @EstadoAnterior VARCHAR(30)=(SELECT estado_autorizacion FROM dbo.cliente_credito WHERE id_cliente=@IdCliente);
 IF @Activo=1 AND @LimiteCredito<@DeudaActual THROW 50313,'El límite autorizado no puede ser menor que la deuda actual del cliente.',1;
 IF EXISTS(SELECT 1 FROM dbo.cliente_credito WHERE id_cliente=@IdCliente)
  UPDATE dbo.cliente_credito SET limite_credito=@LimiteCredito,dias_maximos_pago=@DiasMaximosPago,fecha_vencimiento_autorizacion=@FechaVencimientoAutorizacion,observaciones=NULLIF(LTRIM(RTRIM(@Observaciones)),''),activo=@Activo,estado_autorizacion=CASE WHEN @Activo=1 THEN 'Autorizado' ELSE 'Denegado' END,fecha_cambio_estado=CASE WHEN activo<>@Activo THEN GETDATE() ELSE fecha_cambio_estado END,fecha_autorizacion=GETDATE(),id_usuario_autorizo=@IdUsuario WHERE id_cliente=@IdCliente;
 ELSE
  INSERT dbo.cliente_credito(id_cliente,limite_credito,dias_maximos_pago,fecha_vencimiento_autorizacion,observaciones,activo,estado_autorizacion,fecha_cambio_estado,id_usuario_autorizo) VALUES(@IdCliente,@LimiteCredito,@DiasMaximosPago,@FechaVencimientoAutorizacion,NULLIF(LTRIM(RTRIM(@Observaciones)),''),@Activo,CASE WHEN @Activo=1 THEN 'Autorizado' ELSE 'Denegado' END,GETDATE(),@IdUsuario);
 DECLARE @EstadoNuevo VARCHAR(30)=CASE WHEN @Activo=1 THEN 'Autorizado' ELSE 'Denegado' END;
 IF @EstadoAnterior IS NULL OR @EstadoAnterior<>@EstadoNuevo
  INSERT dbo.historial_estado_credito(id_cliente_credito,estado,fecha,id_usuario,observacion)
  SELECT id_cliente_credito,@EstadoNuevo,GETDATE(),@IdUsuario,CASE WHEN @Activo=1 THEN 'Crédito autorizado.' ELSE 'Crédito denegado.' END FROM dbo.cliente_credito WHERE id_cliente=@IdCliente;
 SELECT id_cliente_credito IdClienteCredito FROM dbo.cliente_credito WHERE id_cliente=@IdCliente;
END
GO

IF OBJECT_ID('dbo.sp_listar_cobros','SN') IS NOT NULL DROP SYNONYM dbo.sp_listar_cobros;
IF OBJECT_ID('dbo.sp_cuentas_pendientes_cobro','SN') IS NOT NULL DROP SYNONYM dbo.sp_cuentas_pendientes_cobro;
IF OBJECT_ID('dbo.sp_estado_cuenta_cliente','SN') IS NOT NULL DROP SYNONYM dbo.sp_estado_cuenta_cliente;
IF OBJECT_ID('dbo.sp_registrar_abono','SN') IS NOT NULL DROP SYNONYM dbo.sp_registrar_abono;
IF OBJECT_ID('dbo.sp_obtener_abono','SN') IS NOT NULL DROP SYNONYM dbo.sp_obtener_abono;
IF OBJECT_ID('dbo.sp_listar_abonos','SN') IS NOT NULL DROP SYNONYM dbo.sp_listar_abonos;
IF OBJECT_ID('dbo.sp_listar_autorizaciones_credito','SN') IS NOT NULL DROP SYNONYM dbo.sp_listar_autorizaciones_credito;
IF OBJECT_ID('dbo.sp_guardar_autorizacion_credito','SN') IS NOT NULL DROP SYNONYM dbo.sp_guardar_autorizacion_credito;
GO
CREATE SYNONYM dbo.sp_listar_cobros FOR dbo.sp_listar_cobros_core;
CREATE SYNONYM dbo.sp_cuentas_pendientes_cobro FOR dbo.sp_cuentas_pendientes_cobro_core;
CREATE SYNONYM dbo.sp_estado_cuenta_cliente FOR dbo.sp_estado_cuenta_cliente_core;
CREATE SYNONYM dbo.sp_registrar_abono FOR dbo.sp_registrar_abono_core;
CREATE SYNONYM dbo.sp_obtener_abono FOR dbo.sp_obtener_abono_core;
CREATE SYNONYM dbo.sp_listar_abonos FOR dbo.sp_listar_abonos_core;
CREATE SYNONYM dbo.sp_listar_autorizaciones_credito FOR dbo.sp_listar_autorizaciones_credito_core;
CREATE SYNONYM dbo.sp_guardar_autorizacion_credito FOR dbo.sp_guardar_autorizacion_credito_core;
GO
