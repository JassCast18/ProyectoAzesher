-- Asocia sesiones históricas con la sucursal asignada al usuario que las abrió.
UPDATE sc
SET sc.id_sucursal = u.id_sucursal
FROM dbo.sesion_caja sc
INNER JOIN dbo.usuario u ON u.id_usuario = sc.id_usuario
WHERE sc.id_sucursal IS NULL
  AND u.id_sucursal IS NOT NULL;
GO
