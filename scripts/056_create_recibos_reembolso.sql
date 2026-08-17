-- 056: Recibos de reembolso com aceite eletronico e/ou assinatura digital
-- O snapshot jsonb congela a composicao no momento da geracao: o recibo e um
-- documento e nao pode mudar se o pedido for corrigido depois.

CREATE TABLE IF NOT EXISTS recibos_reembolso (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pedido_id UUID NOT NULL REFERENCES pedidos_pagamento(id) ON DELETE CASCADE,
  numero_recibo TEXT NOT NULL,
  versao INT NOT NULL DEFAULT 1,
  valor_total_reembolso NUMERIC(12, 2) NOT NULL DEFAULT 0,
  snapshot JSONB,
  status TEXT NOT NULL DEFAULT 'pendente',

  -- Aceite eletronico
  aceite_nome TEXT,
  aceite_cpf_cnpj TEXT,
  aceite_email TEXT,
  aceite_ip TEXT,
  aceite_em TIMESTAMPTZ,
  aceite_colaborador_id UUID REFERENCES colaboradores(id),

  -- Assinatura digital (upload do documento assinado)
  arquivo_assinado_url TEXT,
  arquivo_assinado_em TIMESTAMPTZ,
  arquivo_assinado_por UUID REFERENCES colaboradores(id),

  gerado_por_colaborador_id UUID REFERENCES colaboradores(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_recibos_pedido_id ON recibos_reembolso(pedido_id);
CREATE UNIQUE INDEX IF NOT EXISTS idx_recibos_numero ON recibos_reembolso(numero_recibo);

COMMENT ON COLUMN recibos_reembolso.status IS 'pendente | aceito | assinado';
COMMENT ON COLUMN recibos_reembolso.snapshot IS 'Composicao financeira congelada na geracao do recibo.';
