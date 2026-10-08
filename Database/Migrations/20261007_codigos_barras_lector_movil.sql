SET ANSI_NULLS ON;
SET ANSI_PADDING ON;
SET ANSI_WARNINGS ON;
SET ARITHABORT ON;
SET CONCAT_NULL_YIELDS_NULL ON;
SET QUOTED_IDENTIFIER ON;
SET NUMERIC_ROUNDABORT OFF;
SET XACT_ABORT ON;
BEGIN TRANSACTION;

IF OBJECT_ID('dbo.producto_codigo_barra', 'U') IS NULL
BEGIN
    CREATE TABLE dbo.producto_codigo_barra
    (
        id_codigo_barra INT IDENTITY(1,1) NOT NULL CONSTRAINT PK_producto_codigo_barra PRIMARY KEY,
        id_producto INT NOT NULL,
        codigo VARCHAR(100) NOT NULL,
        tipo VARCHAR(20) NOT NULL CONSTRAINT DF_producto_codigo_barra_tipo DEFAULT ('CODE128'),
        activo BIT NOT NULL CONSTRAINT DF_producto_codigo_barra_activo DEFAULT (1),
        fecha_registro DATETIME2(0) NOT NULL CONSTRAINT DF_producto_codigo_barra_fecha DEFAULT (SYSDATETIME()),
        id_usuario_registro INT NULL,
        fecha_desactivacion DATETIME2(0) NULL,
        id_usuario_desactivacion INT NULL,
        CONSTRAINT FK_producto_codigo_barra_producto FOREIGN KEY (id_producto) REFERENCES dbo.producto(id_producto)
    );
END;

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE object_id = OBJECT_ID('dbo.producto_codigo_barra') AND name = 'UX_producto_codigo_barra_activo')
    CREATE UNIQUE INDEX UX_producto_codigo_barra_activo ON dbo.producto_codigo_barra(codigo) WHERE activo = 1;

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE object_id = OBJECT_ID('dbo.producto_codigo_barra') AND name = 'IX_producto_codigo_barra_producto')
    CREATE INDEX IX_producto_codigo_barra_producto ON dbo.producto_codigo_barra(id_producto, activo);

INSERT INTO dbo.producto_codigo_barra(id_producto, codigo, tipo, activo)
SELECT p.id_producto, LTRIM(RTRIM(p.cod_producto)), 'INTERNO', 1
FROM dbo.producto p
WHERE NULLIF(LTRIM(RTRIM(p.cod_producto)), '') IS NOT NULL
  AND NOT EXISTS
  (
      SELECT 1 FROM dbo.producto_codigo_barra cb
      WHERE cb.codigo = LTRIM(RTRIM(p.cod_producto)) AND cb.activo = 1
  );

COMMIT TRANSACTION;
GO

CREATE OR ALTER PROCEDURE dbo.sp_listar_codigos_producto
    @IdProducto INT
AS
BEGIN
    SET NOCOUNT ON;
    SELECT id_codigo_barra AS IdCodigoBarra,
           id_producto AS IdProducto,
           codigo AS Codigo,
           tipo AS Tipo,
           activo AS Activo,
           fecha_registro AS FechaRegistro
    FROM dbo.producto_codigo_barra
    WHERE id_producto = @IdProducto AND activo = 1
    ORDER BY fecha_registro DESC, id_codigo_barra DESC;
END;
GO

CREATE OR ALTER PROCEDURE dbo.sp_guardar_codigo_producto
    @IdProducto INT,
    @Codigo VARCHAR(100),
    @Tipo VARCHAR(20) = 'CODE128',
    @IdUsuario INT = NULL
AS
BEGIN
    SET NOCOUNT ON;
    SET XACT_ABORT ON;
    SET @Codigo = LTRIM(RTRIM(@Codigo));
    SET @Tipo = UPPER(LTRIM(RTRIM(ISNULL(NULLIF(@Tipo, ''), 'CODE128'))));

    IF NOT EXISTS (SELECT 1 FROM dbo.producto WHERE id_producto = @IdProducto)
        THROW 51000, 'El producto seleccionado no existe.', 1;
    IF LEN(@Codigo) < 4 OR LEN(@Codigo) > 100
        THROW 51000, 'El código debe contener entre 4 y 100 caracteres.', 1;
    IF EXISTS (SELECT 1 FROM dbo.producto_codigo_barra WHERE codigo = @Codigo AND activo = 1 AND id_producto <> @IdProducto)
        THROW 51000, 'Este código ya está asignado a otro producto.', 1;

    DECLARE @IdCodigoBarra INT;
    SELECT @IdCodigoBarra = id_codigo_barra
    FROM dbo.producto_codigo_barra
    WHERE codigo = @Codigo AND id_producto = @IdProducto;

    IF @IdCodigoBarra IS NULL
    BEGIN
        INSERT INTO dbo.producto_codigo_barra(id_producto, codigo, tipo, activo, id_usuario_registro)
        VALUES(@IdProducto, @Codigo, @Tipo, 1, NULLIF(@IdUsuario, 0));
        SET @IdCodigoBarra = SCOPE_IDENTITY();
    END
    ELSE
    BEGIN
        UPDATE dbo.producto_codigo_barra
        SET activo = 1, tipo = @Tipo, fecha_desactivacion = NULL, id_usuario_desactivacion = NULL
        WHERE id_codigo_barra = @IdCodigoBarra;
    END;

    IF NULLIF(LTRIM(RTRIM((SELECT cod_producto FROM dbo.producto WHERE id_producto = @IdProducto))), '') IS NULL
        UPDATE dbo.producto SET cod_producto = LEFT(@Codigo, 20) WHERE id_producto = @IdProducto;

    SELECT @IdCodigoBarra;
END;
GO

