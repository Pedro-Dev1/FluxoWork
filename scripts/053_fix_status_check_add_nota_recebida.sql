-- O constraint pedidos_pagamento_status_check nunca incluiu o valor
-- 'nota_recebida', mesmo o código usando esse status desde a criação do
-- fluxo de aprovação de nota fiscal (aprovarNotaFiscal em app/actions/pedidos.ts).
-- Resultado: todo UPDATE para status='nota_recebida' era rejeitado pelo
-- Postgres por violar o constraint — o botão "Nota Recebida" nunca funcionou.

ALTER TABLE pedidos_pagamento
DROP CONSTRAINT IF EXISTS pedidos_pagamento_status_check;

ALTER TABLE pedidos_pagamento
ADD CONSTRAINT pedidos_pagamento_status_check
CHECK (status IN (
  'pendente_gerente',
  'pendente_financeiro',
  'aprovado',
  'recusado',
  'correcao',
  'nota_recebida',
  'pago',
  'aguardando_prorrogacao',
  'prorrogacao_negada'
));
