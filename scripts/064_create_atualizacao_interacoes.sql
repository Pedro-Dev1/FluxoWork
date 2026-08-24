-- Rastreia, por colaborador, se um aviso foi visualizado e/ou dispensado.
-- Uma tabela só para os dois estados (visualização é usada para métrica,
-- dispensa é usada para o banner do dashboard nunca mais reaparecer).

-- PASSO 1 — preview: nada muda ainda
select count(*) as total_atualizacoes from atualizacoes;

-- PASSO 2 — aplicar a migração
create table if not exists atualizacao_interacoes (
  id uuid primary key default gen_random_uuid(),
  atualizacao_id uuid not null references atualizacoes(id) on delete cascade,
  colaborador_id uuid not null references colaboradores(id),
  visualizado_em timestamptz,
  dispensado_em timestamptz,
  created_at timestamptz default now(),
  unique (atualizacao_id, colaborador_id)
);

create index if not exists idx_atualizacao_interacoes_colaborador on atualizacao_interacoes(colaborador_id);

alter table atualizacao_interacoes disable row level security;
