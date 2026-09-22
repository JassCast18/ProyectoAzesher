CREATE OR ALTER PROCEDURE dbo.sp_movimientos_inventario_core
    @IdSucursal INT = NULL,
    @IdProducto INT = NULL,
    @Query VARCHAR(200) = '',
    @Tipo VARCHAR(40) = '',
    @FechaDesde DATE = NULL,
    @FechaHasta DATE = NULL,
    @Pagina INT = 1,
    @TamanoPagina INT = 25
AS
BEGIN
    SET NOCOUNT ON;
    SET @Query = LTRIM(RTRIM(ISNULL(@Query,'')));
    SET @Tipo = LOWER(LTRIM(RTRIM(ISNULL(@Tipo,''))));
    SET @Pagina = CASE WHEN @Pagina < 1 THEN 1 ELSE @Pagina END;
    SET @TamanoPagina = CASE WHEN @TamanoPagina < 1 THEN 25 WHEN @TamanoPagina > 100 THEN 100 ELSE @TamanoPagina END;

    ;WITH Movimientos AS (
        SELECT CONCAT('compra-',dc.id_detalle_compra) IdMovimiento,c.fecha Fecha,p.id_producto IdProducto,
               p.cod_producto Codigo,p.nombre Producto,c.id_sucursal IdSucursal,s.nombre Sucursal,
               CAST('Entrada de pedido' AS VARCHAR(40)) Tipo,CAST('Entrada' AS VARCHAR(10)) Direccion,
               dc.cantidad Cantidad,c.numero_pedido Documento,
               CAST(CONCAT('Proveedor: ',pr.nombre,CASE WHEN NULLIF(c.observaciones,'') IS NULL THEN '' ELSE CONCAT(' · ',c.observaciones) END) AS VARCHAR(600)) Detalle,
               COALESCE(u.nombre,'Sistema') Usuario
        FROM dbo.detalle_compra dc
        JOIN dbo.compra c ON c.id_compra=dc.id_compra
        JOIN dbo.producto p ON p.id_producto=dc.id_producto
        JOIN dbo.sucursal s ON s.id_sucursal=c.id_sucursal
        JOIN dbo.proveedor pr ON pr.id_proveedor=c.id_proveedor
        LEFT JOIN dbo.sesion_caja sc ON sc.id_sesion=c.id_sesion
        LEFT JOIN dbo.usuario u ON u.id_usuario=sc.id_usuario

        UNION ALL
        SELECT CONCAT('venta-',dv.id_detalle),v.fecha,p.id_producto,p.cod_producto,p.nombre,sc.id_sucursal,s.nombre,
               'Venta','Salida',dv.cantidad,COALESCE(rc.numero_recibo,f.numero_factura,CONCAT('VENTA-',v.id_venta)),
               CAST(CONCAT('Cliente: ',cl.nombre) AS VARCHAR(600)),COALESCE(u.nombre,vd.nombre,'Sistema')
        FROM dbo.detalle_venta dv
        JOIN dbo.venta v ON v.id_venta=dv.id_venta
        JOIN dbo.producto p ON p.id_producto=dv.id_producto
        JOIN dbo.sesion_caja sc ON sc.id_sesion=v.id_sesion
        JOIN dbo.sucursal s ON s.id_sucursal=sc.id_sucursal
        JOIN dbo.cliente cl ON cl.id_cliente=v.id_cliente
        LEFT JOIN dbo.vendedor vd ON vd.id_vendedor=v.id_vendedor
        LEFT JOIN dbo.usuario u ON u.id_usuario=sc.id_usuario
        OUTER APPLY(SELECT TOP(1) fa.id_factura,fa.numero_factura FROM dbo.factura fa WHERE fa.id_venta=v.id_venta ORDER BY fa.id_factura) f
        OUTER APPLY(SELECT TOP(1) r.numero_recibo FROM dbo.recibo r WHERE r.id_factura=f.id_factura ORDER BY r.id_recibo) rc

        UNION ALL
        SELECT CONCAT('anulacion-',dv.id_detalle),r.fecha_anulacion,p.id_producto,p.cod_producto,p.nombre,r.id_sucursal,s.nombre,
               'Anulación de venta','Entrada',dv.cantidad,r.numero_recibo,
               CAST(CONCAT('Devolución al inventario. Motivo: ',ISNULL(r.motivo_anulacion,'No especificado')) AS VARCHAR(600)),COALESCE(u.nombre,'Sistema')
        FROM dbo.recibo r
        JOIN dbo.factura f ON f.id_factura=r.id_factura
        JOIN dbo.detalle_venta dv ON dv.id_venta=f.id_venta
        JOIN dbo.producto p ON p.id_producto=dv.id_producto
        JOIN dbo.sucursal s ON s.id_sucursal=r.id_sucursal
        LEFT JOIN dbo.usuario u ON u.id_usuario=r.id_usuario_anulacion
        WHERE r.estado='Anulado' AND r.fecha_anulacion IS NOT NULL

        UNION ALL
        SELECT CONCAT('traslado-s-',dt.id_detalle_traslado),t.fecha,p.id_producto,p.cod_producto,p.nombre,t.id_sucursal_origen,so.nombre,
               'Traslado enviado','Salida',dt.cantidad,t.numero_traslado,
               CAST(CONCAT('Destino: ',sd.nombre,CASE WHEN NULLIF(t.observaciones,'') IS NULL THEN '' ELSE CONCAT(' · ',t.observaciones) END) AS VARCHAR(600)),COALESCE(u.nombre,'Sistema')
        FROM dbo.detalle_traslado dt
        JOIN dbo.traslado t ON t.id_traslado=dt.id_traslado
        JOIN dbo.producto p ON p.id_producto=dt.id_producto
        JOIN dbo.sucursal so ON so.id_sucursal=t.id_sucursal_origen
        JOIN dbo.sucursal sd ON sd.id_sucursal=t.id_sucursal_destino
        LEFT JOIN dbo.usuario u ON u.id_usuario=t.id_usuario

        UNION ALL
        SELECT CONCAT('traslado-e-',dt.id_detalle_traslado),t.fecha,p.id_producto,p.cod_producto,p.nombre,t.id_sucursal_destino,sd.nombre,
               'Traslado recibido','Entrada',dt.cantidad,t.numero_traslado,
               CAST(CONCAT('Origen: ',so.nombre,CASE WHEN NULLIF(t.observaciones,'') IS NULL THEN '' ELSE CONCAT(' · ',t.observaciones) END) AS VARCHAR(600)),COALESCE(u.nombre,'Sistema')
        FROM dbo.detalle_traslado dt
        JOIN dbo.traslado t ON t.id_traslado=dt.id_traslado
        JOIN dbo.producto p ON p.id_producto=dt.id_producto
        JOIN dbo.sucursal so ON so.id_sucursal=t.id_sucursal_origen
        JOIN dbo.sucursal sd ON sd.id_sucursal=t.id_sucursal_destino
        LEFT JOIN dbo.usuario u ON u.id_usuario=t.id_usuario

        UNION ALL
        SELECT CONCAT('salida-',d.id_detalle_salida),si.fecha,p.id_producto,p.cod_producto,p.nombre,si.id_sucursal,s.nombre,
               'Salida de inventario','Salida',d.cantidad,si.numero_salida,
               CAST(CONCAT('Motivo: ',COALESCE(ms.nombre,si.motivo),CASE WHEN NULLIF(si.observaciones,'') IS NULL THEN '' ELSE CONCAT(' · ',si.observaciones) END) AS VARCHAR(600)),COALESCE(u.nombre,'Sistema')
        FROM dbo.detalle_salida_inventario d
        JOIN dbo.salida_inventario si ON si.id_salida=d.id_salida
        JOIN dbo.producto p ON p.id_producto=d.id_producto
        JOIN dbo.sucursal s ON s.id_sucursal=si.id_sucursal
        LEFT JOIN dbo.motivo_salida_inventario ms ON ms.codigo=si.motivo
        LEFT JOIN dbo.usuario u ON u.id_usuario=si.id_usuario
    ), Filtrados AS (
        SELECT *,COUNT(*) OVER() TotalRegistros
        FROM Movimientos
        WHERE (@IdSucursal IS NULL OR IdSucursal=@IdSucursal)
          AND (@IdProducto IS NULL OR IdProducto=@IdProducto)
          AND (@Tipo='' OR LOWER(Tipo)=@Tipo OR LOWER(Direccion)=@Tipo)
          AND (@FechaDesde IS NULL OR Fecha>=@FechaDesde)
          AND (@FechaHasta IS NULL OR Fecha<DATEADD(DAY,1,@FechaHasta))
          AND (@Query='' OR Producto LIKE '%'+@Query+'%' OR ISNULL(Codigo,'') LIKE '%'+@Query+'%'
               OR ISNULL(Documento,'') LIKE '%'+@Query+'%' OR ISNULL(Detalle,'') LIKE '%'+@Query+'%')
    )
    SELECT IdMovimiento,Fecha,IdProducto,Codigo,Producto,IdSucursal,Sucursal,Tipo,Direccion,Cantidad,Documento,Detalle,Usuario,TotalRegistros
    FROM Filtrados
    ORDER BY Fecha DESC,IdMovimiento DESC
    OFFSET (@Pagina-1)*@TamanoPagina ROWS FETCH NEXT @TamanoPagina ROWS ONLY;
END
GO

IF OBJECT_ID('dbo.sp_movimientos_inventario','SN') IS NOT NULL DROP SYNONYM dbo.sp_movimientos_inventario;
GO
CREATE SYNONYM dbo.sp_movimientos_inventario FOR dbo.sp_movimientos_inventario_core;
GO
