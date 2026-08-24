import { listarTenants } from "@/app/actions/tenants"
import { AdminCarteirasList } from "@/components/admin-carteiras-list"
import { AdminErroCarregamento } from "@/components/admin-erro-carregamento"

export default async function AdminCarteirasPage() {
  try {
    const carteiras = await listarTenants()
    return <AdminCarteirasList carteirasIniciais={carteiras} />
  } catch (error) {
    console.error("[v0] Erro ao carregar /admin/carteiras:", error)
    return <AdminErroCarregamento mensagem={error instanceof Error ? error.message : undefined} />
  }
}
