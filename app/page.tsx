import {
  listarPedidosComFiltros,
  listarPedidosPorSupervisor,
  listarPedidosPorGerente,
  listarPedidosComNota,
  listarPedidosSemNota,
  listarSolicitacoesProrrogacao,
  listarPedidosParaCorrecao,
} from "./actions/pedidos"
import { listarEquipes, listarEquipesPorGerente } from "./actions/equipes"
import { getSession } from "@/lib/session"
import { redirect } from "next/navigation"
import { DashboardClient } from "@/components/dashboard-client"
import type { AcaoAgoraItem } from "@/components/dashboard-resumo"
import { SystemControl } from "@/components/system-control"

export default async function Home() {
  const session = await getSession()

  if (session?.tipoAcesso === "Colaborador") {
    redirect("/meus-pagamentos")
  }

  let pedidos: any[] = []
  let equipes: Array<{ id: string; nome: string }> = []

  try {
    if (session?.tipoAcesso === "Supervisor") {
      pedidos = await listarPedidosPorSupervisor(session.colaboradorId)
    } else if (session?.tipoAcesso === "Gerente") {
      pedidos = await listarPedidosPorGerente(session.colaboradorId, {})
    } else {
      pedidos = await listarPedidosComFiltros({})
    }
  } catch (error) {
    console.error("[v0] Erro ao listar pedidos:", error)
  }

  try {
    if (session?.tipoAcesso === "Gerente") {
      equipes = (await listarEquipesPorGerente(session.colaboradorId)).map((e) => ({ id: e.id, nome: e.nome }))
    } else {
      equipes = (await listarEquipes()).map((e) => ({ id: e.id, nome: e.nome }))
    }
  } catch (error) {
    console.error("[v0] Erro ao listar equipes:", error)
  }

  const isAdmin = session?.tipoAcesso === "Adm"

  // "Requer ação agora": o que precisa da decisão de quem está logado, hoje.
  // Muda de fonte conforme o papel — cada um age sobre uma fila diferente.
  let acaoAgoraItens: AcaoAgoraItem[] = []
  let acaoAgoraCandidatos: any[] = []

  try {
    if (session?.tipoAcesso === "Adm" || session?.tipoAcesso === "Financeiro") {
      const [comNota, semNota, prorrogacoes] = await Promise.all([
        listarPedidosComNota(),
        listarPedidosSemNota(),
        listarSolicitacoesProrrogacao(),
      ])
      acaoAgoraItens = [
        { label: "notas recebidas p/ pagar", count: comNota.length, href: "/financeiro?tab=pagar" },
        { label: "sem nota fiscal", count: semNota.length, href: "/financeiro?tab=sem-nota" },
        { label: "prorrogações", count: prorrogacoes.length, href: "/financeiro?tab=prorrogacoes" },
      ]
      acaoAgoraCandidatos = [...comNota, ...semNota]
    } else if (session?.tipoAcesso === "Gerente") {
      const pendentes = pedidos.filter((p) => p.status === "pendente_gerente")
      acaoAgoraItens = [{ label: "aguardando sua aprovação", count: pendentes.length, href: "/aprovacoes" }]
      acaoAgoraCandidatos = pendentes
    } else if (session?.tipoAcesso === "Supervisor") {
      const correcao = await listarPedidosParaCorrecao()
      acaoAgoraItens = [{ label: "em correção — precisam ser reenviados", count: correcao.length, href: "/pedidos" }]
      acaoAgoraCandidatos = correcao
    }
  } catch (error) {
    console.error("[v0] Erro ao montar resumo de ação agora:", error)
  }

  const maisAntigo = acaoAgoraCandidatos.reduce<any>((oldest, atual) => {
    if (!oldest) return atual
    return new Date(atual.created_at) < new Date(oldest.created_at) ? atual : oldest
  }, null)

  return (
    <div className="container mx-auto py-8 px-4 lg:px-6 max-w-7xl">
      <div className="mb-8">
        <h1 className="text-2xl font-semibold mb-1 text-foreground">Dashboard</h1>
        <p className="text-sm text-muted-foreground">Visão geral de pagamentos e pedidos</p>
      </div>

      <DashboardClient
        pedidos={pedidos}
        equipes={equipes}
        tipoAcesso={session?.tipoAcesso || ""}
        acaoAgoraItens={acaoAgoraItens}
        acaoAgoraMaisAntigo={
          maisAntigo
            ? {
                nome: maisAntigo.colaborador?.nome_completo || maisAntigo.colaboradores?.nome_completo || "N/A",
                tipo: maisAntigo.tipo_pedido === "reembolso_km" ? "Reembolso KM" : "Pedido Completo",
                createdAt: maisAntigo.created_at,
              }
            : null
        }
      />

      {isAdmin && (
        <div className="mt-6">
          <SystemControl />
        </div>
      )}
    </div>
  )
}
