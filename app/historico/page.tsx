import { listarPedidosPorSupervisor, listarPedidosPorGerente, listarPedidosParaCorrecao } from "@/app/actions/pedidos"
import { getSession } from "@/lib/session"
import { HistoricoList } from "@/components/historico-list"
import { redirect } from "next/navigation"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { CorrecaoList } from "@/components/correcao-list"
import { PageHeader } from "@/components/ui/page-header"

export default async function HistoricoPage() {
  const session = await getSession()

  if (!session) {
    redirect("/login")
  }

  if (session.tipoAcesso !== "Supervisor" && session.tipoAcesso !== "Adm" && session.tipoAcesso !== "Gerente") {
    redirect("/")
  }

  // Buscar pedidos dependendo do tipo de acesso
  let pedidos: any[] = []
  if (session.tipoAcesso === "Gerente") {
    pedidos = await listarPedidosPorGerente(session.colaboradorId)
  } else {
    pedidos = await listarPedidosPorSupervisor(session.colaboradorId)
  }

  const pedidosCorrecao = await listarPedidosParaCorrecao()

  return (
    <div className="container mx-auto px-4 lg:px-6 py-8">
      <PageHeader title="Meus pedidos" description="Acompanhe o status de todos os pedidos de pagamento que você criou" />

      <Tabs defaultValue="historico" className="w-full">
        <TabsList className="h-auto w-full justify-start rounded-none bg-transparent p-0 border-b border-border gap-6">
          <TabsTrigger
            value="historico"
            className="rounded-none border-b-2 border-transparent px-0 pb-3 text-sm font-medium text-text-tertiary shadow-none data-[state=active]:border-primary data-[state=active]:text-foreground data-[state=active]:shadow-none data-[state=active]:bg-transparent"
          >
            Histórico
          </TabsTrigger>
          <TabsTrigger
            value="correcoes"
            className="rounded-none border-b-2 border-transparent px-0 pb-3 text-sm font-medium text-text-tertiary shadow-none data-[state=active]:border-primary data-[state=active]:text-foreground data-[state=active]:shadow-none data-[state=active]:bg-transparent"
          >
            Correções pendentes
            {pedidosCorrecao.length > 0 && (
              <span className="ml-1.5 text-xs tabular-nums text-text-tertiary">{pedidosCorrecao.length}</span>
            )}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="historico" className="mt-5">
          <HistoricoList pedidos={pedidos} />
        </TabsContent>

        <TabsContent value="correcoes" className="mt-5">
          <CorrecaoList pedidos={pedidosCorrecao} />
        </TabsContent>
      </Tabs>
    </div>
  )
}