CREATE OR ALTER PROCEDURE dbo.sp_desactivar_codigo_producto
    @IdProducto INT,
    @IdCodigoBarra INT,
    @IdUsuario INT = NULL
AS
BEGIN
    SET NOCOUNT ON;
    DECLARE @Codigo VARCHAR(100);
    SELECT @Codigo = codigo FROM dbo.producto_codigo_barra
    WHERE id_codigo_barra = @IdCodigoBarra AND id_producto = @IdProducto AND activo = 1;
    IF @Codigo IS NULL THROW 51000, 'El código seleccionado ya no está activo.', 1;

    UPDATE dbo.producto_codigo_barra
    SET activo = 0, fecha_desactivacion = SYSDATETIME(), id_usuario_desactivacion = NULLIF(@IdUsuario, 0)
    WHERE id_codigo_barra = @IdCodigoBarra;

    IF EXISTS (SELECT 1 FROM dbo.producto WHERE id_producto = @IdProducto AND cod_producto = @Codigo)
        UPDATE dbo.producto
        SET cod_producto = LEFT((SELECT TOP 1 codigo FROM dbo.producto_codigo_barra WHERE id_producto = @IdProducto AND activo = 1 ORDER BY id_codigo_barra), 20)
        WHERE id_producto = @IdProducto;
END;
GO

CREATE OR ALTER PROCEDURE dbo.sp_buscar_producto_codigo_barra
    @Codigo VARCHAR(100),
    @IdSucursal INT
AS
BEGIN
    SET NOCOUNT ON;
    SET @Codigo = LTRIM(RTRIM(@Codigo));
    SELECT TOP 1
        p.id_producto AS IdProducto,
        p.nombre AS Nombre,
        p.descripcion AS Descripcion,
        p.precio AS Precio,
        i.id_sucursal AS IdSucursal,
        s.nombre AS NombreSucursal,
        i.stock AS Stock
    FROM dbo.producto p
    INNER JOIN dbo.inventario i ON i.id_producto = p.id_producto AND i.id_sucursal = @IdSucursal
    INNER JOIN dbo.sucursal s ON s.id_sucursal = i.id_sucursal
    WHERE i.stock > 0 AND
      (p.cod_producto = @Codigo OR EXISTS
       (SELECT 1 FROM dbo.producto_codigo_barra cb
        WHERE cb.id_producto = p.id_producto AND cb.codigo = @Codigo AND cb.activo = 1));
END;
GO

CREATE OR ALTER PROCEDURE dbo.sp_obtener_inventario_productos_core
    @IdSucursal INT,
    @Query VARCHAR(200) = ''
AS
BEGIN
    SET NOCOUNT ON;
    DECLARE @Busqueda VARCHAR(200) = LTRIM(RTRIM(ISNULL(@Query, '')));
    SELECT i.id_inventario AS IdInventario,
           p.id_producto AS IdProducto,
           COALESCE(cb.codigo, p.cod_producto) AS Codigo,
           p.nombre AS Nombre,
           p.descripcion AS Descripcion,
           p.precio AS Precio,
           i.stock AS Stock,
           s.id_sucursal AS IdSucursal,
           s.nombre AS SucursalNombre,
           CASE WHEN i.stock <= 0 THEN 'Sin existencias' WHEN i.stock <= 5 THEN 'Existencia baja' ELSE 'Disponible' END AS EstadoStock
    FROM dbo.inventario i
    INNER JOIN dbo.producto p ON p.id_producto = i.id_producto
    INNER JOIN dbo.sucursal s ON s.id_sucursal = i.id_sucursal
    OUTER APPLY (SELECT TOP 1 codigo FROM dbo.producto_codigo_barra WHERE id_producto = p.id_producto AND activo = 1 ORDER BY id_codigo_barra) cb
    WHERE i.id_sucursal = @IdSucursal
      AND (@Busqueda = '' OR p.nombre LIKE '%' + @Busqueda + '%' OR ISNULL(p.descripcion, '') LIKE '%' + @Busqueda + '%'
           OR CONVERT(VARCHAR(20), p.id_producto) = @Busqueda
           OR EXISTS (SELECT 1 FROM dbo.producto_codigo_barra x WHERE x.id_producto = p.id_producto AND x.activo = 1 AND x.codigo LIKE '%' + @Busqueda + '%'))
    ORDER BY p.nombre, p.id_producto;
END;
GO

CREATE OR ALTER PROCEDURE dbo.sp_obtener_productos_catalogo_core
    @Query VARCHAR(200) = '',
    @IdSucursal INT = NULL
AS
BEGIN
    SET NOCOUNT ON;
    SELECT TOP 20 p.id_producto AS IdProducto,
           p.nombre AS Nombre,
           p.descripcion AS Descripcion,
           p.precio AS Precio,
           i.id_sucursal AS IdSucursal,
           s.nombre AS NombreSucursal,
           i.stock AS Stock
    FROM dbo.producto p
    LEFT JOIN dbo.inventario i ON i.id_producto = p.id_producto
    LEFT JOIN dbo.sucursal s ON s.id_sucursal = i.id_sucursal
    WHERE (@Query = '' OR CAST(p.id_producto AS VARCHAR(20)) LIKE '%' + @Query + '%' OR p.nombre LIKE '%' + @Query + '%'
           OR ISNULL(p.descripcion, '') LIKE '%' + @Query + '%'
           OR EXISTS (SELECT 1 FROM dbo.producto_codigo_barra cb WHERE cb.id_producto = p.id_producto AND cb.activo = 1 AND cb.codigo LIKE '%' + @Query + '%'))
      AND (@IdSucursal IS NULL OR i.id_sucursal = @IdSucursal)
      AND ISNULL(i.stock, 0) > 0
    ORDER BY p.nombre;
END;
GO
