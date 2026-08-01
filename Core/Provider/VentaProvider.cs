using System.Data;
using Core.DTOs;
using Core.DTOs.Interfaces;
using Dapper;
using Microsoft.Data.SqlClient;

namespace Core.Provider
{
    public class VentaProvider(IConfiguration configuration) : IVentaProviderDTO
    {
        private readonly string _connectionString = configuration.GetConnectionString("DefaultConnection")
            ?? throw new ArgumentNullException(nameof(configuration));

        public async Task<ReciboVentaDTO?> ObtenerReciboVentaAsync(int idRecibo)
        {
            await using var connection = new SqlConnection(_connectionString);

            const string sqlEncabezado = @"
SELECT
    r.id_recibo AS IdRecibo,
    r.numero_recibo AS NumeroRecibo,
    r.fecha_pago AS FechaPago,
    r.monto AS Monto,
    r.metodo_pago AS MetodoPago,
    r.numero_comprobante AS NumeroComprobante,

    f.id_factura AS IdFactura,
    f.numero_factura AS NumeroFactura,
    f.fecha_emision AS FechaEmisionFactura,
    f.total AS TotalFactura,
    f.estado AS EstadoFactura,

    v.id_venta AS IdVenta,
    v.fecha AS FechaVenta,
    v.total AS TotalVenta,
    v.tipo_pago AS TipoPagoVenta,

    c.id_cliente AS IdCliente,
    c.nombre AS ClienteNombre,
    c.nit AS ClienteNit,
    c.direccion AS ClienteDomicilio,
    c.telefono AS ClienteTelefono,

    vd.id_vendedor AS IdVendedor,
    vd.nombre AS VendedorNombre,
    su.nombre AS SucursalNombre
FROM dbo.recibo r
INNER JOIN dbo.factura f ON f.id_factura = r.id_factura
INNER JOIN dbo.venta v ON v.id_venta = f.id_venta
INNER JOIN dbo.cliente c ON c.id_cliente = v.id_cliente
INNER JOIN dbo.vendedor vd ON vd.id_vendedor = v.id_vendedor
INNER JOIN dbo.sesion_caja sc ON sc.id_sesion = v.id_sesion
LEFT JOIN dbo.usuario u ON u.id_usuario = sc.id_usuario
LEFT JOIN dbo.sucursal su ON su.id_sucursal = u.id_sucursal
WHERE r.id_recibo = @IdRecibo;";

            var recibo = await connection.QueryFirstOrDefaultAsync<ReciboVentaDTO>(
                sqlEncabezado,
                new { IdRecibo = idRecibo },
                commandType: CommandType.Text);

            if (recibo is null)
            {
                return null;
            }

            const string sqlDetalle = @"
SELECT
    dv.id_detalle AS IdDetalle,
    dv.id_producto AS IdProducto,
    p.nombre AS ProductoNombre,
    dv.cantidad AS Cantidad,
    dv.precio_unitario AS PrecioUnitario,
    dv.subtotal AS Subtotal
FROM dbo.detalle_venta dv
INNER JOIN dbo.producto p ON p.id_producto = dv.id_producto
WHERE dv.id_venta = @IdVenta
ORDER BY dv.id_detalle;";

            var detalle = await connection.QueryAsync<ReciboDetalleVentaDTO>(
                sqlDetalle,
                new { recibo.IdVenta },
                commandType: CommandType.Text);

            recibo.Detalles = detalle.ToList();
            return recibo;
        }

