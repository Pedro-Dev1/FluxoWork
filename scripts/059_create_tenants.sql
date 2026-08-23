-- Primeira peça do multi-tenant: a tabela de carteiras/empresas.
-- Cada cliente do FluxoPay vira uma linha aqui; Connect Vending é a primeira.

-- PASSO 1 — preview: nada muda ainda
select count(*) as total_colaboradores from colaboradores;

-- PASSO 2 — aplicar a migração
create table if not exists tenants (
  id uuid primary key default gen_random_uuid(),
  nome text not null,
  slug text not null,
  ativo boolean not null default true,
  created_at timestamptz default now(),
  created_by uuid references colaboradores(id)
);

create unique index if not exists idx_tenants_slug on tenants (lower(slug));

-- RLS desabilitado, consistente com o resto do projeto — isolamento é
-- reforçado na camada de aplicação, não no Postgres, nesta fase.
alter table tenants disable row level security;

insert into tenants (nome, slug)
values ('Connect Vending', 'connect-vending')
on conflict do nothing;
