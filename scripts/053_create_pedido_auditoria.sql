-- 053: Trilha de auditoria do pedido
-- Guarda snapshot do nome/tipo de acesso do ator para sobreviver a mudancas no cadastro.

CREATE TABLE IF NOT EXISTS pedido_auditoria (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pedido_id UUID NOT NULL REFERENCES pedidos_pagamento(id) ON DELETE CASCADE,
  acao TEXT NOT NULL,
  colaborador_id UUID REFERENCES colaboradores(id),
  ator_nome TEXT,
  ator_tipo_acesso TEXT,
  observacao TEXT,
  status_anterior TEXT,
  status_novo TEXT,
  valores_anteriores JSONB,
  valores_novos JSONB,
  metadata JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_pedido_auditoria_pedido_created
  ON pedido_auditoria(pedido_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_pedido_auditoria_acao ON pedido_auditoria(acao);

COMMENT ON TABLE pedido_auditoria IS 'Trilha de auditoria: quem fez, o que fez e quando, com diff de valores.';
COMMENT ON COLUMN pedido_auditoria.acao IS 'criado | alterado | valor_alterado | aprovado_gerente | recusado | correcao_solicitada | validado_financeiro | agendado | pago | nota_anexada | nota_aprovada | recibo_gerado | recibo_aceito | recibo_assinado | cnab_gerado';
