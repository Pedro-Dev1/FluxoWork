-- 057: Remessas CNAB 240 geradas para o banco

CREATE TABLE IF NOT EXISTS remessas_cnab (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  banco_codigo TEXT NOT NULL DEFAULT '341',
  numero_remessa INT NOT NULL,
  data_pagamento DATE,
  quantidade_pagamentos INT NOT NULL DEFAULT 0,
  valor_total NUMERIC(14, 2) NOT NULL DEFAULT 0,
  arquivo_url TEXT,
  nome_arquivo TEXT,
  status TEXT NOT NULL DEFAULT 'gerada',
  gerado_por_colaborador_id UUID REFERENCES colaboradores(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS remessa_cnab_itens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  remessa_id UUID NOT NULL REFERENCES remessas_cnab(id) ON DELETE CASCADE,
  pedido_id UUID REFERENCES pedidos_pagamento(id),
  valor NUMERIC(12, 2) NOT NULL DEFAULT 0,
  beneficiario_nome TEXT,
  beneficiario_documento TEXT,
  sequencial INT NOT NULL DEFAULT 1,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_remessa_itens_remessa_id ON remessa_cnab_itens(remessa_id);
CREATE INDEX IF NOT EXISTS idx_remessa_itens_pedido_id ON remessa_cnab_itens(pedido_id);
CREATE INDEX IF NOT EXISTS idx_remessas_cnab_banco_numero ON remessas_cnab(banco_codigo, numero_remessa DESC);

COMMENT ON COLUMN remessas_cnab.status IS 'gerada | enviada | processada';
