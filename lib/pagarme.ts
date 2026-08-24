// Sem "use server" de propósito, mesmo motivo de lib/email.ts e
// lib/notificacoes.ts: as funções aqui não validam permissão sozinhas — só
// código já autorizado (dentro de app/actions/faturamento.ts, depois de
// requireRole([])) deve importar daqui. Chave secreta lida sob demanda
// dentro da função, nunca no carregamento do módulo, pelo mesmo motivo do
// getResendClient() em lib/email.ts: uma env var ausente não pode derrubar o
// build nem qualquer rota que importe este arquivo.

const PAGARME_API_BASE = "https://api.pagar.me/core/v5"

function getPagarmeSecretKey(): string | null {
  if (!process.env.PAGARME_SECRET_KEY) {
    console.error("[v0] PAGARME_SECRET_KEY não configurada — boleto não emitido.")
    return null
  }
  return process.env.PAGARME_SECRET_KEY
}

export async function criarPedidoBoleto(params: {
  customerName: string
  customerDocument: string
  customerEmail: string
  customerPhone?: string | null
  customerAddress: {
    line_1: string
    line_2?: string
    zip_code: string
    city: string
    state: string
  }
  valorCentavos: number
  descricaoItem: string
  dataVencimento: string // YYYY-MM-DD
  instructions: string
}): Promise<
  | {
      success: true
      orderId: string
      chargeId: string
      boletoUrl: string
      boletoLinha: string
      boletoCodigoBarras: string
    }
  | { success: false; error: string }
> {
  const secretKey = getPagarmeSecretKey()
  if (!secretKey) {
    return { success: false, error: "Integração com a Pagar.me não configurada (PAGARME_SECRET_KEY ausente)." }
  }

  // Opcional: contas PSP (como a desta integração) não escolhem banco
  // emissor — a Pagar.me define isso pelas prioridades pré-configuradas na
  // loja quando o campo não é enviado. Só existe pra permitir direcionar
  // pra um banco específico se um dia for preciso; sem a env var, o campo
  // simplesmente não entra no corpo da requisição.
  const bank = process.env.PAGARME_BOLETO_BANK

  const documento = params.customerDocument.replace(/\D/g, "")

  const body: Record<string, unknown> = {
    items: [
      {
        amount: params.valorCentavos,
        description: params.descricaoItem,
        quantity: 1,
      },
    ],
    customer: {
      name: params.customerName,
      type: "company",
      document: documento,
      document_type: "CNPJ",
      email: params.customerEmail,
      // Obrigatório pra boleto com registro (padrão exigido pelos bancos) —
      // sem isso, o pedido é criado mas a Pagar.me não gera a cobrança de
      // boleto, silenciosamente.
      address: {
        line_1: params.customerAddress.line_1,
        ...(params.customerAddress.line_2 ? { line_2: params.customerAddress.line_2 } : {}),
        zip_code: params.customerAddress.zip_code.replace(/\D/g, ""),
        city: params.customerAddress.city,
        state: params.customerAddress.state.toUpperCase(),
        country: "BR",
      },
      ...(params.customerPhone
        ? {
            phones: {
              mobile_phone: {
                country_code: "55",
                area_code: params.customerPhone.replace(/\D/g, "").slice(0, 2),
                number: params.customerPhone.replace(/\D/g, "").slice(2),
              },
            },
          }
        : {}),
    },
    payments: [
      {
        payment_method: "boleto",
        boleto: {
          ...(bank ? { bank } : {}),
          instructions: params.instructions,
          due_at: params.dataVencimento,
        },
      },
    ],
  }

  try {
    const response = await fetch(`${PAGARME_API_BASE}/orders`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Basic ${Buffer.from(`${secretKey}:`).toString("base64")}`,
      },
      body: JSON.stringify(body),
    })

    const data = await response.json()

    if (!response.ok) {
      const mensagem = data?.message || data?.errors?.[0]?.message || `Erro ${response.status} na Pagar.me`
      console.error("[v0] Erro ao criar pedido na Pagar.me:", mensagem, data)
      return { success: false, error: mensagem }
    }

    const charge = data.charges?.[0]
    const boleto = charge?.last_transaction

    if (!charge || !boleto?.url) {
      console.error("[v0] Resposta da Pagar.me sem dados de boleto:", data)
      return { success: false, error: "Pedido criado, mas a Pagar.me não retornou os dados do boleto." }
    }

    return {
      success: true,
      orderId: data.id,
      chargeId: charge.id,
      boletoUrl: boleto.url,
      boletoLinha: boleto.line,
      boletoCodigoBarras: boleto.barcode,
    }
  } catch (error) {
    console.error("[v0] Erro inesperado ao chamar a Pagar.me:", error)
    return { success: false, error: error instanceof Error ? error.message : "Erro desconhecido ao emitir boleto." }
  }
}

// Cancela uma cobrança ainda não paga (boleto emitido, aguardando
// pagamento). Não deve ser usada pra desfazer uma cobrança já paga — isso é
// estorno, exige dados bancários e é tratado como um fluxo separado, fora do
// escopo de um clique único.
export async function cancelarCobranca(chargeId: string): Promise<{ success: true } | { success: false; error: string }> {
  const secretKey = getPagarmeSecretKey()
  if (!secretKey) {
    return { success: false, error: "Integração com a Pagar.me não configurada (PAGARME_SECRET_KEY ausente)." }
  }

  try {
    const response = await fetch(`${PAGARME_API_BASE}/charges/${chargeId}`, {
      method: "DELETE",
      headers: {
        Authorization: `Basic ${Buffer.from(`${secretKey}:`).toString("base64")}`,
      },
    })

    const data = await response.json().catch(() => null)

    if (!response.ok) {
      const mensagem = data?.message || data?.errors?.[0]?.message || `Erro ${response.status} na Pagar.me`
      console.error("[v0] Erro ao cancelar cobrança na Pagar.me:", mensagem, data)
      return { success: false, error: mensagem }
    }

    return { success: true }
  } catch (error) {
    console.error("[v0] Erro inesperado ao cancelar cobrança na Pagar.me:", error)
    return { success: false, error: error instanceof Error ? error.message : "Erro desconhecido ao cancelar cobrança." }
  }
}

// Valida o Basic Auth que a Pagar.me envia de volta em cada chamada de
// webhook — mesmas credenciais cadastradas no toggle "Habilitar autenticação"
// ao criar o webhook no painel deles. Comparação simples (não HMAC) porque é
// exatamente o mecanismo que a Pagar.me oferece pra isso.
export function verificarAutenticacaoWebhook(authorizationHeader: string | null): boolean {
  const usuario = process.env.PAGARME_WEBHOOK_USER
  const senha = process.env.PAGARME_WEBHOOK_PASS

  if (!usuario || !senha) {
    console.error("[v0] PAGARME_WEBHOOK_USER/PAGARME_WEBHOOK_PASS não configuradas — webhook rejeitado.")
    return false
  }

  if (!authorizationHeader?.startsWith("Basic ")) return false

  const esperado = Buffer.from(`${usuario}:${senha}`).toString("base64")
  const recebido = authorizationHeader.slice("Basic ".length)
  return recebido === esperado
}
