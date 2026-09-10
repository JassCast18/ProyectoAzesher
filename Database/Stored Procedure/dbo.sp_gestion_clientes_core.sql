CREATE OR ALTER PROCEDURE dbo.sp_listar_clientes_core
    @Query VARCHAR(100) = '', @IdSucursal INT
AS
BEGIN
    SET NOCOUNT ON;
    WITH VentasSucursal AS (
        SELECT v.id_venta, v.id_cliente, v.total
        FROM dbo.venta v
        JOIN dbo.sesion_caja sc ON sc.id_sesion = v.id_sesion
        OUTER APPLY (
            SELECT TOP (1) r.id_sucursal
            FROM dbo.factura f
            JOIN dbo.recibo r ON r.id_factura = f.id_factura
            WHERE f.id_venta = v.id_venta
            ORDER BY r.id_recibo DESC
        ) recibo
        WHERE COALESCE(sc.id_sucursal, recibo.id_sucursal) = @IdSucursal
    )
    SELECT c.id_cliente IdCliente, c.nombre Nombre, c.nit Nit, c.telefono Telefono, c.direccion Direccion,
           COUNT(v.id_venta) Compras, ISNULL(SUM(v.total), 0) TotalComprado
    FROM dbo.cliente c
    LEFT JOIN VentasSucursal v ON v.id_cliente = c.id_cliente
    WHERE ISNULL(@Query,'')='' OR c.nombre LIKE '%'+@Query+'%' OR ISNULL(c.nit,'') LIKE '%'+@Query+'%' OR ISNULL(c.telefono,'') LIKE '%'+@Query+'%'
    GROUP BY c.id_cliente,c.nombre,c.nit,c.telefono,c.direccion
    ORDER BY c.nombre;
END
GO

CREATE OR ALTER PROCEDURE dbo.sp_crear_cliente_core
    @Nombre VARCHAR(150), @Nit VARCHAR(20)=NULL, @Telefono VARCHAR(20)=NULL, @Direccion VARCHAR(MAX)=NULL
AS
BEGIN
    SET NOCOUNT ON;
    IF NULLIF(LTRIM(RTRIM(@Nit)),'') IS NOT NULL AND EXISTS(SELECT 1 FROM dbo.cliente WHERE nit=@Nit)
        THROW 50301,'Ya existe un cliente con ese NIT.',1;
    INSERT dbo.cliente(nombre,nit,telefono,direccion)
    VALUES(LTRIM(RTRIM(@Nombre)),NULLIF(LTRIM(RTRIM(@Nit)),''),NULLIF(LTRIM(RTRIM(@Telefono)),''),NULLIF(LTRIM(RTRIM(@Direccion)),''));
    SELECT CAST(SCOPE_IDENTITY() AS INT) IdCliente;
END
GO

CREATE OR ALTER PROCEDURE dbo.sp_historial_cliente_core
    @IdCliente INT, @IdSucursal INT, @FechaDesde DATE=NULL, @FechaHasta DATE=NULL
AS
BEGIN
    SET NOCOUNT ON;
    SELECT v.id_venta IdVenta,v.fecha Fecha,v.total Total,v.tipo_pago TipoPago,r.id_recibo IdRecibo,r.numero_recibo NumeroRecibo,r.estado EstadoRecibo,
           f.id_factura IdFactura,f.numero_factura NumeroFactura,f.estado EstadoFactura,ISNULL(cx.saldo_pendiente,0) SaldoPendiente
    FROM dbo.venta v
    JOIN dbo.sesion_caja sc ON sc.id_sesion=v.id_sesion
    LEFT JOIN dbo.factura f ON f.id_venta=v.id_venta
    LEFT JOIN dbo.recibo r ON r.id_factura=f.id_factura
    LEFT JOIN dbo.cuenta_cobrar cx ON cx.id_venta=v.id_venta
    WHERE v.id_cliente=@IdCliente
      AND COALESCE(sc.id_sucursal,r.id_sucursal)=@IdSucursal
      AND (@FechaDesde IS NULL OR CAST(v.fecha AS DATE)>=@FechaDesde)
      AND (@FechaHasta IS NULL OR CAST(v.fecha AS DATE)<=@FechaHasta)
    ORDER BY v.fecha DESC;
END
GO

IF OBJECT_ID('dbo.sp_listar_clientes','SN') IS NOT NULL DROP SYNONYM dbo.sp_listar_clientes;
GO
CREATE SYNONYM dbo.sp_listar_clientes FOR dbo.sp_listar_clientes_core;
GO
IF OBJECT_ID('dbo.sp_crear_cliente','SN') IS NOT NULL DROP SYNONYM dbo.sp_crear_cliente;
GO
CREATE SYNONYM dbo.sp_crear_cliente FOR dbo.sp_crear_cliente_core;
GO
IF OBJECT_ID('dbo.sp_historial_cliente','SN') IS NOT NULL DROP SYNONYM dbo.sp_historial_cliente;
GO
CREATE SYNONYM dbo.sp_historial_cliente FOR dbo.sp_historial_cliente_core;
GO
