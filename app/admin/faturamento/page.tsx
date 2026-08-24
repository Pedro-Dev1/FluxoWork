import { listarConfiguracaoFaturamento, listarFaturasPlataforma } from "@/app/actions/faturamento"
import { AdminFaturamentoList } from "@/components/admin-faturamento-list"
import { AdminErroCarregamento } from "@/components/admin-erro-carregamento"
import { ehErroDeControleDoNext } from "@/lib/next-render-errors"

export default async function AdminFaturamentoPage() {
  try {
    const [carteiras, faturas] = await Promise.all([listarConfiguracaoFaturamento(), listarFaturasPlataforma()])
    return <AdminFaturamentoList carteirasIniciais={carteiras} faturasIniciais={faturas} />
  } catch (error) {
    if (ehErroDeControleDoNext(error)) throw error
    console.error("[v0] Erro ao carregar /admin/faturamento:", error)
    return <AdminErroCarregamento mensagem={error instanceof Error ? error.message : undefined} />
  }
}
