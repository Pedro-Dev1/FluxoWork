import { type NextRequest, NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase-server"
import { verificarAutenticacaoWebhook } from "@/lib/pagarme"
import { registrarAuditoria } from "@/lib/auditoria"

export const dynamic = "force-dynamic"

const EVENTOS_PAGOS = ["order.paid", "charge.paid"]
const EVENTOS_FALHA = ["order.payment_failed", "charge.payment_failed"]
const EVENTOS_CANCELADOS = ["order.canceled", "charge.canceled"]

// Não passa por requireAuth() — é a Pagar.me chamando de fora. A única
// verificação de identidade é o Basic Auth cadastrado no toggle "Habilitar
// autenticação" ao criar o webhook no painel deles (mesmas credenciais em
// PAGARME_WEBHOOK_USER/PAGARME_WEBHOOK_PASS).
export async function POST(request: NextRequest) {
  if (!verificarAutenticacaoWebhook(request.headers.get("authorization"))) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 })
  }

  let payload: { type?: string; data?: { id?: string; order_id?: string } }
  try {
    payload = await request.json()
  } catch {
    return NextResponse.json({ error: "Payload inválido" }, { status: 400 })
  }

  const tipo = payload?.type
  const dado = payload?.data

  if (!tipo || !dado?.id) {
    return NextResponse.json({ ok: true })
  }

  let novoStatus: "paga" | "falhou" | "cancelada" | null = null
  if (EVENTOS_PAGOS.includes(tipo)) novoStatus = "paga"
  else if (EVENTOS_FALHA.includes(tipo)) novoStatus = "falhou"
  else if (EVENTOS_CANCELADOS.includes(tipo)) novoStatus = "cancelada"

  // Evento que não altera status de pagamento (order.created, order.updated
  // etc.) — a Pagar.me reenvia em caso de erro HTTP, então sempre 200 aqui,
  // mesmo para evento não tratado.
  if (!novoStatus) {
    return NextResponse.json({ ok: true })
  }

  const ordemId = tipo.startsWith("order.") ? dado.id : dado.order_id
  const cobrancaId = tipo.startsWith("charge.") ? dado.id : undefined

  const filtros = [ordemId ? `pagarme_order_id.eq.${ordemId}` : null, cobrancaId ? `pagarme_charge_id.eq.${cobrancaId}` : null]
    .filter(Boolean)
    .join(",")

  const supabase = await createAdminClient()

  const { data: fatura } = await supabase
    .from("faturas_plataforma")
    .select("id, tenant_id")
    .or(filtros)
    .maybeSingle()

  if (!fatura) {
    console.error(`[v0] Webhook Pagar.me: fatura não encontrada (evento ${tipo}, order=${ordemId}, charge=${cobrancaId})`)
    return NextResponse.json({ ok: true })
  }

  const atualizacao: Record<string, unknown> = { status: novoStatus, updated_at: new Date().toISOString() }
  if (novoStatus === "paga") atualizacao.data_pagamento = new Date().toISOString()

  await supabase.from("faturas_plataforma").update(atualizacao).eq("id", fatura.id)

  const acao =
    novoStatus === "paga" ? "fatura_plataforma_paga" : novoStatus === "falhou" ? "fatura_plataforma_falhou" : "fatura_plataforma_cancelada"

  await registrarAuditoria({
    colaboradorId: null,
    tenantId: fatura.tenant_id,
    acao,
    tabela: "faturas_plataforma",
    registroId: fatura.id,
    detalhes: { evento: tipo },
  })

  return NextResponse.json({ ok: true })
}
