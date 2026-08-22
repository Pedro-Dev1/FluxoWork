import { listarPedidosSemNota, listarPedidosComNota, listarSolicitacoesProrrogacao } from "@/app/actions/pedidos"
import { getUsuarioLogado } from "@/lib/auth-utils"
import { PedidosSemNotaList } from "@/components/pedidos-sem-nota-list"
import { MarcarPagoList } from "@/components/marcar-pago-list"
import { SolicitacoesProrrogacaoList } from "@/components/solicitacoes-prorrogacao-list"
import { redirect } from "next/navigation"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

export default async function FinanceiroPage({
  searchParams,
}: {
  searchParams: Promise<{
    tab?: string
    dataInicio?: string
    dataFim?: string
    colaboradorNome?: string
    equipeId?: string
  }>
}) {
  const usuario = await getUsuarioLogado()

  if (!usuario) {
    redirect("/login")
  }

  if (!["Financeiro", "Adm"].includes(usuario.tipo_acesso)) {
    redirect("/")
  }

  const params = await searchParams

  const filtros = {
    dataInicio: params.dataInicio,
    dataFim: params.dataFim,
    colaboradorNome: params.colaboradorNome,
    equipeId: params.equipeId,
  }

  let pedidosSemNota: any[] = []
  let pedidosComNota: any[] = []
  let solicitacoes: any[] = []

  try {
    const [semNota, comNota, prorro] = await Promise.allSettled([
      listarPedidosSemNota(filtros),
      listarPedidosComNota(filtros),
      listarSolicitacoesProrrogacao(),
    ])
    pedidosSemNota = semNota.status === "fulfilled" ? semNota.value : []
    pedidosComNota = comNota.status === "fulfilled" ? comNota.value : []
    solicitacoes = prorro.status === "fulfilled" ? prorro.value : []
  } catch (error) {
    console.error("[v0] Erro ao carregar dados financeiro:", error)
  }

  const defaultTab = params.tab || "pagar"

  return (
    <div className="container mx-auto px-4 lg:px-6 py-8 max-w-7xl">
      <div className="mb-8">
        <h1 className="text-2xl font-semibold mb-1 text-foreground">Painel Financeiro</h1>
        <p className="text-sm text-muted-foreground">Gerencie pagamentos, notas fiscais e prorrogações</p>
      </div>

      <Tabs defaultValue={defaultTab} className="w-full">
        <TabsList className="h-auto w-full justify-start rounded-none bg-transparent p-0 border-b border-border gap-6">
          <TabsTrigger
            value="pagar"
            className="rounded-none border-b-2 border-transparent px-0 pb-3 text-sm font-medium text-text-tertiary shadow-none data-[state=active]:border-primary data-[state=active]:text-foreground data-[state=active]:shadow-none data-[state=active]:bg-transparent"
          >
            Notas recebidas
            {pedidosComNota.length > 0 && (
              <span className="ml-1.5 text-xs tabular-nums text-text-tertiary">{pedidosComNota.length}</span>
            )}
          </TabsTrigger>
          <TabsTrigger
            value="sem-nota"
            className="rounded-none border-b-2 border-transparent px-0 pb-3 text-sm font-medium text-text-tertiary shadow-none data-[state=active]:border-primary data-[state=active]:text-foreground data-[state=active]:shadow-none data-[state=active]:bg-transparent"
          >
            Sem nota
            {pedidosSemNota.length > 0 && (
              <span className="ml-1.5 text-xs tabular-nums text-text-tertiary">{pedidosSemNota.length}</span>
            )}
          </TabsTrigger>
          <TabsTrigger
            value="prorrogacoes"
            className="rounded-none border-b-2 border-transparent px-0 pb-3 text-sm font-medium text-text-tertiary shadow-none data-[state=active]:border-primary data-[state=active]:text-foreground data-[state=active]:shadow-none data-[state=active]:bg-transparent"
          >
            Prorrogações
            {solicitacoes.length > 0 && (
              <span className="ml-1.5 text-xs tabular-nums text-text-tertiary">{solicitacoes.length}</span>
            )}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="pagar" className="mt-5">
          <MarcarPagoList pedidos={pedidosComNota} />
        </TabsContent>
        <TabsContent value="sem-nota" className="mt-5">
          <PedidosSemNotaList pedidos={pedidosSemNota} />
        </TabsContent>
        <TabsContent value="prorrogacoes" className="mt-5">
          <SolicitacoesProrrogacaoList solicitacoes={solicitacoes} />
        </TabsContent>
      </Tabs>
    </div>
  )
}
