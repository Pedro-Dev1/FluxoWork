-- =====================================================================
-- CORRIGE valor_total / horas_extras / salario_base de pedidos antigos
-- =====================================================================
-- BUG: ao corrigir um pedido (corrigirPedido em app/actions/pedidos.ts) ou
-- ao ler dados em várias telas, o sistema usava o SALÁRIO ATUAL do
-- colaborador (colaboradores.salario) em vez do salário que estava
-- vigente na data em que o pedido foi criado. Resultado: quando um
-- colaborador recebe um reajuste, pedidos antigos que passam por
-- correção (ou telas que recalculavam na leitura) tinham o valor_total
-- recalculado com o salário NOVO, inflando o histórico.
--
-- O código-fonte já foi corrigido para congelar o salário em
-- pedidos_pagamento.salario_base no momento da criação e usá-lo em vez
-- do salário ao vivo. Este script conserta os dados que já existem no
-- banco, reconstruindo o salário correto de cada pedido a partir da
-- linha do tempo em historico_reajustes.
--
-- Reconstrução do salário vigente na data do pedido (p.created_at):
--   1) o salario_novo do reajuste mais recente até aquela data, OU
--   2) se o colaborador nunca teve reajuste até aquela data, o
--      salario_anterior do PRIMEIRO reajuste que ele já teve (o salário
--      "de antes de qualquer reajuste"), OU
--   3) se o colaborador nunca teve nenhum reajuste registrado, o
--      salário atual dele (não há como saber que já foi diferente).
--
-- IMPORTANTE:
--  - horas_extras_50, horas_extras_100, valor_plantao, comissao,
--    valor_desconto e valor_km são inputs brutos do formulário e NÃO
--    são afetados pelo bug — são preservados como estão.
--  - Pedidos do tipo 'reembolso_km' não usam salário no cálculo do
--    valor_total, então não são tocados.
--  - Faça backup/exporte a tabela pedidos_pagamento antes de rodar o
--    UPDATE. Rode o PASSO 1 (preview) primeiro e confira as diferenças
--    antes de aplicar o PASSO 2.
--  - Se algum colaborador já teve o salário alterado por edição direta
--    do cadastro (fora do fluxo de "Reajuste"), essa mudança não fica
--    registrada em historico_reajustes e a reconstrução abaixo pode não
--    refletir esse caso — confira manualmente os colaboradores que
--    tiveram edição direta de salário.
-- =====================================================================

-- PASSO 1: PREVIEW — rode primeiro e confira antes de aplicar o UPDATE
SELECT
  p.id,
  c.nome_completo,
  p.created_at,
  p.salario_base   AS salario_base_atual,
  sc.salario_correto,
  p.valor_total     AS valor_total_atual,
  ROUND((
    sc.salario_correto
    + (COALESCE(p.horas_extras_50, 0) * (sc.salario_correto / 220) * 1.5)
    + (COALESCE(p.horas_extras_100, 0) * (sc.salario_correto / 220) * 2)
    + COALESCE(p.valor_plantao, 0)
    + COALESCE(p.comissao, 0)
    - COALESCE(p.valor_desconto, 0)
  )::numeric, 2) AS valor_total_correto
FROM pedidos_pagamento p
JOIN colaboradores c ON c.id = p.colaborador_id
CROSS JOIN LATERAL (
  SELECT COALESCE(
    (SELECT hr.salario_novo FROM historico_reajustes hr
       WHERE hr.colaborador_id = p.colaborador_id AND hr.created_at <= p.created_at
       ORDER BY hr.created_at DESC LIMIT 1),
    (SELECT hr.salario_anterior FROM historico_reajustes hr
       WHERE hr.colaborador_id = p.colaborador_id
       ORDER BY hr.created_at ASC LIMIT 1),
    c.salario
  ) AS salario_correto
) sc
WHERE p.tipo_pedido <> 'reembolso_km'
ORDER BY p.created_at;

-- Veja quantos registros e qual a diferença total antes de aplicar:
-- SELECT COUNT(*) FILTER (WHERE p.valor_total <> ROUND((...)::numeric,2)) AS registros_divergentes ...
-- (use a mesma consulta acima e compare valor_total_atual x valor_total_correto)

-- =====================================================================
-- PASSO 2: APLICAR A CORREÇÃO (rode somente após validar o PASSO 1)
-- =====================================================================
UPDATE pedidos_pagamento p
SET
  salario_base = sc.salario_correto,
  horas_extras = ROUND((
    (COALESCE(p.horas_extras_50, 0) * (sc.salario_correto / 220) * 1.5)
    + (COALESCE(p.horas_extras_100, 0) * (sc.salario_correto / 220) * 2)
  )::numeric, 2),
  valor_total = ROUND((
    sc.salario_correto
    + (COALESCE(p.horas_extras_50, 0) * (sc.salario_correto / 220) * 1.5)
    + (COALESCE(p.horas_extras_100, 0) * (sc.salario_correto / 220) * 2)
    + COALESCE(p.valor_plantao, 0)
    + COALESCE(p.comissao, 0)
    - COALESCE(p.valor_desconto, 0)
  )::numeric, 2)
FROM (
  SELECT
    p2.id,
    COALESCE(
      (SELECT hr.salario_novo FROM historico_reajustes hr
         WHERE hr.colaborador_id = p2.colaborador_id AND hr.created_at <= p2.created_at
         ORDER BY hr.created_at DESC LIMIT 1),
      (SELECT hr.salario_anterior FROM historico_reajustes hr
         WHERE hr.colaborador_id = p2.colaborador_id
         ORDER BY hr.created_at ASC LIMIT 1),
      c2.salario
    ) AS salario_correto
  FROM pedidos_pagamento p2
  JOIN colaboradores c2 ON c2.id = p2.colaborador_id
  WHERE p2.tipo_pedido <> 'reembolso_km'
) sc
WHERE p.id = sc.id;
