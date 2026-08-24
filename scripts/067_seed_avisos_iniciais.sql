-- Cadastra os 4 avisos iniciais do sistema de Atualizações, já publicados.
-- Conteúdo, não schema — mas segue a mesma numeração dos outros scripts para
-- manter o histórico rastreável.

-- PASSO 1 — preview: confirma que a tabela existe e está vazia
select count(*) as total_atualizacoes from atualizacoes;

-- PASSO 2 — aplicar
insert into atualizacoes (
  titulo, subtitulo, descricao, categoria, cta_texto, cta_url,
  status, exibir_na_plataforma, enviar_email, roles, criado_por
) values
(
  'Você sabia que é possível desativar usuários?',
  null,
  'Permita que usuários que ainda não utilizam o FluxoPay sejam desativados temporariamente. Assim, eles deixam de fazer parte da base ativa e você evita cobranças de usuários que ainda não começaram a utilizar a plataforma.',
  'AVISO',
  'Gerenciar usuários',
  '/cadastros/colaboradores',
  'PUBLISHED',
  true,
  true,
  ARRAY['Adm','Financeiro']::text[],
  (select id from colaboradores where email = 'simpleqia.oficial@gmail.com')
),
(
  'Agora o FluxoPay avisa quando o pedido for aprovado',
  null,
  'Agora o FluxoPay envia alertas automáticos para os prestadores assim que um pedido é aprovado. Assim, o prestador sabe que já pode acessar o pedido e anexar a nota fiscal.',
  'NOVA FUNCIONALIDADE',
  'Ver pedidos',
  '/meus-pagamentos',
  'PUBLISHED',
  true,
  false,
  ARRAY['Colaborador']::text[],
  (select id from colaboradores where email = 'simpleqia.oficial@gmail.com')
),
(
  'Você é um aprovador? Mantenha seu e-mail atualizado',
  null,
  'Deixe seu e-mail atualizado no FluxoPay e receba notificações quando houver pedidos aguardando sua aprovação. Assim, você não perde solicitações importantes e consegue acompanhar os pedidos que dependem da sua aprovação.',
  'AÇÃO NECESSÁRIA',
  'Atualizar meu e-mail',
  '/cadastros/colaboradores',
  'PUBLISHED',
  true,
  true,
  ARRAY['Gerente','Financeiro','Adm']::text[],
  (select id from colaboradores where email = 'simpleqia.oficial@gmail.com')
),
(
  'Agora o FluxoPay envia seu boleto automaticamente',
  null,
  'No dia do fechamento, o FluxoPay gera e envia automaticamente o boleto da sua cobrança. Você também pode acompanhar e pagar diretamente pela plataforma através do módulo financeiro.',
  'FINANCEIRO',
  'Acessar financeiro',
  '/financeiro',
  'PUBLISHED',
  true,
  true,
  ARRAY['Adm','Financeiro']::text[],
  (select id from colaboradores where email = 'simpleqia.oficial@gmail.com')
);
