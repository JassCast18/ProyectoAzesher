CREATE OR ALTER PROCEDURE dbo.sp_datos_maestros_listar
    @Entidad VARCHAR(40), @Query VARCHAR(150) = ''
AS
BEGIN
    SET NOCOUNT ON;
    SET @Query = LTRIM(RTRIM(ISNULL(@Query, '')));

    IF @Entidad = 'sucursales'
        SELECT id_sucursal Id, nombre Nombre, direccion Direccion, telefono Telefono, color_identificacion ColorIdentificacion FROM dbo.sucursal WHERE @Query='' OR nombre LIKE '%'+@Query+'%' ORDER BY nombre;
    ELSE IF @Entidad = 'proveedores'
        SELECT id_proveedor Id, nombre Nombre, telefono Telefono, direccion Direccion FROM dbo.proveedor WHERE @Query='' OR nombre LIKE '%'+@Query+'%' ORDER BY nombre;
    ELSE IF @Entidad = 'productos'
        SELECT id_producto Id, cod_producto Codigo, nombre Nombre, descripcion Descripcion, precio Precio FROM dbo.producto WHERE @Query='' OR nombre LIKE '%'+@Query+'%' OR cod_producto LIKE '%'+@Query+'%' ORDER BY nombre;
    ELSE IF @Entidad = 'proveedor-producto'
        SELECT (pp.id_proveedor * 1000000 + pp.id_producto) Id, pp.id_proveedor IdProveedor, pr.nombre Proveedor, pp.id_producto IdProducto, p.nombre Producto, pp.activo Activo FROM dbo.proveedor_producto pp JOIN dbo.proveedor pr ON pr.id_proveedor=pp.id_proveedor JOIN dbo.producto p ON p.id_producto=pp.id_producto WHERE @Query='' OR pr.nombre LIKE '%'+@Query+'%' OR p.nombre LIKE '%'+@Query+'%' ORDER BY pr.nombre,p.nombre;
    ELSE IF @Entidad = 'vendedores'
        SELECT v.id_vendedor Id, v.nombre Nombre, v.telefono Telefono, v.id_sucursal IdSucursal, s.nombre Sucursal FROM dbo.vendedor v LEFT JOIN dbo.sucursal s ON s.id_sucursal=v.id_sucursal WHERE @Query='' OR v.nombre LIKE '%'+@Query+'%' ORDER BY v.nombre;
    ELSE IF @Entidad = 'monedas'
        SELECT id_moneda Id, codigo Codigo, nombre Nombre, simbolo Simbolo, activo Activo FROM dbo.moneda WHERE @Query='' OR nombre LIKE '%'+@Query+'%' OR codigo LIKE '%'+@Query+'%' ORDER BY nombre;
    ELSE IF @Entidad = 'tipos-pos'
        SELECT id_tipo_pos Id, nombre Nombre, activo Activo FROM dbo.tipo_pos WHERE @Query='' OR nombre LIKE '%'+@Query+'%' ORDER BY nombre;
    ELSE IF @Entidad = 'clientes-credito'
        SELECT cc.id_cliente_credito Id, cc.id_cliente IdCliente, c.nombre Cliente, c.nit Nit, cc.limite_credito LimiteCredito, cc.activo Activo FROM dbo.cliente_credito cc JOIN dbo.cliente c ON c.id_cliente=cc.id_cliente WHERE @Query='' OR c.nombre LIKE '%'+@Query+'%' OR c.nit LIKE '%'+@Query+'%' ORDER BY c.nombre;
    ELSE IF @Entidad = 'clientes'
        SELECT id_cliente Id, nombre Nombre, nit Nit, telefono Telefono FROM dbo.cliente WHERE @Query='' OR nombre LIKE '%'+@Query+'%' OR nit LIKE '%'+@Query+'%' ORDER BY nombre;
    ELSE THROW 50001, 'Catálogo de datos maestros no permitido.', 1;
END
GO
