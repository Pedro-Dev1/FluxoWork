import { listarTenants } from "@/app/actions/tenants"
import { AdminCarteirasList } from "@/components/admin-carteiras-list"

export default async function AdminCarteirasPage() {
  const carteiras = await listarTenants()

  return <AdminCarteirasList carteirasIniciais={carteiras} />
}
