import { redirect } from "next/navigation"
import { getSession } from "@/lib/session"
import { AdminNav } from "@/components/admin-nav"

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession()

  if (!session?.isSuperAdmin) {
    redirect("/")
  }

  return (
    <div className="container mx-auto py-8 px-4 lg:px-6 max-w-5xl">
      <div className="mb-8">
        <h1 className="text-2xl font-semibold mb-1 text-foreground">Painel Super Admin</h1>
        <p className="text-sm text-muted-foreground">Carteiras, usuários e auditoria do FluxoPay.</p>
      </div>
      <AdminNav />
      <div className="mt-6">{children}</div>
    </div>
  )
}
