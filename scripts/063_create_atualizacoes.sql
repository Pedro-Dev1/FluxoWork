-- Tabela principal dos avisos institucionais (Atualizações), geridos pelo
-- Super Admin. tenant_id aqui tem o significado OPOSTO de colaboradores.tenant_id:
-- aqui NULL = visível em todas as carteiras (global), não "sem carteira".
-- Por isso essa tabela não usa scopeToTenant() — usa scopeToTenantOrGlobal(),
-- adicionado em lib/auth-utils.ts.

-- PASSO 1 — preview: nada muda ainda
select count(*) as total_tenants from tenants;

-- PASSO 2 — aplicar a migração
create table if not exists atualizacoes (
  id uuid primary key default gen_random_uuid(),
  titulo text not null,
  subtitulo text,
  descricao text not null,
  categoria text not null check (categoria in (
    'NOVA FUNCIONALIDADE','MELHORIA','IMPORTANTE','AVISO',
    'FINANCEIRO','AÇÃO NECESSÁRIA','INFORMATIVO'
  )),
  imagem_url text,
  cta_texto text,
  cta_url text,
  status text not null default 'DRAFT' check (status in ('DRAFT','PUBLISHED','INACTIVE')),
  destaque boolean not null default false,
  exibir_na_plataforma boolean not null default true,
  enviar_email boolean not null default false,
  publish_at timestamptz,
  expires_at timestamptz,
  tenant_id uuid references tenants(id), -- NULL = visível em todas as carteiras
  roles text[],                          -- NULL/vazio = todos os papéis
  criado_por uuid references colaboradores(id),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index if not exists idx_atualizacoes_status on atualizacoes(status);
create index if not exists idx_atualizacoes_tenant on atualizacoes(tenant_id);
create index if not exists idx_atualizacoes_destaque on atualizacoes(destaque) where destaque = true;

alter table atualizacoes disable row level security;
