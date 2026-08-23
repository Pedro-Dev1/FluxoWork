"use server"

import { getSession } from "@/lib/session"
import {
  listarPedidosPendentes,
  listarPedidosSemNota,
  listarPedidosComNota,
  listarSolicitacoesProrrogacao,
  listarPedidosComNotaPendente,
  listarPedidosParaCorrecao,
} from "@/app/actions/pedidos"

export async function contarPendencias() {
  const session = await getSession()
  if (!session) return { aprovacoes: 0, painelFinanceiro: 0, correcoes: 0, acompanhamento: 0 }

  const tipoAcesso = session.tipoAcesso

  let aprovacoes = 0
  let painelFinanceiro = 0
  let correcoes = 0
  let acompanhamento = 0

  try {
    // Reaproveita as mesmas funções que alimentam as telas — o contador
    // nunca pode divergir do que a lista de fato mostra.
    if (["Gerente", "Financeiro", "Adm"].includes(tipoAcesso)) {
      const pendentes = await listarPedidosPendentes()
      aprovacoes = pendentes?.length || 0
    }

    if (["Financeiro", "Adm"].includes(tipoAcesso)) {
      const [semNota, comNota, prorrogacoes] = await Promise.all([
        listarPedidosSemNota(),
        listarPedidosComNota(),
        listarSolicitacoesProrrogacao(),
      ])
      const comNotaPendentePagamento = (comNota || []).filter((p: any) => p.status !== "pago").length
      painelFinanceiro = (semNota?.length || 0) + comNotaPendentePagamento + (prorrogacoes?.length || 0)
    }

    if (tipoAcesso === "Gerente") {
      const paraCorrecao = await listarPedidosParaCorrecao()
      correcoes = paraCorrecao?.length || 0
    }

    if (["Supervisor", "Gerente", "Financeiro", "Adm"].includes(tipoAcesso)) {
      const comNotaPendente = await listarPedidosComNotaPendente()
      acompanhamento = comNotaPendente?.length || 0
    }

    return { aprovacoes, painelFinanceiro, correcoes, acompanhamento }
  } catch (error) {
    console.error("[v0] Erro ao contar pendências:", error)
    return { aprovacoes: 0, painelFinanceiro: 0, correcoes: 0, acompanhamento: 0 }
  }
}
