-- Boleto com registro (padrão exigido pelos bancos brasileiros) exige o
-- endereço do cliente no objeto customer da Pagar.me. Sem isso, o pedido é
-- criado normalmente mas nenhuma cobrança de boleto é gerada — confirmado
-- em produção: fatura ficou com status "falhou" e a mensagem "Pedido
-- criado, mas a Pagar.me não retornou os dados do boleto."

-- PASSO 1 — preview: nada muda ainda
select count(*) as total_tenants from tenants;

-- PASSO 2 — aplicar a migração
alter table tenants
  add column if not exists endereco_logradouro text,
  add column if not exists endereco_complemento text,
  add column if not exists endereco_cep text,
  add column if not exists endereco_cidade text,
  add column if not exists endereco_uf text;
