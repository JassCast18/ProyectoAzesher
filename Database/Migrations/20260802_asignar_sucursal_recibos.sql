-- Completa la sucursal de recibos históricos a partir del usuario de caja.
UPDATE r
SET r.id_sucursal = u.id_sucursal
FROM dbo.recibo r
INNER JOIN dbo.factura f ON f.id_factura = r.id_factura
INNER JOIN dbo.venta v ON v.id_venta = f.id_venta
INNER JOIN dbo.sesion_caja sc ON sc.id_sesion = v.id_sesion
INNER JOIN dbo.usuario u ON u.id_usuario = sc.id_usuario
WHERE r.id_sucursal IS NULL
  AND u.id_sucursal IS NOT NULL;
GO
