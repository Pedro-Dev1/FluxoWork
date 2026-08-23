-- Adiciona tenant_id (nullable por enquanto — endurece para NOT NULL só
-- depois que todo o app estiver filtrando por tenant, na migração 063) em
-- toda tabela que guarda dado pertencente a uma carteira. Pula tabelas de
-- junção pura (gerentes_equipes, faturas_colaboradores — herdam o tenant do
-- registro pai) e system_status (global por natureza).
--
-- Reaproveita audit_log como tabela de auditoria do multi-tenant. Ela é
-- definida em 013_security_improvements.sql, mas essa migração aparentemente
-- não rodou até o fim em produção (a tabela não existe) — por isso o PASSO 2
-- abaixo cria ela com CREATE TABLE IF NOT EXISTS em vez de assumir que já
-- existe, e ela fica de fora do preview do PASSO 1.

-- PASSO 1 — preview: confirma que as tabelas existem e quantas linhas cada uma tem
select 'colaboradores' as tabela, count(*) from colaboradores
union all select 'pedidos_pagamento', count(*) from pedidos_pagamento
union all select 'equipes', count(*) from equipes
union all select 'centros_custo', count(*) from centros_custo
union all select 'notas_fiscais', count(*) from notas_fiscais
union all select 'faturas', count(*) from faturas
union all select 'user_terms_acceptance', count(*) from user_terms_acceptance
union all select 'historico_reajustes', count(*) from historico_reajustes
union all select 'boletos', count(*) from boletos;

-- PASSO 2 — aplicar a migração
create table if not exists audit_log (
  id uuid primary key default gen_random_uuid(),
  colaborador_id uuid references colaboradores(id),
  acao text not null,
  tabela text,
  registro_id text,
  detalhes jsonb,
  ip_address text,
  created_at timestamp with time zone default now()
);

create index if not exists idx_audit_log_colaborador on audit_log(colaborador_id);
create index if not exists idx_audit_log_created on audit_log(created_at);

alter table colaboradores add column if not exists tenant_id uuid references tenants(id);
alter table colaboradores add column if not exists is_super_admin boolean not null default false;

alter table pedidos_pagamento add column if not exists tenant_id uuid references tenants(id);
alter table equipes add column if not exists tenant_id uuid references tenants(id);
alter table centros_custo add column if not exists tenant_id uuid references tenants(id);
alter table notas_fiscais add column if not exists tenant_id uuid references tenants(id);
alter table faturas add column if not exists tenant_id uuid references tenants(id);
alter table user_terms_acceptance add column if not exists tenant_id uuid references tenants(id);
alter table historico_reajustes add column if not exists tenant_id uuid references tenants(id);
alter table boletos add column if not exists tenant_id uuid references tenants(id);
alter table audit_log add column if not exists tenant_id uuid references tenants(id);

create index if not exists idx_colaboradores_tenant on colaboradores(tenant_id);
create index if not exists idx_pedidos_tenant on pedidos_pagamento(tenant_id);
create index if not exists idx_equipes_tenant on equipes(tenant_id);
create index if not exists idx_centros_custo_tenant on centros_custo(tenant_id);
create index if not exists idx_notas_fiscais_tenant on notas_fiscais(tenant_id);
create index if not exists idx_faturas_tenant on faturas(tenant_id);
create index if not exists idx_user_terms_tenant on user_terms_acceptance(tenant_id);
create index if not exists idx_historico_reajustes_tenant on historico_reajustes(tenant_id);
create index if not exists idx_boletos_tenant on boletos(tenant_id);
create index if not exists idx_audit_log_tenant on audit_log(tenant_id);
