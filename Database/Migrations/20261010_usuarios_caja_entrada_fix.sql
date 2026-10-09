-- Corrige el detalle/PDF de entradas y registra el usuario responsable en caja.
IF COL_LENGTH('dbo.compra','id_usuario') IS NULL ALTER TABLE dbo.compra ADD id_usuario INT NULL;
IF COL_LENGTH('dbo.venta','id_usuario') IS NULL ALTER TABLE dbo.venta ADD id_usuario INT NULL;
GO

UPDATE c SET id_usuario=sc.id_usuario
FROM dbo.compra c JOIN dbo.sesion_caja sc ON sc.id_sesion=c.id_sesion
WHERE c.id_usuario IS NULL;
UPDATE v SET id_usuario=sc.id_usuario
FROM dbo.venta v JOIN dbo.sesion_caja sc ON sc.id_sesion=v.id_sesion
WHERE v.id_usuario IS NULL;
GO

IF NOT EXISTS(SELECT 1 FROM sys.foreign_keys WHERE name='fk_compra_usuario' AND parent_object_id=OBJECT_ID('dbo.compra'))
 ALTER TABLE dbo.compra ADD CONSTRAINT fk_compra_usuario FOREIGN KEY(id_usuario) REFERENCES dbo.usuario(id_usuario);
IF NOT EXISTS(SELECT 1 FROM sys.foreign_keys WHERE name='fk_venta_usuario' AND parent_object_id=OBJECT_ID('dbo.venta'))
 ALTER TABLE dbo.venta ADD CONSTRAINT fk_venta_usuario FOREIGN KEY(id_usuario) REFERENCES dbo.usuario(id_usuario);
GO

CREATE OR ALTER PROCEDURE dbo.sp_obtener_entrada_pedido_core @IdCompra INT,@IdSucursal INT AS
BEGIN
 SET NOCOUNT ON;
 SELECT c.id_compra IdCompra,c.numero_pedido NumeroPedido,c.fecha Fecha,c.total Total,c.metodo_pago MetodoPago,c.observaciones Observaciones,
        pr.nombre ProveedorNombre,s.nombre SucursalNombre,p.id_producto IdProducto,p.cod_producto Codigo,p.nombre ProductoNombre,
        dc.cantidad Cantidad,dc.costo_unitario CostoUnitario,dc.subtotal Subtotal
 FROM dbo.compra c JOIN dbo.proveedor pr ON pr.id_proveedor=c.id_proveedor JOIN dbo.sucursal s ON s.id_sucursal=c.id_sucursal
 JOIN dbo.detalle_compra dc ON dc.id_compra=c.id_compra JOIN dbo.producto p ON p.id_producto=dc.id_producto
 WHERE c.id_compra=@IdCompra AND c.id_sucursal=@IdSucursal ORDER BY p.nombre;
END
GO

CREATE OR ALTER PROCEDURE dbo.sp_registrar_entrada_pedido_core @IdSucursal INT,@IdProveedor INT,@IdUsuario INT,@Fecha DATETIME=NULL,@MetodoPago VARCHAR(30),@Observaciones VARCHAR(500)=NULL,@Detalles NVARCHAR(MAX) AS
BEGIN
 SET NOCOUNT ON; SET XACT_ABORT ON;
 IF NOT EXISTS(SELECT 1 FROM OPENJSON(@Detalles)) THROW 50002,'El pedido debe incluir al menos un producto.',1;
 BEGIN TRANSACTION;
 DECLARE @Detalle TABLE(IdProducto INT,Cantidad INT,CostoUnitario DECIMAL(12,2));
 INSERT @Detalle SELECT IdProducto,Cantidad,CostoUnitario FROM OPENJSON(@Detalles) WITH(IdProducto INT '$.IdProducto',Cantidad INT '$.Cantidad',CostoUnitario DECIMAL(12,2) '$.CostoUnitario');
 IF EXISTS(SELECT 1 FROM @Detalle WHERE IdProducto IS NULL OR Cantidad<=0 OR CostoUnitario<0) THROW 50003,'Las cantidades, productos y costos no son válidos.',1;
 IF EXISTS(SELECT 1 FROM @Detalle d WHERE NOT EXISTS(SELECT 1 FROM dbo.proveedor_producto pp WHERE pp.id_proveedor=@IdProveedor AND pp.id_producto=d.IdProducto AND pp.activo=1)) THROW 50004,'Uno de los productos no pertenece al proveedor seleccionado.',1;
 IF @MetodoPago NOT IN('efectivo','tarjeta','transferencia','credito') THROW 50005,'El método de pago no es válido.',1;
 DECLARE @IdSesion INT=NULL;
 IF @MetodoPago='efectivo' BEGIN SELECT TOP(1) @IdSesion=id_sesion FROM dbo.sesion_caja WHERE id_sucursal=@IdSucursal AND fecha_cierre IS NULL ORDER BY fecha_apertura DESC; IF @IdSesion IS NULL THROW 50007,'No hay una caja abierta en esta sucursal.',1; END;
 DECLARE @Total DECIMAL(12,2)=(SELECT SUM(Cantidad*CostoUnitario) FROM @Detalle);
 INSERT dbo.compra(fecha,total,id_proveedor,id_sucursal,numero_pedido,metodo_pago,observaciones,id_sesion,id_usuario) VALUES(ISNULL(@Fecha,GETDATE()),@Total,@IdProveedor,@IdSucursal,'PENDIENTE',@MetodoPago,NULLIF(LTRIM(RTRIM(@Observaciones)),''),@IdSesion,@IdUsuario);
 DECLARE @IdCompra INT=CAST(SCOPE_IDENTITY() AS INT);
 UPDATE dbo.compra SET numero_pedido=CONCAT('PED-',RIGHT('00000000'+CAST(@IdCompra AS VARCHAR(10)),8)) WHERE id_compra=@IdCompra;
 INSERT dbo.detalle_compra(id_compra,id_producto,cantidad,costo_unitario,subtotal) SELECT @IdCompra,IdProducto,Cantidad,CostoUnitario,Cantidad*CostoUnitario FROM @Detalle;
 MERGE dbo.inventario AS t USING(SELECT IdProducto,SUM(Cantidad) Cantidad FROM @Detalle GROUP BY IdProducto) s ON t.id_sucursal=@IdSucursal AND t.id_producto=s.IdProducto
 WHEN MATCHED THEN UPDATE SET stock=t.stock+s.Cantidad WHEN NOT MATCHED THEN INSERT(id_sucursal,id_producto,stock) VALUES(@IdSucursal,s.IdProducto,s.Cantidad);
 COMMIT; SELECT @IdCompra IdCompra,@Total Total;
