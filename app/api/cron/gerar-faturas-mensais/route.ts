import { type NextRequest, NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase-server"
import { gerarFaturaParaTenant } from "@/lib/faturamento"

export const dynamic = "force-dynamic"

// Vercel Cron não tem granularidade "dia X do mês" — roda diário (ver
// vercel.json). A fatura é gerada 3 dias antes do dia 1 (horário de São
// Paulo), pra já estar pronta quando o mês cobrado começa — não no próprio
// dia 1. Nos outros dias do mês esta rota só confirma que hoje não é o dia e
// não faz nada.
function obterDataSaoPaulo(): { dia: number; mes: number; ano: number } {
  const partes = new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Sao_Paulo",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(new Date())

  return {
    ano: Number(partes.find((p) => p.type === "year")?.value),
    mes: Number(partes.find((p) => p.type === "month")?.value),
    dia: Number(partes.find((p) => p.type === "day")?.value),
  }
}

// "3 dias antes do dia 1" muda de dia conforme o mês tem 28, 29, 30 ou 31
// dias — em vez de calcular isso, soma 3 dias em UTC (Date normaliza o
// overflow de mês/ano sozinho) e verifica se o resultado caiu num dia 1. Se
// caiu, esse resultado já é o mês de referência da fatura (o mês que está
// prestes a começar), não o mês atual.
function calcularReferenciaSeForDiaDeFaturar(dia: number, mes: number, ano: number): { ano: number; mes: number } | null {
  const maisTresDias = new Date(Date.UTC(ano, mes - 1, dia + 3))
  if (maisTresDias.getUTCDate() !== 1) return null
  return { ano: maisTresDias.getUTCFullYear(), mes: maisTresDias.getUTCMonth() + 1 }
}

export async function GET(request: NextRequest) {
  if (!process.env.CRON_SECRET) {
    console.error("[v0] CRON_SECRET não configurada — cron de faturamento bloqueado.")
    return NextResponse.json({ error: "Cron não configurado" }, { status: 500 })
  }

  const authHeader = request.headers.get("authorization")
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 })
  }

  const { dia, mes, ano } = obterDataSaoPaulo()
  const referencia = calcularReferenciaSeForDiaDeFaturar(dia, mes, ano)

  if (!referencia) {
    return NextResponse.json({
      processadas: 0,
      sucesso: 0,
      falha: 0,
      detalhes: [],
      info: "Hoje não é 3 dias antes do dia 1.",
    })
  }

  const primeiroDiaReferencia = `${referencia.ano}-${String(referencia.mes).padStart(2, "0")}-01`

  const supabase = await createAdminClient()
  const { data: tenants, error } = await supabase
    .from("tenants")
    .select("id, nome")
    .eq("ativo", true)
    .not("valor_por_usuario_ativo", "is", null)
    .not("data_inicio_cobranca", "is", null)
    .lte("data_inicio_cobranca", primeiroDiaReferencia)

  if (error) {
    console.error("[v0] Erro ao buscar carteiras pra faturar:", error)
    return NextResponse.json({ error: "Erro ao buscar carteiras" }, { status: 500 })
  }

  let sucesso = 0
  let falha = 0
  const detalhes: { tenant: string; ok: boolean; erro?: string }[] = []

  for (const tenant of tenants || []) {
    const resultado = await gerarFaturaParaTenant(tenant.id, referencia.ano, referencia.mes)
    if (resultado.success) {
      sucesso++
      detalhes.push({ tenant: tenant.nome, ok: true })
    } else {
      falha++
      detalhes.push({ tenant: tenant.nome, ok: false, erro: resultado.error })
    }
  }

  return NextResponse.json({ processadas: (tenants || []).length, sucesso, falha, detalhes })
}
