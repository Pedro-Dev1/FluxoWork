import { listarTenants } from "@/app/actions/tenants"
import { AdminCarteirasList } from "@/components/admin-carteiras-list"
import { AdminErroCarregamento } from "@/components/admin-erro-carregamento"
import { ehErroDeControleDoNext } from "@/lib/next-render-errors"

export default async function AdminCarteirasPage() {
  try {
    const carteiras = await listarTenants()
    return <AdminCarteirasList carteirasIniciais={carteiras} />
  } catch (error) {
    if (ehErroDeControleDoNext(error)) throw error
    console.error("[v0] Erro ao carregar /admin/carteiras:", error)
    return <AdminErroCarregamento mensagem={error instanceof Error ? error.message : undefined} />
  }
}
