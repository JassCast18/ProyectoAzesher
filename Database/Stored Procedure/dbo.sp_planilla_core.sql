CREATE OR ALTER PROCEDURE dbo.sp_calcular_planilla_core
    @IdSucursal INT = NULL,
    @FechaDesde DATE,
    @FechaHasta DATE
AS
BEGIN
    SET NOCOUNT ON;
    IF @FechaHasta < @FechaDesde THROW 50501, 'La fecha final no puede ser anterior a la fecha inicial.', 1;

    DECLARE @DiasPago INT = CASE
        WHEN DAY(@FechaDesde)=1 AND @FechaHasta=EOMONTH(@FechaDesde) THEN 30
        ELSE DATEDIFF(DAY,@FechaDesde,@FechaHasta)+1 END;

    ;WITH VentasPeriodo AS (
        SELECT ve.id_vendedor, COUNT(*) Ventas, SUM(ve.total) TotalVendido
        FROM dbo.venta ve
        WHERE CAST(ve.fecha AS DATE) BETWEEN @FechaDesde AND @FechaHasta
          AND NOT EXISTS (
              SELECT 1
              FROM dbo.factura f
              JOIN dbo.recibo r ON r.id_factura=f.id_factura
              WHERE f.id_venta=ve.id_venta
                AND ISNULL(f.tipo_origen,'Venta')='Venta'
                AND r.estado='Anulado'
          )
        GROUP BY ve.id_vendedor
    ), Base AS (
        SELECT v.id_vendedor,v.nombre Trabajador,v.puesto,s.nombre Sucursal,
               COALESCE(cp.salario_mensual,3500.00) SalarioMensual,
               ISNULL(vp.Ventas,0) Ventas,ISNULL(vp.TotalVendido,0) TotalVendido
        FROM dbo.vendedor v
        LEFT JOIN dbo.sucursal s ON s.id_sucursal=v.id_sucursal
        LEFT JOIN dbo.configuracion_pago_trabajador cp ON cp.id_vendedor=v.id_vendedor
        LEFT JOIN VentasPeriodo vp ON vp.id_vendedor=v.id_vendedor
        WHERE v.activo=1 AND (@IdSucursal IS NULL OR v.id_sucursal=@IdSucursal)
    ), Bonos AS (
        SELECT b.id_vendedor,
               SUM(CASE bp.tipo_calculo
                   WHEN 'PORCENTAJE_VENTAS' THEN ROUND(b.TotalVendido*ISNULL(bp.porcentaje,0)/100.0,2)
                   WHEN 'META_MONTO_VENTAS' THEN CASE WHEN b.TotalVendido>=ISNULL(bp.meta_minima,0) THEN ISNULL(bp.monto_bono,0) ELSE 0 END
                   WHEN 'META_CANTIDAD_VENTAS' THEN CASE WHEN b.Ventas>=ISNULL(bp.meta_minima,0) THEN ISNULL(bp.monto_bono,0) ELSE 0 END
                   WHEN 'MONTO_FIJO' THEN ISNULL(bp.monto_bono,0)
                   ELSE 0 END) TotalBonos,
               STRING_AGG(CONVERT(VARCHAR(MAX),CONCAT(bp.nombre,': Q ',CONVERT(DECIMAL(12,2),CASE bp.tipo_calculo
                   WHEN 'PORCENTAJE_VENTAS' THEN ROUND(b.TotalVendido*ISNULL(bp.porcentaje,0)/100.0,2)
                   WHEN 'META_MONTO_VENTAS' THEN CASE WHEN b.TotalVendido>=ISNULL(bp.meta_minima,0) THEN ISNULL(bp.monto_bono,0) ELSE 0 END
                   WHEN 'META_CANTIDAD_VENTAS' THEN CASE WHEN b.Ventas>=ISNULL(bp.meta_minima,0) THEN ISNULL(bp.monto_bono,0) ELSE 0 END
                   WHEN 'MONTO_FIJO' THEN ISNULL(bp.monto_bono,0) ELSE 0 END))), ' | ') BonosDetalle
        FROM Base b
        JOIN dbo.trabajador_bono tb ON tb.id_vendedor=b.id_vendedor AND tb.activo=1
        JOIN dbo.bono_planilla bp ON bp.id_bono=tb.id_bono AND bp.activo=1
        GROUP BY b.id_vendedor
    )
    SELECT b.id_vendedor IdVendedor,b.Trabajador,b.puesto Puesto,b.Sucursal,
           CONVERT(DECIMAL(12,2),b.SalarioMensual) SalarioMensual,@DiasPago DiasPago,
           CONVERT(DECIMAL(12,2),ROUND(b.SalarioMensual*@DiasPago/30.0,2)) SalarioBasePeriodo,
           b.Ventas,CONVERT(DECIMAL(12,2),b.TotalVendido) TotalVendido,
           CONVERT(DECIMAL(12,2),ISNULL(bo.TotalBonos,0)) TotalBonos,
           CONVERT(DECIMAL(12,2),ROUND(b.SalarioMensual*@DiasPago/30.0,2)+ISNULL(bo.TotalBonos,0)) TotalPagar,
           bo.BonosDetalle
    FROM Base b LEFT JOIN Bonos bo ON bo.id_vendedor=b.id_vendedor
    ORDER BY b.Trabajador;
END
GO

