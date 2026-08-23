-- Três constraints hoje são UNIQUE globais, mas deveriam ser únicas por
-- carteira: duas equipes de tenants diferentes podem se chamar "Equipe A"
-- sem colidir, o mesmo vale para numero_boleto e numero de centro de custo.
--
-- PASSO 1 de cada bloco é obrigatório e não é só um preview: se ele retornar
-- alguma linha, PARE e resolva manualmente antes de rodar o PASSO 2 daquele
-- bloco — mesclar nomes duplicados afeta FKs (equipes é referenciada por
-- colaboradores.equipe_id) e não deve ser decidido automaticamente aqui.

-- ===== equipes.nome =====

-- PASSO 1 — deve retornar 0 linhas
select tenant_id, lower(trim(nome)) as nome_normalizado, count(*)
from equipes
group by tenant_id, lower(trim(nome))
having count(*) > 1;

-- PASSO 2 — aplicar (só se o PASSO 1 acima não retornou nada)
alter table equipes add column if not exists nome_normalizado text
  generated always as (lower(trim(nome))) stored;

do $$
declare
  cname text;
begin
  select constraint_name into cname
  from information_schema.table_constraints
  where table_name = 'equipes' and constraint_type = 'UNIQUE'
    and constraint_name in (
      select constraint_name from information_schema.constraint_column_usage
      where table_name = 'equipes' and column_name = 'nome'
    );
  if cname is not null then
    execute format('alter table equipes drop constraint %I', cname);
  end if;
end $$;

create unique index if not exists idx_equipes_tenant_nome on equipes (tenant_id, nome_normalizado);

-- ===== boletos.numero_boleto =====

-- PASSO 1 — deve retornar 0 linhas
select tenant_id, lower(trim(numero_boleto)) as numero_normalizado, count(*)
from boletos
group by tenant_id, lower(trim(numero_boleto))
having count(*) > 1;

-- PASSO 2 — aplicar (só se o PASSO 1 acima não retornou nada)
alter table boletos add column if not exists numero_boleto_normalizado text
  generated always as (lower(trim(numero_boleto))) stored;

do $$
declare
  cname text;
begin
  select constraint_name into cname
  from information_schema.table_constraints
  where table_name = 'boletos' and constraint_type = 'UNIQUE'
    and constraint_name in (
      select constraint_name from information_schema.constraint_column_usage
      where table_name = 'boletos' and column_name = 'numero_boleto'
    );
  if cname is not null then
    execute format('alter table boletos drop constraint %I', cname);
  end if;
end $$;

create unique index if not exists idx_boletos_tenant_numero on boletos (tenant_id, numero_boleto_normalizado);

-- ===== centros_custo.numero =====

-- PASSO 1 — deve retornar 0 linhas
select tenant_id, lower(trim(numero)) as numero_normalizado, count(*)
from centros_custo
group by tenant_id, lower(trim(numero))
having count(*) > 1;

-- PASSO 2 — aplicar (só se o PASSO 1 acima não retornou nada)
alter table centros_custo add column if not exists numero_normalizado text
  generated always as (lower(trim(numero))) stored;

do $$
declare
  cname text;
begin
  select constraint_name into cname
  from information_schema.table_constraints
  where table_name = 'centros_custo' and constraint_type = 'UNIQUE'
    and constraint_name in (
      select constraint_name from information_schema.constraint_column_usage
      where table_name = 'centros_custo' and column_name = 'numero'
    );
  if cname is not null then
    execute format('alter table centros_custo drop constraint %I', cname);
  end if;
end $$;

create unique index if not exists idx_centros_custo_tenant_numero on centros_custo (tenant_id, numero_normalizado);

-- colaboradores.email fica global e sem alteração de propósito — login é só
-- por e-mail, sem seletor de carteira, então um e-mail precisa resolver para
-- exatamente uma conta em todo o sistema.
