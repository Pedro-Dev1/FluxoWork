import { type NextRequest, NextResponse } from "next/server"
import { atualizarFaturamentoTenant, listarCarteirasFaturamento, type DadosFaturamento } from "@/lib/faturamento"

export const dynamic = "force-dynamic"

// API do Super Admin pra configurar o faturamento de uma carteira (CNPJ,
// endereço, valor por usuário, data de início da cobrança) sem passar pela
// tela — pensada pra automação/scripts, não pra uso de dentro do navegador
// (por isso Bearer API key, não o cookie de sessão).
function autorizado(request: NextRequest): boolean {
  const chave = process.env.FATURAMENTO_API_KEY
  if (!chave) {
    console.error("[v0] FATURAMENTO_API_KEY não configurada — API de faturamento bloqueada.")
    return false
  }

  return request.headers.get("authorization") === `Bearer ${chave}`
}

export async function GET(request: NextRequest) {
  if (!autorizado(request)) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 })
  }

  try {
    const carteiras = await listarCarteirasFaturamento()
    return NextResponse.json({ carteiras })
  } catch (error) {
    console.error("[v0] Erro ao listar carteiras via API de faturamento:", error)
    return NextResponse.json({ error: "Erro ao listar carteiras" }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest) {
  if (!autorizado(request)) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 })
  }

  let body: { tenantId?: string; slug?: string } & Partial<DadosFaturamento>
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: "Payload inválido" }, { status: 400 })
  }

  const { tenantId, slug, ...dados } = body

  if (!tenantId && !slug) {
    return NextResponse.json({ error: "Informe tenantId ou slug da carteira" }, { status: 400 })
  }

  if (
    dados.valorPorUsuarioAtivo == null ||
    !dados.dataInicioCobranca ||
    !dados.documento ||
    !dados.enderecoLogradouro ||
    !dados.enderecoCep ||
    !dados.enderecoCidade ||
    !dados.enderecoUf
  ) {
    return NextResponse.json(
      {
        error:
          "Campos obrigatórios: valorPorUsuarioAtivo, dataInicioCobranca, documento, enderecoLogradouro, enderecoCep, enderecoCidade, enderecoUf",
      },
      { status: 400 },
    )
  }

  const resultado = await atualizarFaturamentoTenant({ tenantId, slug }, dados as DadosFaturamento, null)

  if (!resultado.success) {
    const status = resultado.error === "Carteira não encontrada" ? 404 : 400
    return NextResponse.json({ error: resultado.error }, { status })
  }

  return NextResponse.json({ tenantId: resultado.tenantId, nome: resultado.nome })
}