        public async Task<int> GuardarReciboAsync(ReciboTemporalRequestDTO request, int idUsuario, string nombreVendedor, int? idSucursal)
        {
            await using var connection = new SqlConnection(_connectionString);
            await connection.OpenAsync();
            await using var transaction = await connection.BeginTransactionAsync();

            try
            {
                var idCliente = request.IdCliente;

                if (!idCliente.HasValue || idCliente.Value <= 0)
                {
                    idCliente = await connection.ExecuteScalarAsync<int?>(
                        @"SELECT TOP 1 id_cliente
                          FROM dbo.cliente
                          WHERE ISNULL(nit, '') = ISNULL(@Nit, '')
                            AND nombre = @Nombre;",
                        new
                        {
                            Nit = request.ClienteNit,
                            Nombre = request.ClienteNombre
                        },
                        transaction);

                    if (!idCliente.HasValue || idCliente.Value <= 0)
                    {
                        idCliente = await connection.ExecuteScalarAsync<int>(
                            @"INSERT INTO dbo.cliente (nombre, telefono, direccion, nit)
                              VALUES (@Nombre, @Telefono, @Direccion, @Nit);
                              SELECT CAST(SCOPE_IDENTITY() AS INT);",
                            new
                            {
                                Nombre = request.ClienteNombre,
                                Telefono = request.ClienteTelefono,
                                Direccion = request.ClienteDomicilio,
                                Nit = request.ClienteNit
                            },
                            transaction);
                    }
                }

                var idVendedor = await connection.ExecuteScalarAsync<int?>(
                    @"SELECT TOP 1 id_vendedor
                      FROM dbo.vendedor
                      WHERE nombre = @NombreVendedor;",
                    new { NombreVendedor = nombreVendedor },
                    transaction);

                if (!idVendedor.HasValue || idVendedor.Value <= 0)
                {
                    idVendedor = await connection.ExecuteScalarAsync<int>(
                        @"INSERT INTO dbo.vendedor (nombre, telefono)
                          VALUES (@NombreVendedor, NULL);
                          SELECT CAST(SCOPE_IDENTITY() AS INT);",
                        new { NombreVendedor = nombreVendedor },
                        transaction);
                }

                var idSesion = await connection.ExecuteScalarAsync<int?>(
                    @"SELECT TOP 1 id_sesion
                      FROM dbo.sesion_caja
                      WHERE id_usuario = @IdUsuario AND fecha_cierre IS NULL
                      ORDER BY fecha_apertura DESC;",
                    new { IdUsuario = idUsuario },
                    transaction);

                if (!idSesion.HasValue || idSesion.Value <= 0)
                {
                    idSesion = await connection.ExecuteScalarAsync<int>(
                        @"INSERT INTO dbo.sesion_caja (id_usuario)
                          VALUES (@IdUsuario);
                          SELECT CAST(SCOPE_IDENTITY() AS INT);",
                        new { IdUsuario = idUsuario },
                        transaction);
                }

                var idVenta = await connection.ExecuteScalarAsync<int>(
                    @"INSERT INTO dbo.venta (fecha, total, tipo_pago, id_cliente, id_vendedor, id_sesion)
                      VALUES (GETDATE(), @Total, @TipoPago, @IdCliente, @IdVendedor, @IdSesion);
                      SELECT CAST(SCOPE_IDENTITY() AS INT);",
                    new
                    {
                        Total = request.Total,
                        TipoPago = request.MetodoPago,
                        IdCliente = idCliente,
                        IdVendedor = idVendedor,
                        IdSesion = idSesion
                    },
                    transaction);

                foreach (var detalle in request.Detalles)
                {
                    await connection.ExecuteAsync(
                        @"INSERT INTO dbo.detalle_venta (id_venta, id_producto, cantidad, precio_unitario, subtotal)
                          VALUES (@IdVenta, @IdProducto, @Cantidad, @PrecioUnitario, @Subtotal);",
                        new
                        {
                            IdVenta = idVenta,
                            detalle.IdProducto,
                            detalle.Cantidad,
                            detalle.PrecioUnitario,
                            detalle.Subtotal
                        },
                        transaction);
                }

                var idFactura = await connection.ExecuteScalarAsync<int>(
                    @"INSERT INTO dbo.factura (numero_factura, fecha_emision, total, estado, id_venta)
                      VALUES ('TMP', GETDATE(), @Total, 'Emitida', @IdVenta);
                      SELECT CAST(SCOPE_IDENTITY() AS INT);",
                    new
                    {
                        Total = request.Total,
                        IdVenta = idVenta
                    },
                    transaction);

                var numeroFactura = $"FAC-{idFactura:000000}";
                await connection.ExecuteAsync(
                    @"UPDATE dbo.factura
                      SET numero_factura = @NumeroFactura
                      WHERE id_factura = @IdFactura;",
                    new
                    {
                        NumeroFactura = numeroFactura,
                        IdFactura = idFactura
                    },
                    transaction);

                var idRecibo = await connection.QuerySingleAsync<int>(
                    "dbo.sp_guardar_recibo_core",
                    new
                    {
                        IdFactura = idFactura,
                        Monto = request.Total,
                        MetodoPago = request.MetodoPago,
                        NumeroComprobante = request.ReferenciaPago
                    },
                    transaction,
                    commandType: CommandType.StoredProcedure);

                await transaction.CommitAsync();
                return idRecibo;
            }
            catch
            {
                await transaction.RollbackAsync();
                throw;
            }
        }
    }
}