END
GO

CREATE OR ALTER PROCEDURE dbo.sp_movimientos_caja_core @IdUsuario INT,@IdSucursal INT,@IdSesion INT=NULL AS
BEGIN
 SET NOCOUNT ON; DECLARE @Id INT=@IdSesion;
 IF @Id IS NULL SELECT TOP(1) @Id=id_sesion FROM dbo.sesion_caja WHERE id_sucursal=@IdSucursal AND fecha_cierre IS NULL ORDER BY fecha_apertura DESC;
 IF @Id IS NULL RETURN;
 IF NOT EXISTS(SELECT 1 FROM dbo.sesion_caja WHERE id_sesion=@Id AND id_sucursal=@IdSucursal) THROW 50401,'El cierre no pertenece a la sucursal seleccionada.',1;
 SELECT Tipo,Numero,Fecha,MetodoPago,Monto,Estado,Usuario FROM(
  SELECT CASE WHEN r.metodo_pago='credito' THEN 'Venta a crédito' ELSE 'Recibo' END,r.numero_recibo,r.fecha_pago,r.metodo_pago,r.monto,r.estado,COALESCE(uv.nombre,us.nombre,'Sistema') FROM dbo.venta v JOIN dbo.factura f ON f.id_venta=v.id_venta JOIN dbo.recibo r ON r.id_factura=f.id_factura JOIN dbo.sesion_caja sc ON sc.id_sesion=v.id_sesion LEFT JOIN dbo.usuario uv ON uv.id_usuario=v.id_usuario LEFT JOIN dbo.usuario us ON us.id_usuario=sc.id_usuario WHERE v.id_sesion=@Id
  UNION ALL SELECT 'Entrada de pedido',c.numero_pedido,c.fecha,c.metodo_pago,-c.total,'Registrada',COALESCE(uc.nombre,us.nombre,'Sistema') FROM dbo.compra c JOIN dbo.sesion_caja sc ON sc.id_sesion=c.id_sesion LEFT JOIN dbo.usuario uc ON uc.id_usuario=c.id_usuario LEFT JOIN dbo.usuario us ON us.id_usuario=sc.id_usuario WHERE c.id_sesion=@Id AND c.id_sucursal=@IdSucursal
  UNION ALL SELECT 'Abono',a.numero_abono,a.fecha,a.metodo_pago,a.monto,'Registrado',COALESCE(ua.nombre,us.nombre,'Sistema') FROM dbo.abono a JOIN dbo.sesion_caja sc ON sc.id_sesion=a.id_sesion LEFT JOIN dbo.usuario ua ON ua.id_usuario=a.id_usuario LEFT JOIN dbo.usuario us ON us.id_usuario=sc.id_usuario WHERE a.id_sesion=@Id
  UNION ALL SELECT 'Salida de caja',CONCAT('SAL-',RIGHT('00000000'+CAST(m.id_movimiento AS VARCHAR),8)),m.fecha,'efectivo',-m.monto,m.concepto,COALESCE(u.nombre,'Sistema') FROM dbo.movimiento_caja_manual m LEFT JOIN dbo.usuario u ON u.id_usuario=m.id_usuario WHERE m.id_sesion=@Id
 )mov(Tipo,Numero,Fecha,MetodoPago,Monto,Estado,Usuario) ORDER BY Fecha DESC;
END
GO
