-- Cancelar um boleto na Pagar.me exige os dados bancários do cliente (conta
-- desta integração é PSP — ver comentário em lib/pagarme.ts). Mesmo um
-- boleto nunca pago: como ele já foi registrado no banco emissor no momento
-- da emissão, a Pagar.me não garante que ele não será pago entre o clique em
-- "Cancelar" e o cancelamento propagar, então exige upfront pra onde
-- devolver o valor se isso acontecer ("Cancelamento Garantido"). Confirmado
-- em produção: toda tentativa de cancelar falhava com "BankAccount
-- information is required to refund boleto payment method."

-- PASSO 1 — preview: nada muda ainda
select count(*) as total_tenants from tenants;

-- PASSO 2 — aplicar a migração
alter table tenants
  add column if not exists banco_codigo text,
  add column if not exists banco_agencia text,
  add column if not exists banco_agencia_dv text,
  add column if not exists banco_conta text,
  add column if not exists banco_conta_dv text,
  add column if not exists banco_tipo_conta text
    check (banco_tipo_conta in ('conta_corrente', 'conta_poupanca'));
