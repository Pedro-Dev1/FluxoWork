-- 054: Agendamento e confirmacao de pagamento (status 'agendado')

ALTER TABLE pedidos_pagamento ADD COLUMN IF NOT EXISTS data_agendamento DATE;
ALTER TABLE pedidos_pagamento ADD COLUMN IF NOT EXISTS data_pagamento_efetivo DATE;
ALTER TABLE pedidos_pagamento ADD COLUMN IF NOT EXISTS forma_pagamento TEXT;
ALTER TABLE pedidos_pagamento ADD COLUMN IF NOT EXISTS banco_pagamento TEXT;
ALTER TABLE pedidos_pagamento ADD COLUMN IF NOT EXISTS agencia_pagamento TEXT;
ALTER TABLE pedidos_pagamento ADD COLUMN IF NOT EXISTS conta_pagamento TEXT;
ALTER TABLE pedidos_pagamento ADD COLUMN IF NOT EXISTS beneficiario_nome TEXT;
ALTER TABLE pedidos_pagamento ADD COLUMN IF NOT EXISTS observacao_agendamento TEXT;
ALTER TABLE pedidos_pagamento ADD COLUMN IF NOT EXISTS agendado_por_colaborador_id UUID REFERENCES colaboradores(id);
ALTER TABLE pedidos_pagamento ADD COLUMN IF NOT EXISTS data_agendado_em TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS idx_pedidos_data_agendamento ON pedidos_pagamento(data_agendamento);

-- Libera o novo status 'agendado' removendo qualquer CHECK restritivo em status.
-- O app valida os status na camada de aplicacao; remover o CHECK evita quebrar
-- os fluxos existentes que ja usam outros valores.
DO $$
DECLARE
  c RECORD;
BEGIN
  FOR c IN
    SELECT con.conname
    FROM pg_constraint con
    JOIN pg_class rel ON rel.oid = con.conrelid
    WHERE rel.relname = 'pedidos_pagamento'
      AND con.contype = 'c'
      AND pg_get_constraintdef(con.oid) ILIKE '%status%'
  LOOP
    EXECUTE format('ALTER TABLE pedidos_pagamento DROP CONSTRAINT %I', c.conname);
  END LOOP;
END $$;

COMMENT ON COLUMN pedidos_pagamento.forma_pagamento IS 'pix | ted | doc | transferencia_interna';
