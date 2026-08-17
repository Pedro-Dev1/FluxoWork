-- 055: Dados bancarios do colaborador (necessarios para a remessa CNAB 240)
-- cnpj, chave_pix e tipo_chave_pix ja existem e sao reaproveitados.

ALTER TABLE colaboradores ADD COLUMN IF NOT EXISTS banco_codigo TEXT;
ALTER TABLE colaboradores ADD COLUMN IF NOT EXISTS banco_nome TEXT;
ALTER TABLE colaboradores ADD COLUMN IF NOT EXISTS agencia TEXT;
ALTER TABLE colaboradores ADD COLUMN IF NOT EXISTS agencia_digito TEXT;
ALTER TABLE colaboradores ADD COLUMN IF NOT EXISTS conta TEXT;
ALTER TABLE colaboradores ADD COLUMN IF NOT EXISTS conta_digito TEXT;
ALTER TABLE colaboradores ADD COLUMN IF NOT EXISTS tipo_conta TEXT;

COMMENT ON COLUMN colaboradores.banco_codigo IS 'Codigo COMPE do banco: 341 Itau, 001 BB, 237 Bradesco...';
COMMENT ON COLUMN colaboradores.tipo_conta IS 'corrente | poupanca';
