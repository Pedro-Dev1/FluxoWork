-- O constraint pedidos_pagamento_status_check não inclui 'expirado', o novo
-- status usado para pedidos aprovados que ficaram 15 dias sem o colaborador
-- anexar a nota fiscal. Sem esta migração, o UPDATE feito automaticamente
-- por listarPedidosSemNota (app/actions/pedidos.ts) falha silenciosamente
-- e os pedidos antigos continuam poluindo a aba "Sem nota" do financeiro.
--
-- De passagem, também adiciona 'aguardando_prorrogacao' e 'prorrogacao_negada'
-- ao constraint — já eram usados pelo fluxo de prorrogação de prazo mas
-- nunca tinham sido incluídos aqui.

-- PASSO 1 — preview: quantos pedidos seriam afetados agora, se rodasse hoje
select count(*) as pedidos_a_expirar
from pedidos_pagamento
where status in ('pendente_financeiro', 'aprovado')
  and nota_fiscal_url is null
  and tipo_pedido is distinct from 'reembolso_km'
  and created_at < now() - interval '15 days';

-- PASSO 2 — aplicar a migração (rode depois de conferir o PASSO 1)
alter table pedidos_pagamento
drop constraint if exists pedidos_pagamento_status_check;

alter table pedidos_pagamento
add constraint pedidos_pagamento_status_check
check (status in (
  'pendente_gerente',
  'pendente_financeiro',
  'aprovado',
  'recusado',
  'correcao',
  'nota_recebida',
  'pago',
  'aguardando_prorrogacao',
  'prorrogacao_negada',
  'expirado'
));