CREATE OR ALTER PROCEDURE dbo.sp_obtener_configuracion_pago_trabajador_core @IdVendedor INT
AS
BEGIN
    SET NOCOUNT ON;
    SELECT v.id_vendedor IdVendedor,v.nombre Trabajador,v.puesto Puesto,s.nombre Sucursal,
           CONVERT(DECIMAL(12,2),COALESCE(cp.salario_mensual,3500.00)) SalarioMensual
    FROM dbo.vendedor v
    LEFT JOIN dbo.sucursal s ON s.id_sucursal=v.id_sucursal
    LEFT JOIN dbo.configuracion_pago_trabajador cp ON cp.id_vendedor=v.id_vendedor
    WHERE v.id_vendedor=@IdVendedor;

    SELECT bp.id_bono IdBono,bp.codigo Codigo,bp.nombre Nombre,bp.descripcion Descripcion,
           bp.tipo_calculo TipoCalculo,bp.porcentaje Porcentaje,bp.meta_minima MetaMinima,
           bp.monto_bono MontoBono,CONVERT(BIT,CASE WHEN tb.activo=1 THEN 1 ELSE 0 END) Asignado
    FROM dbo.bono_planilla bp
    LEFT JOIN dbo.trabajador_bono tb ON tb.id_bono=bp.id_bono AND tb.id_vendedor=@IdVendedor
    WHERE bp.activo=1
    ORDER BY bp.nombre;
END
GO

CREATE OR ALTER PROCEDURE dbo.sp_guardar_configuracion_pago_trabajador_core
    @IdVendedor INT,@SalarioMensual DECIMAL(12,2),@BonosJson NVARCHAR(MAX)='[]',@IdUsuario INT=NULL
AS
BEGIN
    SET NOCOUNT ON; SET XACT_ABORT ON;
    IF NOT EXISTS(SELECT 1 FROM dbo.vendedor WHERE id_vendedor=@IdVendedor) THROW 50502, 'El trabajador no existe.', 1;
    IF @SalarioMensual<=0 THROW 50503, 'El salario mensual debe ser mayor que cero.', 1;
    IF ISJSON(@BonosJson)<>1 THROW 50504, 'La seleccion de bonos no es valida.', 1;
    IF EXISTS(SELECT 1 FROM OPENJSON(@BonosJson) j WHERE TRY_CONVERT(INT,j.value) IS NULL OR NOT EXISTS(SELECT 1 FROM dbo.bono_planilla b WHERE b.id_bono=TRY_CONVERT(INT,j.value) AND b.activo=1)) THROW 50505, 'Uno de los bonos seleccionados no esta disponible.', 1;

    BEGIN TRANSACTION;
    MERGE dbo.configuracion_pago_trabajador AS destino
    USING (SELECT @IdVendedor id_vendedor) AS origen ON destino.id_vendedor=origen.id_vendedor
    WHEN MATCHED THEN UPDATE SET salario_mensual=@SalarioMensual,fecha_actualizacion=SYSDATETIME(),id_usuario_actualizacion=@IdUsuario
    WHEN NOT MATCHED THEN INSERT(id_vendedor,salario_mensual,id_usuario_actualizacion) VALUES(@IdVendedor,@SalarioMensual,@IdUsuario);

    UPDATE dbo.trabajador_bono SET activo=0 WHERE id_vendedor=@IdVendedor;
    MERGE dbo.trabajador_bono AS destino
    USING (SELECT DISTINCT @IdVendedor id_vendedor,TRY_CONVERT(INT,value) id_bono FROM OPENJSON(@BonosJson)) AS origen
       ON destino.id_vendedor=origen.id_vendedor AND destino.id_bono=origen.id_bono
    WHEN MATCHED THEN UPDATE SET activo=1,fecha_asignacion=SYSDATETIME()
    WHEN NOT MATCHED BY TARGET THEN INSERT(id_vendedor,id_bono,activo) VALUES(origen.id_vendedor,origen.id_bono,1);

    INSERT dbo.historial_trabajador(id_vendedor,fecha,tipo,detalle,estado,id_sucursal,id_usuario)
    SELECT v.id_vendedor,GETDATE(),'Configuracion de pago',CONCAT('Salario mensual establecido en Q ',CONVERT(DECIMAL(12,2),@SalarioMensual),'. Bonos asignados: ',(SELECT COUNT(*) FROM OPENJSON(@BonosJson))),'Activo',v.id_sucursal,@IdUsuario
    FROM dbo.vendedor v WHERE v.id_vendedor=@IdVendedor;
    COMMIT;
END
GO

DECLARE @n VARCHAR(128),@c VARCHAR(128);
DECLARE sinonimos CURSOR LOCAL FAST_FORWARD FOR SELECT * FROM (VALUES
('sp_calcular_planilla','sp_calcular_planilla_core'),
('sp_obtener_configuracion_pago_trabajador','sp_obtener_configuracion_pago_trabajador_core'),
('sp_guardar_configuracion_pago_trabajador','sp_guardar_configuracion_pago_trabajador_core'))x(n,c);
OPEN sinonimos;FETCH NEXT FROM sinonimos INTO @n,@c;
WHILE @@FETCH_STATUS=0 BEGIN EXEC('IF OBJECT_ID(''dbo.'+@n+''',''SN'') IS NOT NULL DROP SYNONYM dbo.'+@n);EXEC('CREATE SYNONYM dbo.'+@n+' FOR dbo.'+@c);FETCH NEXT FROM sinonimos INTO @n,@c;END
CLOSE sinonimos;DEALLOCATE sinonimos;
GO
