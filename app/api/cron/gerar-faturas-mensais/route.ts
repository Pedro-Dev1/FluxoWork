import { type NextRequest, NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase-server"
import { gerarFaturaParaTenant } from "@/lib/faturamento"

export const dynamic = "force-dynamic"

// Vercel Cron não tem granularidade "dia X do mês" — roda diário (ver
// vercel.json). Faturamento cai sempre no dia 1 (horário de São Paulo), então
// nos outros 27~30 dias do mês esta rota só confirma que hoje não é o dia e
// não faz nada.
function obterDataSaoPaulo(): { dia: number; mes: number; ano: number; iso: string } {
  const partes = new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Sao_Paulo",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(new Date())

  const ano = Number(partes.find((p) => p.type === "year")?.value)
  const mes = Number(partes.find((p) => p.type === "month")?.value)
  const dia = Number(partes.find((p) => p.type === "day")?.value)

  return { ano, mes, dia, iso: `${ano}-${String(mes).padStart(2, "0")}-${String(dia).padStart(2, "0")}` }
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

  const { dia, mes, ano, iso } = obterDataSaoPaulo()

  if (dia !== 1) {
    return NextResponse.json({ processadas: 0, sucesso: 0, falha: 0, detalhes: [], info: "Hoje não é dia 1." })
  }

  const supabase = await createAdminClient()
  const { data: tenants, error } = await supabase
    .from("tenants")
    .select("id, nome")
    .eq("ativo", true)
    .not("valor_por_usuario_ativo", "is", null)
    .not("data_inicio_cobranca", "is", null)
    .lte("data_inicio_cobranca", iso)

  if (error) {
    console.error("[v0] Erro ao buscar carteiras pra faturar:", error)
    return NextResponse.json({ error: "Erro ao buscar carteiras" }, { status: 500 })
  }

  let sucesso = 0
  let falha = 0
  const detalhes: { tenant: string; ok: boolean; erro?: string }[] = []

  for (const tenant of tenants || []) {
    const resultado = await gerarFaturaParaTenant(tenant.id, ano, mes)
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
