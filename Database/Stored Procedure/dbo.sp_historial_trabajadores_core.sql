CREATE OR ALTER PROCEDURE dbo.sp_historial_trabajadores_core
    @IdSucursal INT=NULL,@IdVendedor INT=NULL,@Query VARCHAR(150)='',@Tipo VARCHAR(40)='',
    @FechaDesde DATE=NULL,@FechaHasta DATE=NULL,@Pagina INT=1,@TamanoPagina INT=30
AS
BEGIN
    SET NOCOUNT ON;
    SET @Query=LTRIM(RTRIM(ISNULL(@Query,''))); SET @Tipo=LOWER(LTRIM(RTRIM(ISNULL(@Tipo,''))));
    SET @Pagina=CASE WHEN @Pagina<1 THEN 1 ELSE @Pagina END;
    SET @TamanoPagina=CASE WHEN @TamanoPagina<1 THEN 30 WHEN @TamanoPagina>100 THEN 100 ELSE @TamanoPagina END;
    ;WITH Eventos AS (
        SELECT CONCAT('historial-',h.id_historial) IdEvento,h.fecha Fecha,v.id_vendedor IdVendedor,v.nombre Trabajador,h.id_sucursal IdSucursal,s.nombre Sucursal,h.tipo Tipo,
               CAST(NULL AS VARCHAR(80)) Documento,h.detalle Detalle,CAST(NULL AS DECIMAL(12,2)) Monto,CAST(NULL AS DECIMAL(5,2)) Puntuacion,h.estado Estado,COALESCE(u.nombre,'Sistema') Usuario
        FROM dbo.historial_trabajador h JOIN dbo.vendedor v ON v.id_vendedor=h.id_vendedor LEFT JOIN dbo.sucursal s ON s.id_sucursal=h.id_sucursal LEFT JOIN dbo.usuario u ON u.id_usuario=h.id_usuario
        UNION ALL
        SELECT CONCAT('venta-',ve.id_venta),ve.fecha,v.id_vendedor,v.nombre,sc.id_sucursal,s.nombre,'Venta',COALESCE(r.numero_recibo,f.numero_factura,CONCAT('VENTA-',ve.id_venta)),
               CAST(CONCAT('Cliente: ',COALESCE(c.nombre,'Consumidor final'),' · Pago: ',ve.tipo_pago) AS VARCHAR(600)),ve.total,NULL,COALESCE(r.estado,'Registrada'),COALESCE(u.nombre,'Sistema')
        FROM dbo.venta ve JOIN dbo.vendedor v ON v.id_vendedor=ve.id_vendedor JOIN dbo.sesion_caja sc ON sc.id_sesion=ve.id_sesion LEFT JOIN dbo.sucursal s ON s.id_sucursal=sc.id_sucursal
        LEFT JOIN dbo.cliente c ON c.id_cliente=ve.id_cliente OUTER APPLY(SELECT TOP(1) fa.id_factura,fa.numero_factura FROM dbo.factura fa WHERE fa.id_venta=ve.id_venta ORDER BY fa.id_factura)f
        OUTER APPLY(SELECT TOP(1) re.numero_recibo,re.estado FROM dbo.recibo re WHERE re.id_factura=f.id_factura ORDER BY re.id_recibo)r LEFT JOIN dbo.usuario u ON u.id_usuario=sc.id_usuario
        UNION ALL
        SELECT CONCAT('evaluacion-',e.id_evaluacion),e.fecha,v.id_vendedor,v.nombre,v.id_sucursal,s.nombre,'Evaluación',CONCAT(CONVERT(CHAR(10),e.periodo_desde,103),' - ',CONVERT(CHAR(10),e.periodo_hasta,103)),
               CAST(COALESCE(e.observaciones,'Evaluación de desempeño registrada.') AS VARCHAR(600)),NULL,
               CONVERT(DECIMAL(5,2),(e.puntualidad+e.servicio_cliente+e.cumplimiento_metas+e.trabajo_equipo+ISNULL(px.TotalExtra,0))/(4.0+ISNULL(px.CantidadExtra,0))),
               'Registrada',COALESCE(u.nombre,'Sistema')
        FROM dbo.evaluacion_trabajador e JOIN dbo.vendedor v ON v.id_vendedor=e.id_vendedor LEFT JOIN dbo.sucursal s ON s.id_sucursal=v.id_sucursal LEFT JOIN dbo.usuario u ON u.id_usuario=e.id_usuario
        OUTER APPLY(SELECT SUM(p.puntuacion) TotalExtra,COUNT(*) CantidadExtra FROM dbo.evaluacion_trabajador_pregunta p WHERE p.id_evaluacion=e.id_evaluacion)px
    ),Filtrados AS (
        SELECT *,COUNT(*) OVER() TotalRegistros FROM Eventos
        WHERE (@IdSucursal IS NULL OR IdSucursal=@IdSucursal) AND (@IdVendedor IS NULL OR IdVendedor=@IdVendedor) AND (@Tipo='' OR LOWER(Tipo)=@Tipo)
          AND (@FechaDesde IS NULL OR Fecha>=@FechaDesde) AND (@FechaHasta IS NULL OR Fecha<DATEADD(DAY,1,@FechaHasta))
          AND (@Query='' OR Trabajador LIKE '%'+@Query+'%' OR ISNULL(Documento,'') LIKE '%'+@Query+'%' OR ISNULL(Detalle,'') LIKE '%'+@Query+'%')
    )
    SELECT IdEvento,Fecha,IdVendedor,Trabajador,IdSucursal,Sucursal,Tipo,Documento,Detalle,Monto,Puntuacion,Estado,Usuario,TotalRegistros
    FROM Filtrados ORDER BY Fecha DESC,IdEvento DESC OFFSET (@Pagina-1)*@TamanoPagina ROWS FETCH NEXT @TamanoPagina ROWS ONLY;
END
GO
IF OBJECT_ID('dbo.sp_historial_trabajadores','SN') IS NOT NULL DROP SYNONYM dbo.sp_historial_trabajadores;
GO
CREATE SYNONYM dbo.sp_historial_trabajadores FOR dbo.sp_historial_trabajadores_core;
GO
