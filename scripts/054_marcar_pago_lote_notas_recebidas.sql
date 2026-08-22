-- Marca como 'pago' em lote todos os pedidos que hoje aparecem na aba
-- Financeiro > "Notas Recebidas" (o mesmo conjunto que listarPedidosComNota()
-- retorna: têm nota fiscal anexada, OU são reembolso KM — que não usa nota).
-- Uso: esses pagamentos já foram feitos de fato fora do sistema, e o
-- FluxoPay só precisa passar a refletir isso.
--
-- NÃO inclui os pedidos "Sem Nota Fiscal" — esses ainda dependem do
-- colaborador anexar a nota antes de virar pagamento.
--
-- Também marca aprovado_financeiro/data_aprovacao_financeiro quando ainda
-- estavam em branco, pra não deixar o registro inconsistente (um pedido
-- "pago" sem nunca ter sido aprovado pelo financeiro no sistema).

-- PASSO 1: PREVIEW — confira antes de aplicar
SELECT
  p.id,
  c.nome_completo,
  p.tipo_pedido,
  p.status AS status_atual,
  p.valor_total,
  p.created_at
FROM pedidos_pagamento p
JOIN colaboradores c ON c.id = p.colaborador_id
WHERE p.status IN ('pendente_financeiro', 'aprovado', 'nota_recebida')
  AND (
    p.tipo_pedido = 'reembolso_km'
    OR p.nota_fiscal_url IS NOT NULL
    OR EXISTS (SELECT 1 FROM notas_fiscais nf WHERE nf.pedido_id = p.id)
  )
ORDER BY p.created_at;

-- Conferir quantidade e soma antes de aplicar:
SELECT COUNT(*) AS total_pedidos, SUM(p.valor_total) AS soma_valor_total
FROM pedidos_pagamento p
WHERE p.status IN ('pendente_financeiro', 'aprovado', 'nota_recebida')
  AND (
    p.tipo_pedido = 'reembolso_km'
    OR p.nota_fiscal_url IS NOT NULL
    OR EXISTS (SELECT 1 FROM notas_fiscais nf WHERE nf.pedido_id = p.id)
  );

-- =====================================================================
-- PASSO 2: APLICAR (rode somente depois de validar o preview acima)
-- =====================================================================
UPDATE pedidos_pagamento p
SET
  status = 'pago',
  aprovado_financeiro = COALESCE(p.aprovado_financeiro, true),
  data_aprovacao_financeiro = COALESCE(p.data_aprovacao_financeiro, NOW())
WHERE p.status IN ('pendente_financeiro', 'aprovado', 'nota_recebida')
  AND (
    p.tipo_pedido = 'reembolso_km'
    OR p.nota_fiscal_url IS NOT NULL
    OR EXISTS (SELECT 1 FROM notas_fiscais nf WHERE nf.pedido_id = p.id)
  );
