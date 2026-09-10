SET ANSI_NULLS ON;
SET QUOTED_IDENTIFIER ON;
GO
CREATE OR ALTER PROCEDURE dbo.sp_registrar_traslado_core
    @IdSucursalOrigen INT, @IdSucursalDestino INT, @IdUsuario INT,
    @Observaciones VARCHAR(500)=NULL, @Detalles NVARCHAR(MAX)
AS
BEGIN
    SET NOCOUNT ON; SET XACT_ABORT ON;
    IF @IdSucursalOrigen=@IdSucursalDestino THROW 50701,'La sucursal de destino debe ser diferente.',1;
    IF ISJSON(@Detalles)<>1 THROW 50702,'El detalle del traslado no es válido.',1;
    DECLARE @Items TABLE(IdProducto INT PRIMARY KEY,Cantidad INT NOT NULL);
    INSERT @Items(IdProducto,Cantidad)
    SELECT IdProducto,SUM(Cantidad) FROM OPENJSON(@Detalles) WITH(IdProducto INT '$.IdProducto',Cantidad INT '$.Cantidad') GROUP BY IdProducto;
    IF NOT EXISTS(SELECT 1 FROM @Items) OR EXISTS(SELECT 1 FROM @Items WHERE Cantidad<=0) THROW 50703,'Agrega productos con cantidades válidas.',1;
    IF EXISTS(SELECT 1 FROM @Items d LEFT JOIN dbo.inventario i ON i.id_producto=d.IdProducto AND i.id_sucursal=@IdSucursalOrigen WHERE ISNULL(i.stock,0)<d.Cantidad) THROW 50704,'Uno de los productos no tiene existencia suficiente en la sucursal de origen.',1;
    BEGIN TRAN;
    INSERT dbo.traslado(id_sucursal_origen,id_sucursal_destino,fecha,estado,observaciones,id_usuario) VALUES(@IdSucursalOrigen,@IdSucursalDestino,GETDATE(),'Enviado',NULLIF(LTRIM(RTRIM(@Observaciones)),''),@IdUsuario);
    DECLARE @IdTraslado INT=CONVERT(INT,SCOPE_IDENTITY()),@Numero VARCHAR(30);
    SET @Numero=CONCAT('NE-',FORMAT(GETDATE(),'yyyyMM'),'-',RIGHT('000000'+CONVERT(VARCHAR(10),@IdTraslado),6));
    UPDATE dbo.traslado SET numero_traslado=@Numero WHERE id_traslado=@IdTraslado;
    INSERT dbo.detalle_traslado(id_traslado,id_producto,cantidad) SELECT @IdTraslado,IdProducto,Cantidad FROM @Items;
    UPDATE i SET stock=i.stock-d.Cantidad FROM dbo.inventario i JOIN @Items d ON d.IdProducto=i.id_producto WHERE i.id_sucursal=@IdSucursalOrigen;
    MERGE dbo.inventario AS target USING (SELECT @IdSucursalDestino IdSucursal,IdProducto,Cantidad FROM @Items) source ON target.id_sucursal=source.IdSucursal AND target.id_producto=source.IdProducto
    WHEN MATCHED THEN UPDATE SET stock=target.stock+source.Cantidad
    WHEN NOT MATCHED THEN INSERT(id_sucursal,id_producto,stock) VALUES(source.IdSucursal,source.IdProducto,source.Cantidad);
    COMMIT;
    SELECT @IdTraslado IdTraslado,@Numero NumeroTraslado;
END
GO

CREATE OR ALTER PROCEDURE dbo.sp_buscar_traslados_core
    @IdSucursal INT=NULL,@Query VARCHAR(100)='',@FechaDesde DATE=NULL,@FechaHasta DATE=NULL,@IdTraslado INT=NULL
AS
BEGIN
    SET NOCOUNT ON;
    SELECT t.id_traslado IdTraslado,t.numero_traslado NumeroTraslado,t.fecha Fecha,t.estado Estado,t.id_sucursal_origen IdSucursalOrigen,so.nombre SucursalOrigen,
           t.id_sucursal_destino IdSucursalDestino,sd.nombre SucursalDestino,u.username Usuario,t.observaciones Observaciones,
           p.id_producto IdProducto,p.cod_producto Codigo,p.nombre Producto,dt.cantidad Cantidad
    FROM dbo.traslado t JOIN dbo.sucursal so ON so.id_sucursal=t.id_sucursal_origen JOIN dbo.sucursal sd ON sd.id_sucursal=t.id_sucursal_destino
    LEFT JOIN dbo.usuario u ON u.id_usuario=t.id_usuario JOIN dbo.detalle_traslado dt ON dt.id_traslado=t.id_traslado JOIN dbo.producto p ON p.id_producto=dt.id_producto
    WHERE (@IdTraslado IS NULL OR t.id_traslado=@IdTraslado) AND (@IdSucursal IS NULL OR t.id_sucursal_origen=@IdSucursal OR t.id_sucursal_destino=@IdSucursal)
      AND (ISNULL(@Query,'')='' OR t.numero_traslado LIKE '%'+@Query+'%' OR p.nombre LIKE '%'+@Query+'%' OR so.nombre LIKE '%'+@Query+'%' OR sd.nombre LIKE '%'+@Query+'%')
      AND (@FechaDesde IS NULL OR t.fecha>=@FechaDesde) AND (@FechaHasta IS NULL OR t.fecha<DATEADD(DAY,1,@FechaHasta))
    ORDER BY t.fecha DESC,t.id_traslado DESC,p.nombre;
END
GO

IF OBJECT_ID('dbo.sp_registrar_traslado','SN') IS NOT NULL DROP SYNONYM dbo.sp_registrar_traslado;
GO
CREATE SYNONYM dbo.sp_registrar_traslado FOR dbo.sp_registrar_traslado_core;
GO
IF OBJECT_ID('dbo.sp_buscar_traslados','SN') IS NOT NULL DROP SYNONYM dbo.sp_buscar_traslados;
GO
CREATE SYNONYM dbo.sp_buscar_traslados FOR dbo.sp_buscar_traslados_core;
GO
