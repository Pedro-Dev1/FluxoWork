// Sem "use server" de propósito, mesmo motivo de lib/email.ts e
// lib/notificacoes.ts: as funções aqui não validam permissão sozinhas — só
// código já autorizado (dentro de app/actions/faturamento.ts, depois de
// requireRole([])) deve importar daqui. Chave secreta lida sob demanda
// dentro da função, nunca no carregamento do módulo, pelo mesmo motivo do
// getResendClient() em lib/email.ts: uma env var ausente não pode derrubar o
// build nem qualquer rota que importe este arquivo.

const PAGARME_API_URL = "https://api.pagar.me/core/v5/orders"

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

  const bank = process.env.PAGARME_BOLETO_BANK
  if (!bank) {
    console.error("[v0] PAGARME_BOLETO_BANK não configurada — boleto não emitido.")
    return { success: false, error: "Banco emissor do boleto não configurado (PAGARME_BOLETO_BANK ausente)." }
  }

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
          bank,
          instructions: params.instructions,
          due_at: params.dataVencimento,
        },
      },
    ],
  }

  try {
    const response = await fetch(PAGARME_API_URL, {
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
