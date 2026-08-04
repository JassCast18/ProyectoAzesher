using System.Data;
using System.Text.Json;
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
            var parametros = new DynamicParameters();
            parametros.Add("@IdRecibo", idRecibo);

            using var resultado = await connection.QueryMultipleAsync(
                "dbo.sp_obtener_recibo_venta",
                parametros,
                commandType: CommandType.StoredProcedure);

            var recibo = await resultado.ReadFirstOrDefaultAsync<ReciboVentaDTO>();
            if (recibo is null)
            {
                return null;
            }

            recibo.Detalles = (await resultado.ReadAsync<ReciboDetalleVentaDTO>()).ToList();
            return recibo;
        }

        public async Task<int> GuardarReciboAsync(ReciboTemporalRequestDTO request, int idUsuario, int idSucursal)
        {
            await using var connection = new SqlConnection(_connectionString);
            var parametros = new DynamicParameters();
            parametros.Add("@IdUsuario", idUsuario);
            parametros.Add("@IdCliente", request.IdCliente);
            parametros.Add("@IdSucursal", idSucursal);
            parametros.Add("@IdVendedor", request.IdVendedor);
            parametros.Add("@ClienteNombre", request.ClienteNombre);
            parametros.Add("@ClienteNit", request.ClienteNit);
            parametros.Add("@ClienteDomicilio", request.ClienteDomicilio);
            parametros.Add("@ClienteTelefono", request.ClienteTelefono);
            parametros.Add("@MetodoPago", request.MetodoPago);
            parametros.Add("@ReferenciaPago", request.ReferenciaPago);
            parametros.Add("@IdMoneda", request.IdMoneda);
            parametros.Add("@IdTipoPos", request.IdTipoPos);
            parametros.Add("@FechaTransferencia", request.FechaTransferencia);
            parametros.Add(
                "@ComprobanteTransferencia",
                DecodeBase64(request.ComprobanteBase64),
                dbType: DbType.Binary,
                size: -1);
            parametros.Add("@ComprobanteMime", request.ComprobanteMime);
            parametros.Add("@NumeroCuotas", request.NumeroCuotas);
            parametros.Add("@MontoInicial", request.MontoInicial);
            parametros.Add("@CuotasJson", JsonSerializer.Serialize(request.Cuotas));
            parametros.Add("@Total", request.Total);
            parametros.Add("@DetallesJson", JsonSerializer.Serialize(request.Detalles));

            try
            {
                return await connection.QuerySingleAsync<int>(
                    "dbo.sp_autorizar_venta",
                    parametros,
                    commandType: CommandType.StoredProcedure);
            }
            catch (SqlException ex) when (ex.Number >= 50000)
            {
                throw new InvalidOperationException(ex.Message, ex);
            }
        }

        public async Task<List<ReciboConsultaDTO>> BuscarRecibosAsync(int idSucursal, string query, DateTime? fechaDesde, DateTime? fechaHasta)
        {
            await using var connection = new SqlConnection(_connectionString);
            var parametros = new DynamicParameters();
            parametros.Add("@IdSucursal", idSucursal);
            parametros.Add("@Query", query?.Trim() ?? string.Empty);
            parametros.Add("@FechaDesde", fechaDesde);
            parametros.Add("@FechaHasta", fechaHasta);
            var resultado = await connection.QueryAsync<ReciboConsultaDTO>(
                "dbo.sp_buscar_recibos", parametros, commandType: CommandType.StoredProcedure);
            return resultado.ToList();
        }

        public async Task AnularReciboAsync(int idRecibo, int idSucursal, int idUsuario, string motivo)
        {
            await using var connection = new SqlConnection(_connectionString);
            var parametros = new DynamicParameters();
            parametros.Add("@IdRecibo", idRecibo);
            parametros.Add("@IdSucursal", idSucursal);
            parametros.Add("@IdUsuario", idUsuario);
            parametros.Add("@Motivo", motivo);
            try
            {
                await connection.ExecuteAsync("dbo.sp_anular_recibo", parametros, commandType: CommandType.StoredProcedure);
            }
            catch (SqlException ex) when (ex.Number >= 50000)
            {
                throw new InvalidOperationException(ex.Message, ex);
            }
        }

        private static byte[]? DecodeBase64(string? base64)
        {
            if (string.IsNullOrWhiteSpace(base64)) return null;
            var separatorIndex = base64.IndexOf(',');
            var content = separatorIndex >= 0 ? base64[(separatorIndex + 1)..] : base64;
            return Convert.FromBase64String(content);
        }
    }
}
