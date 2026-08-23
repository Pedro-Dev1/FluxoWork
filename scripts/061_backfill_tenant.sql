-- Backfill de tenant_id. Como só existe uma carteira até aqui (Connect
-- Vending), a regra é simples: todo mundo entra em Connect Vending, exceto
-- simpleqia.oficial@gmail.com, que vira Super Admin sem tenant (tenant_id
-- fica NULL — Super Admin enxerga todas as carteiras, não pertence a uma só).
--
-- Ordem importa: colaboradores primeiro, porque as tabelas seguintes herdam
-- o tenant_id a partir do colaborador relacionado.

-- ===== 1) colaboradores =====

-- PASSO 1 — preview
select id, email, nome_completo from colaboradores where email = 'simpleqia.oficial@gmail.com';
select count(*) as total_outros_colaboradores from colaboradores where email <> 'simpleqia.oficial@gmail.com';

-- PASSO 2 — aplicar
update colaboradores
set tenant_id = (select id from tenants where slug = 'connect-vending')
where email <> 'simpleqia.oficial@gmail.com';

update colaboradores
set tenant_id = null, is_super_admin = true
where email = 'simpleqia.oficial@gmail.com';

-- ===== 2) pedidos_pagamento (via colaborador_id) =====

-- PASSO 1 — preview: deve retornar 0 (todo pedido tem colaborador válido)
select count(*) from pedidos_pagamento p left join colaboradores c on c.id = p.colaborador_id where c.id is null;

-- PASSO 2 — aplicar
update pedidos_pagamento p set tenant_id = c.tenant_id from colaboradores c where c.id = p.colaborador_id;

-- ===== 3) historico_reajustes (via colaborador_id) =====

-- PASSO 1 — preview: deve retornar 0
select count(*) from historico_reajustes h left join colaboradores c on c.id = h.colaborador_id where c.id is null;

-- PASSO 2 — aplicar
update historico_reajustes h set tenant_id = c.tenant_id from colaboradores c where c.id = h.colaborador_id;

-- ===== 4) notas_fiscais (via colaborador_id) =====

-- PASSO 1 — preview: deve retornar 0
select count(*) from notas_fiscais n left join colaboradores c on c.id = n.colaborador_id where c.id is null;

-- PASSO 2 — aplicar
update notas_fiscais n set tenant_id = c.tenant_id from colaboradores c where c.id = n.colaborador_id;

-- ===== 5) user_terms_acceptance (via user_id) =====

-- PASSO 1 — preview: deve retornar 0
select count(*) from user_terms_acceptance u left join colaboradores c on c.id = u.user_id where c.id is null;

-- PASSO 2 — aplicar
update user_terms_acceptance u set tenant_id = c.tenant_id from colaboradores c where c.id = u.user_id;

-- ===== 6) faturas (via criado_por; sem criado_por cai em Connect Vending —
-- única carteira existente neste ponto da migração, não há outra resposta
-- correta) =====

-- PASSO 1 — preview: quantas faturas vão cair no fallback
select count(*) from faturas where criado_por is null;

-- PASSO 2 — aplicar
update faturas f set tenant_id = c.tenant_id from colaboradores c where c.id = f.criado_por;
update faturas set tenant_id = (select id from tenants where slug = 'connect-vending') where tenant_id is null;

-- ===== 7) boletos (via criado_por; mesmo fallback de faturas) =====

-- PASSO 1 — preview: quantos boletos vão cair no fallback
select count(*) from boletos where criado_por is null;

-- PASSO 2 — aplicar
update boletos b set tenant_id = c.tenant_id from colaboradores c where c.id = b.criado_por;
update boletos set tenant_id = (select id from tenants where slug = 'connect-vending') where tenant_id is null;

-- ===== 8) equipes (sem caminho relacional até um colaborador — atribuição direta) =====

-- PASSO 1 — preview
select count(*) from equipes;

-- PASSO 2 — aplicar
update equipes set tenant_id = (select id from tenants where slug = 'connect-vending');

-- ===== 9) centros_custo (sem caminho relacional até um colaborador — atribuição direta) =====

-- PASSO 1 — preview
select count(*) from centros_custo;

-- PASSO 2 — aplicar
update centros_custo set tenant_id = (select id from tenants where slug = 'connect-vending');

-- ===== Conferência final =====
-- Depois de rodar tudo acima, isto deve retornar zero linhas em todas as
-- tabelas (exceto colaboradores, onde 1 linha — o super admin — é esperada):
select 'colaboradores' as tabela, count(*) from colaboradores where tenant_id is null and is_super_admin = false
union all select 'pedidos_pagamento', count(*) from pedidos_pagamento where tenant_id is null
union all select 'historico_reajustes', count(*) from historico_reajustes where tenant_id is null
union all select 'notas_fiscais', count(*) from notas_fiscais where tenant_id is null
union all select 'user_terms_acceptance', count(*) from user_terms_acceptance where tenant_id is null
union all select 'faturas', count(*) from faturas where tenant_id is null
union all select 'boletos', count(*) from boletos where tenant_id is null
union all select 'equipes', count(*) from equipes where tenant_id is null
union all select 'centros_custo', count(*) from centros_custo where tenant_id is null;
