SET QUOTED_IDENTIFIER ON;
GO
UPDATE dbo.traslado
SET numero_traslado = CONCAT('NE-', FORMAT(ISNULL(fecha, GETDATE()), 'yyyyMM'), '-', RIGHT('000000' + CONVERT(VARCHAR(10), id_traslado), 6))
WHERE numero_traslado IS NULL;
GO
