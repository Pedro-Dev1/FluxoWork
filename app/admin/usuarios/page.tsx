import { listarColaboradoresGlobal, listarSuperAdmins, listarTenants } from "@/app/actions/tenants"
import { AdminUsuariosList } from "@/components/admin-usuarios-list"

export default async function AdminUsuariosPage() {
  const [colaboradores, superAdmins, tenants] = await Promise.all([
    listarColaboradoresGlobal(),
    listarSuperAdmins(),
    listarTenants(),
  ])

  return (
    <AdminUsuariosList colaboradoresIniciais={colaboradores as any} superAdminsIniciais={superAdmins} tenants={tenants} />
  )
}
