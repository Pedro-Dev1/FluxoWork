-- 052: Despesas itemizadas do pedido (extensivel, sem nova migracao por tipo)
-- Alimenta a tabela "Descricao / Quantidade / Valor unitario / Total" do detalhamento.
-- Despesas com reembolsavel = true ficam FORA do valor da nota fiscal.

CREATE TABLE IF NOT EXISTS pedido_despesas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pedido_id UUID NOT NULL REFERENCES pedidos_pagamento(id) ON DELETE CASCADE,
  tipo TEXT NOT NULL,
  descricao TEXT,
  quantidade NUMERIC(12, 2) NOT NULL DEFAULT 1,
  valor_unitario NUMERIC(12, 2) NOT NULL DEFAULT 0,
  valor_total NUMERIC(12, 2) NOT NULL DEFAULT 0,
  reembolsavel BOOLEAN NOT NULL DEFAULT TRUE,
  criado_por_colaborador_id UUID REFERENCES colaboradores(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_pedido_despesas_pedido_id ON pedido_despesas(pedido_id);
CREATE INDEX IF NOT EXISTS idx_pedido_despesas_tipo ON pedido_despesas(tipo);

COMMENT ON TABLE pedido_despesas IS 'Despesas itemizadas por pedido. reembolsavel=true indica valor fora da nota fiscal.';
COMMENT ON COLUMN pedido_despesas.tipo IS 'km | conducao | pedagio | alimentacao | estacionamento | hospedagem | outros';
