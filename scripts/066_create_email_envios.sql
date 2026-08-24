-- Rastreio de envio de e-mail, compartilhado entre atualizacoes e
-- notificacoes. Os índices únicos parciais impedem envio duplicado do mesmo
-- comunicado/notificação para o mesmo colaborador, mesmo se a ação de
-- "enviar" for disparada mais de uma vez.

-- PASSO 1 — preview: nada muda ainda
select count(*) as total_colaboradores from colaboradores;

-- PASSO 2 — aplicar a migração
create table if not exists email_envios (
  id uuid primary key default gen_random_uuid(),
  atualizacao_id uuid references atualizacoes(id),
  notificacao_id uuid references notificacoes(id),
  colaborador_id uuid not null references colaboradores(id),
  email text not null,
  status text not null default 'pendente' check (status in ('pendente','enviado','falhou')),
  enviado_em timestamptz,
  provider_message_id text,
  erro text,
  created_at timestamptz default now(),
  check ((atualizacao_id is not null)::int + (notificacao_id is not null)::int = 1)
);

create unique index if not exists idx_email_envios_atualizacao_colab
  on email_envios(atualizacao_id, colaborador_id) where atualizacao_id is not null;
create unique index if not exists idx_email_envios_notificacao_colab
  on email_envios(notificacao_id, colaborador_id) where notificacao_id is not null;

alter table email_envios disable row level security;
