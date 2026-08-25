-- Troca o "dia do mês" configurável por carteira (dia_faturamento) por uma
-- data de início da cobrança + dia fixo (sempre dia 1). Pedido do usuário:
-- carteiras novas não devem faturar antes de uma data combinada com o
-- cliente, e depois disso a cobrança cai sempre no dia 1 — não precisa mais
-- escolher o dia por carteira.
--
-- dia_faturamento fica na tabela sem uso (não é lido em nenhum lugar do
-- código a partir desta mudança) — não foi dropada aqui pra não perder o
-- histórico numa tabela financeira sem necessidade.

-- PASSO 1 — preview: nada muda ainda
select count(*) as total_tenants from tenants;

-- PASSO 2 — aplicar a migração
alter table tenants
  add column if not exists data_inicio_cobranca date;

-- Carteiras já configuradas (com valor por usuário definido) continuam
-- sendo cobradas a partir de hoje — sem isso, o próximo dia 1 pularia elas
-- por falta de data_inicio_cobranca.
update tenants
set data_inicio_cobranca = current_date
where valor_por_usuario_ativo is not null
  and data_inicio_cobranca is null;
