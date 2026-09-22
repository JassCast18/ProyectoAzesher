CREATE OR ALTER PROCEDURE dbo.sp_registrar_bitacora_core
 @IdUsuario INT=NULL,@NombreUsuario VARCHAR(100)=NULL,@IdSucursal INT=NULL,@Modulo VARCHAR(80),
 @Accion VARCHAR(120),@Metodo VARCHAR(10),@Ruta VARCHAR(300),@Resultado VARCHAR(20),
 @CodigoHttp INT,@DireccionIp VARCHAR(64)=NULL,@Detalle VARCHAR(500)=NULL
AS
BEGIN
 SET NOCOUNT ON;
 INSERT dbo.bitacora(id_usuario,nombre_usuario,id_sucursal,modulo,accion,metodo,ruta,resultado,codigo_http,direccion_ip,detalle)
 VALUES(@IdUsuario,NULLIF(@NombreUsuario,''),@IdSucursal,@Modulo,@Accion,@Metodo,@Ruta,@Resultado,@CodigoHttp,NULLIF(@DireccionIp,''),NULLIF(@Detalle,''));
END
GO

CREATE OR ALTER PROCEDURE dbo.sp_consultar_bitacora_core
 @Texto VARCHAR(150)='',@IdUsuario INT=NULL,@IdSucursal INT=NULL,@Modulo VARCHAR(80)='',@Accion VARCHAR(120)='',
 @Resultado VARCHAR(20)='',@FechaDesde DATE=NULL,@FechaHasta DATE=NULL,@Pagina INT=1,@TamanoPagina INT=25
AS
BEGIN
 SET NOCOUNT ON;
 IF @Pagina<1 SET @Pagina=1;
 IF @TamanoPagina<10 SET @TamanoPagina=10;
 IF @TamanoPagina>100 SET @TamanoPagina=100;
 SELECT b.id_bitacora IdBitacora,b.fecha,b.id_usuario IdUsuario,COALESCE(u.nombre,b.nombre_usuario,'Sistema') Usuario,
        b.id_sucursal IdSucursal,s.nombre Sucursal,b.modulo,b.accion,b.metodo,b.ruta,b.resultado,b.codigo_http CodigoHttp,
        b.direccion_ip DireccionIp,b.detalle,COUNT(1) OVER() TotalRegistros
 FROM dbo.bitacora b
 LEFT JOIN dbo.usuario u ON u.id_usuario=b.id_usuario
 LEFT JOIN dbo.sucursal s ON s.id_sucursal=b.id_sucursal
 WHERE (@Texto='' OR COALESCE(u.nombre,b.nombre_usuario,'') LIKE '%'+@Texto+'%' OR b.ruta LIKE '%'+@Texto+'%' OR ISNULL(b.detalle,'') LIKE '%'+@Texto+'%')
   AND (@IdUsuario IS NULL OR b.id_usuario=@IdUsuario) AND (@IdSucursal IS NULL OR b.id_sucursal=@IdSucursal)
   AND (@Modulo='' OR b.modulo=@Modulo) AND (@Accion='' OR b.accion LIKE '%'+@Accion+'%') AND (@Resultado='' OR b.resultado=@Resultado)
   AND (@FechaDesde IS NULL OR CAST(b.fecha AS DATE)>=@FechaDesde) AND (@FechaHasta IS NULL OR CAST(b.fecha AS DATE)<=@FechaHasta)
 ORDER BY b.fecha DESC,b.id_bitacora DESC
 OFFSET (@Pagina-1)*@TamanoPagina ROWS FETCH NEXT @TamanoPagina ROWS ONLY;
END
GO

IF OBJECT_ID('dbo.sp_registrar_bitacora','SN') IS NOT NULL DROP SYNONYM dbo.sp_registrar_bitacora;
IF OBJECT_ID('dbo.sp_consultar_bitacora','SN') IS NOT NULL DROP SYNONYM dbo.sp_consultar_bitacora;
GO
CREATE SYNONYM dbo.sp_registrar_bitacora FOR dbo.sp_registrar_bitacora_core;
CREATE SYNONYM dbo.sp_consultar_bitacora FOR dbo.sp_consultar_bitacora_core;
GO
