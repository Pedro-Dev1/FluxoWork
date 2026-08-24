-- Faturamento da plataforma: a FluxoPay cobra cada carteira mensalmente, no
-- dia configurado, com base na quantidade de colaboradores ativos vezes o
-- valor por usuário definido pra aquela carteira. unique(tenant_id,
-- referencia_ano, referencia_mes) é o mecanismo de idempotência — a mesma
-- carteira nunca é cobrada duas vezes no mesmo mês, mesmo padrão já usado em
-- notificacoes (unique(tipo, entity_type, entity_id)).

-- PASSO 1 — preview: nada muda ainda
select count(*) as total_tenants from tenants;

-- PASSO 2 — aplicar a migração
alter table tenants
  add column if not exists valor_por_usuario_ativo numeric(10, 2),
  add column if not exists dia_faturamento integer check (dia_faturamento between 1 and 28),
  add column if not exists documento text,
  add column if not exists email_faturamento text,
  add column if not exists telefone_faturamento text,
  add column if not exists pagarme_customer_id text;

create table if not exists faturas_plataforma (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references tenants(id),
  referencia_ano integer not null,
  referencia_mes integer not null check (referencia_mes between 1 and 12),
  quantidade_usuarios_ativos integer not null,
  valor_unitario numeric(10, 2) not null,
  valor_total numeric(12, 2) not null,
  status text not null default 'pendente'
    check (status in ('pendente', 'emitida', 'paga', 'falhou', 'cancelada', 'vencida')),
  pagarme_order_id text,
  pagarme_charge_id text,
  boleto_url text,
  boleto_linha_digitavel text,
  boleto_codigo_barras text,
  data_vencimento date,
  data_pagamento timestamptz,
  erro_mensagem text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (tenant_id, referencia_ano, referencia_mes)
);

create index if not exists idx_faturas_plataforma_tenant on faturas_plataforma(tenant_id);
create index if not exists idx_faturas_plataforma_pagarme_order on faturas_plataforma(pagarme_order_id);

alter table faturas_plataforma disable row level security;
