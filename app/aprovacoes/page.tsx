import { listarPedidosPendentes } from "@/app/actions/pedidos"
import { getUsuarioLogado } from "@/lib/auth-utils"
import { AprovacoesList } from "@/components/aprovacoes-list"
import { PageHeader } from "@/components/ui/page-header"
import { redirect } from "next/navigation"

export default async function AprovacoesPage() {
  const usuario = await getUsuarioLogado()

  if (!usuario) {
    redirect("/login")
  }

  if (!["Gerente", "Financeiro", "Adm"].includes(usuario.tipo_acesso)) {
    redirect("/")
  }

  let pedidos = []
  try {
    pedidos = await listarPedidosPendentes()
  } catch (error) {
    console.error("[v0] Erro ao carregar pedidos:", error)
  }

  return (
    <div className="container mx-auto px-4 lg:px-6 py-8 max-w-7xl">
      <PageHeader
        title="Aprovações pendentes"
        description={
          usuario.tipo_acesso === "Gerente"
            ? "Aprove, recuse ou solicite correções nos pedidos de pagamento"
            : "Aprove ou recuse os pedidos já aprovados pelo gerente"
        }
      />

      <AprovacoesList pedidos={pedidos} tipoAcesso={usuario.tipo_acesso} />
    </div>
  )
}
