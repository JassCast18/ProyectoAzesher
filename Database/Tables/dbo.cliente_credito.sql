-- Configuración de clientes autorizados para comprar al crédito.
IF OBJECT_ID('dbo.cliente_credito', 'U') IS NULL
BEGIN
    CREATE TABLE dbo.cliente_credito (
        id_cliente_credito INT IDENTITY(1,1) PRIMARY KEY,
        id_cliente INT NOT NULL,
        limite_credito DECIMAL(12,2) NOT NULL,
        activo BIT NOT NULL CONSTRAINT df_cliente_credito_activo DEFAULT 1,
        CONSTRAINT uq_cliente_credito_cliente UNIQUE (id_cliente),
        CONSTRAINT fk_cliente_credito_cliente FOREIGN KEY (id_cliente) REFERENCES dbo.cliente(id_cliente),
        CONSTRAINT ck_cliente_credito_limite CHECK (limite_credito > 0)
    );
END
GO
