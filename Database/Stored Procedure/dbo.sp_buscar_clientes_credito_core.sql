CREATE OR ALTER PROCEDURE dbo.sp_buscar_clientes_credito_core
    @Query VARCHAR(200) = ''
AS
BEGIN
    SET NOCOUNT ON;
    SELECT TOP 20
        c.id_cliente AS IdCliente,
        c.nombre AS Nombre,
        c.nit AS Nit,
        c.telefono AS Telefono,
        c.direccion AS Direccion,
        cc.limite_credito AS LimiteCredito,
        ISNULL(SUM(cx.saldo_pendiente), 0) AS SaldoActual,
        cc.limite_credito - ISNULL(SUM(cx.saldo_pendiente), 0) AS Disponible
    FROM dbo.cliente_credito cc
    INNER JOIN dbo.cliente c ON c.id_cliente = cc.id_cliente
    LEFT JOIN dbo.venta v ON v.id_cliente = c.id_cliente
    LEFT JOIN dbo.cuenta_cobrar cx ON cx.id_venta = v.id_venta AND cx.estado = 'Pendiente'
    WHERE cc.activo = 1
      AND (@Query = '' OR c.nombre LIKE '%' + @Query + '%' OR ISNULL(c.nit, '') LIKE '%' + @Query + '%')
    GROUP BY c.id_cliente, c.nombre, c.nit, c.telefono, c.direccion, cc.limite_credito
    ORDER BY c.nombre;
END
GO
IF OBJECT_ID('dbo.sp_buscar_clientes_credito', 'SN') IS NOT NULL DROP SYNONYM dbo.sp_buscar_clientes_credito;
GO
CREATE SYNONYM dbo.sp_buscar_clientes_credito FOR dbo.sp_buscar_clientes_credito_core;
GO
