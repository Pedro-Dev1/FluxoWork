import { listarColaboradoresGlobal, listarSuperAdmins, listarTenants } from "@/app/actions/tenants"
import { AdminUsuariosList } from "@/components/admin-usuarios-list"
import { AdminErroCarregamento } from "@/components/admin-erro-carregamento"

export default async function AdminUsuariosPage() {
  try {
    const [colaboradores, superAdmins, tenants] = await Promise.all([
      listarColaboradoresGlobal(),
      listarSuperAdmins(),
      listarTenants(),
    ])

    return (
      <AdminUsuariosList
        colaboradoresIniciais={colaboradores as any}
        superAdminsIniciais={superAdmins}
        tenants={tenants}
      />
    )
  } catch (error) {
    console.error("[v0] Erro ao carregar /admin/usuarios:", error)
    return <AdminErroCarregamento mensagem={error instanceof Error ? error.message : undefined} />
  }
}
