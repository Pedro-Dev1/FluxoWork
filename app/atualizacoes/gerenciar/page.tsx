import { redirect } from "next/navigation"
import { getSession } from "@/lib/session"
import { AtualizacoesAdminList } from "@/components/atualizacoes-admin-list"

export default async function GerenciarAtualizacoesPage() {
  const session = await getSession()

  if (!session?.isSuperAdmin) {
    redirect("/atualizacoes")
  }

  return (
    <div className="container mx-auto py-8 px-4 lg:px-6 max-w-5xl">
      <div className="mb-8">
        <h1 className="text-2xl font-semibold mb-1 text-foreground">Gerenciar atualizações</h1>
        <p className="text-sm text-muted-foreground">Crie, agende e envie os avisos institucionais do FluxoPay.</p>
      </div>
      <AtualizacoesAdminList />
    </div>
  )
}
