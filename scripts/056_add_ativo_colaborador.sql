-- Adiciona a possibilidade de desativar um usuário sem apagá-lo. Hoje
-- deletarColaborador já recusa remover quem tem pedidos associados (para
-- manter o histórico), então desativar é o único jeito de tirar alguém
-- do sistema sem perder o rastro financeiro.

-- PASSO 1 — preview: nada muda ainda, só confirma o estado atual
select count(*) as total_colaboradores from colaboradores;

-- PASSO 2 — aplicar a migração
alter table colaboradores
add column if not exists ativo boolean not null default true;
