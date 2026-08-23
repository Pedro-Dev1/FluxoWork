-- O formulário de criação de pedido (pedido-form.tsx) exige motivo ao
-- adicionar um item de Condução ou Reembolso KM, mas buildPedido() nunca
-- salvava esse texto em lugar nenhum — o motivo era descartado assim que
-- o item entrava no resumo. Resultado: aprovador (gerente ou financeiro)
-- nunca via o motivo de condução/km, porque ele nunca existiu no banco.

-- PASSO 1 — preview: nada muda ainda
select count(*) as total_pedidos from pedidos_pagamento;

-- PASSO 2 — aplicar a migração
alter table pedidos_pagamento
add column if not exists motivo_conducao text,
add column if not exists motivo_km text;
