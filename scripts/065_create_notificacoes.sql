-- Notificações transacionais (eventos individuais, ex: "seu pedido foi
-- aprovado") — conceito separado de atualizacoes (avisos institucionais).
-- unique(tipo, entity_type, entity_id) é o mecanismo de idempotência: o
-- mesmo evento real nunca gera duas notificações, sem precisar de fila.

-- PASSO 1 — preview: nada muda ainda
select count(*) as total_colaboradores from colaboradores;

-- PASSO 2 — aplicar a migração
create table if not exists notificacoes (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid references tenants(id),
  tipo text not null,
  titulo text not null,
  mensagem text not null,
  entity_type text,
  entity_id uuid,
  cta_texto text,
  cta_url text,
  created_at timestamptz default now(),
  unique (tipo, entity_type, entity_id)
);

create index if not exists idx_notificacoes_tenant on notificacoes(tenant_id);

alter table notificacoes disable row level security;

create table if not exists notificacao_destinatarios (
  id uuid primary key default gen_random_uuid(),
  notificacao_id uuid not null references notificacoes(id) on delete cascade,
  colaborador_id uuid not null references colaboradores(id),
  lido_em timestamptz,
  created_at timestamptz default now(),
  unique (notificacao_id, colaborador_id)
);

create index if not exists idx_notificacao_destinatarios_colaborador on notificacao_destinatarios(colaborador_id);
create index if not exists idx_notificacao_destinatarios_nao_lidas on notificacao_destinatarios(colaborador_id) where lido_em is null;

alter table notificacao_destinatarios disable row level security;
