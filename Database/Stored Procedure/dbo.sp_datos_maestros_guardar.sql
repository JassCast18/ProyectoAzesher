CREATE OR ALTER PROCEDURE dbo.sp_datos_maestros_guardar
    @Entidad VARCHAR(40), @Id INT = NULL, @Datos NVARCHAR(MAX)
AS
BEGIN
    SET NOCOUNT ON; SET XACT_ABORT ON;
    IF ISJSON(@Datos) <> 1 THROW 50002, 'Los datos enviados no son válidos.', 1;

    IF @Entidad='sucursales'
    BEGIN
        DECLARE @nombreS VARCHAR(150)=JSON_VALUE(@Datos,'$.nombre'), @color VARCHAR(7)=UPPER(JSON_VALUE(@Datos,'$.colorIdentificacion'));
        IF NULLIF(LTRIM(RTRIM(@nombreS)),'') IS NULL OR @color NOT LIKE '#[0-9A-F][0-9A-F][0-9A-F][0-9A-F][0-9A-F][0-9A-F]' THROW 50003, 'Nombre y color hexadecimal son obligatorios.',1;
        IF @Id IS NULL BEGIN INSERT dbo.sucursal(nombre,direccion,telefono,color_identificacion) VALUES(@nombreS,JSON_VALUE(@Datos,'$.direccion'),JSON_VALUE(@Datos,'$.telefono'),@color); SELECT CONVERT(INT,SCOPE_IDENTITY()); END
        ELSE BEGIN UPDATE dbo.sucursal SET nombre=@nombreS,direccion=JSON_VALUE(@Datos,'$.direccion'),telefono=JSON_VALUE(@Datos,'$.telefono'),color_identificacion=@color WHERE id_sucursal=@Id; SELECT @Id; END
    END
    ELSE IF @Entidad='proveedores'
    BEGIN
        IF @Id IS NULL BEGIN INSERT dbo.proveedor(nombre,telefono,direccion) VALUES(JSON_VALUE(@Datos,'$.nombre'),JSON_VALUE(@Datos,'$.telefono'),JSON_VALUE(@Datos,'$.direccion')); SELECT CONVERT(INT,SCOPE_IDENTITY()); END
        ELSE BEGIN UPDATE dbo.proveedor SET nombre=JSON_VALUE(@Datos,'$.nombre'),telefono=JSON_VALUE(@Datos,'$.telefono'),direccion=JSON_VALUE(@Datos,'$.direccion') WHERE id_proveedor=@Id; SELECT @Id; END
    END
    ELSE IF @Entidad='productos'
    BEGIN
        DECLARE @idCategoria INT=TRY_CONVERT(INT,JSON_VALUE(@Datos,'$.idCategoria'));
        IF @Id IS NULL BEGIN INSERT dbo.producto(cod_producto,nombre,descripcion,precio,id_categoria) VALUES(JSON_VALUE(@Datos,'$.codigo'),JSON_VALUE(@Datos,'$.nombre'),JSON_VALUE(@Datos,'$.descripcion'),TRY_CONVERT(DECIMAL(12,2),JSON_VALUE(@Datos,'$.precio')),@idCategoria); SELECT CONVERT(INT,SCOPE_IDENTITY()); END
        ELSE BEGIN UPDATE dbo.producto SET cod_producto=JSON_VALUE(@Datos,'$.codigo'),nombre=JSON_VALUE(@Datos,'$.nombre'),descripcion=JSON_VALUE(@Datos,'$.descripcion'),precio=TRY_CONVERT(DECIMAL(12,2),JSON_VALUE(@Datos,'$.precio')),id_categoria=@idCategoria WHERE id_producto=@Id; SELECT @Id; END
    END
    ELSE IF @Entidad='proveedor-producto'
    BEGIN
        DECLARE @idProveedor INT=TRY_CONVERT(INT,JSON_VALUE(@Datos,'$.idProveedor')), @idProducto INT=TRY_CONVERT(INT,JSON_VALUE(@Datos,'$.idProducto'));
        MERGE dbo.proveedor_producto AS t USING (SELECT @idProveedor id_proveedor,@idProducto id_producto) s ON t.id_proveedor=s.id_proveedor AND t.id_producto=s.id_producto WHEN MATCHED THEN UPDATE SET activo=1,fecha_asignacion=GETDATE() WHEN NOT MATCHED THEN INSERT(id_proveedor,id_producto,activo) VALUES(s.id_proveedor,s.id_producto,1);
        SELECT @idProducto;
    END
    ELSE IF @Entidad='vendedores'
    BEGIN
        IF @Id IS NULL BEGIN INSERT dbo.vendedor(nombre,telefono,id_sucursal) VALUES(JSON_VALUE(@Datos,'$.nombre'),JSON_VALUE(@Datos,'$.telefono'),TRY_CONVERT(INT,JSON_VALUE(@Datos,'$.idSucursal'))); SELECT CONVERT(INT,SCOPE_IDENTITY()); END
        ELSE BEGIN UPDATE dbo.vendedor SET nombre=JSON_VALUE(@Datos,'$.nombre'),telefono=JSON_VALUE(@Datos,'$.telefono'),id_sucursal=TRY_CONVERT(INT,JSON_VALUE(@Datos,'$.idSucursal')) WHERE id_vendedor=@Id; SELECT @Id; END
    END
    ELSE IF @Entidad='monedas'
    BEGIN
        IF @Id IS NULL BEGIN INSERT dbo.moneda(codigo,nombre,simbolo,activo) VALUES(JSON_VALUE(@Datos,'$.codigo'),JSON_VALUE(@Datos,'$.nombre'),JSON_VALUE(@Datos,'$.simbolo'),COALESCE(TRY_CONVERT(BIT,JSON_VALUE(@Datos,'$.activo')),1)); SELECT CONVERT(INT,SCOPE_IDENTITY()); END
        ELSE BEGIN UPDATE dbo.moneda SET codigo=JSON_VALUE(@Datos,'$.codigo'),nombre=JSON_VALUE(@Datos,'$.nombre'),simbolo=JSON_VALUE(@Datos,'$.simbolo'),activo=COALESCE(TRY_CONVERT(BIT,JSON_VALUE(@Datos,'$.activo')),1) WHERE id_moneda=@Id; SELECT @Id; END
    END
    ELSE IF @Entidad='tipos-pos'
    BEGIN
        IF @Id IS NULL BEGIN INSERT dbo.tipo_pos(nombre,activo) VALUES(JSON_VALUE(@Datos,'$.nombre'),COALESCE(TRY_CONVERT(BIT,JSON_VALUE(@Datos,'$.activo')),1)); SELECT CONVERT(INT,SCOPE_IDENTITY()); END
        ELSE BEGIN UPDATE dbo.tipo_pos SET nombre=JSON_VALUE(@Datos,'$.nombre'),activo=COALESCE(TRY_CONVERT(BIT,JSON_VALUE(@Datos,'$.activo')),1) WHERE id_tipo_pos=@Id; SELECT @Id; END
    END
    ELSE IF @Entidad='clientes-credito'
    BEGIN
        DECLARE @idCliente INT=TRY_CONVERT(INT,JSON_VALUE(@Datos,'$.idCliente'));
        IF @Id IS NULL BEGIN INSERT dbo.cliente_credito(id_cliente,limite_credito,activo) VALUES(@idCliente,TRY_CONVERT(DECIMAL(12,2),JSON_VALUE(@Datos,'$.limiteCredito')),1); SELECT CONVERT(INT,SCOPE_IDENTITY()); END
        ELSE BEGIN UPDATE dbo.cliente_credito SET id_cliente=@idCliente,limite_credito=TRY_CONVERT(DECIMAL(12,2),JSON_VALUE(@Datos,'$.limiteCredito')),activo=COALESCE(TRY_CONVERT(BIT,JSON_VALUE(@Datos,'$.activo')),1) WHERE id_cliente_credito=@Id; SELECT @Id; END
    END
    ELSE IF @Entidad='categorias-producto'
    BEGIN
        IF @Id IS NULL BEGIN INSERT dbo.categoria_producto(nombre,descripcion,activo) VALUES(JSON_VALUE(@Datos,'$.nombre'),JSON_VALUE(@Datos,'$.descripcion'),COALESCE(TRY_CONVERT(BIT,JSON_VALUE(@Datos,'$.activo')),1)); SELECT CONVERT(INT,SCOPE_IDENTITY()); END
        ELSE BEGIN UPDATE dbo.categoria_producto SET nombre=JSON_VALUE(@Datos,'$.nombre'),descripcion=JSON_VALUE(@Datos,'$.descripcion'),activo=COALESCE(TRY_CONVERT(BIT,JSON_VALUE(@Datos,'$.activo')),1) WHERE id_categoria=@Id; SELECT @Id; END
    END
    ELSE IF @Entidad='motivos-salida'
    BEGIN
        IF @Id IS NULL BEGIN INSERT dbo.motivo_salida_inventario(codigo,nombre,orden,activo) VALUES(LOWER(REPLACE(JSON_VALUE(@Datos,'$.codigo'),' ','_')),JSON_VALUE(@Datos,'$.nombre'),COALESCE(TRY_CONVERT(INT,JSON_VALUE(@Datos,'$.orden')),0),COALESCE(TRY_CONVERT(BIT,JSON_VALUE(@Datos,'$.activo')),1)); SELECT CONVERT(INT,SCOPE_IDENTITY()); END
        ELSE BEGIN UPDATE dbo.motivo_salida_inventario SET codigo=LOWER(REPLACE(JSON_VALUE(@Datos,'$.codigo'),' ','_')),nombre=JSON_VALUE(@Datos,'$.nombre'),orden=COALESCE(TRY_CONVERT(INT,JSON_VALUE(@Datos,'$.orden')),0),activo=COALESCE(TRY_CONVERT(BIT,JSON_VALUE(@Datos,'$.activo')),1) WHERE id_motivo=@Id; SELECT @Id; END
    END
    ELSE IF @Entidad='preguntas-evaluacion'
    BEGIN
        IF @Id IS NULL BEGIN INSERT dbo.pregunta_evaluacion(pregunta,orden,activo) VALUES(JSON_VALUE(@Datos,'$.pregunta'),COALESCE(TRY_CONVERT(INT,JSON_VALUE(@Datos,'$.orden')),0),COALESCE(TRY_CONVERT(BIT,JSON_VALUE(@Datos,'$.activo')),1)); SELECT CONVERT(INT,SCOPE_IDENTITY()); END
        ELSE BEGIN UPDATE dbo.pregunta_evaluacion SET pregunta=JSON_VALUE(@Datos,'$.pregunta'),orden=COALESCE(TRY_CONVERT(INT,JSON_VALUE(@Datos,'$.orden')),0),activo=COALESCE(TRY_CONVERT(BIT,JSON_VALUE(@Datos,'$.activo')),1) WHERE id_pregunta=@Id; SELECT @Id; END
    END
    ELSE THROW 50001, 'Catálogo de datos maestros no permitido.', 1;
END
GO
