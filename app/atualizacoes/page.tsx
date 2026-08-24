import { redirect } from "next/navigation"
import Link from "next/link"
import { Settings } from "lucide-react"
import { getSession } from "@/lib/session"
import { listarAtualizacoesParaUsuario } from "@/app/actions/atualizacoes"
import { AtualizacaoCard } from "@/components/atualizacao-card"
import { EmptyState } from "@/components/ui/empty-state"
import { Button } from "@/components/ui/button"
import type { Atualizacao } from "@/types/atualizacao"

export default async function AtualizacoesPage() {
  const session = await getSession()

  if (!session) {
    redirect("/login")
  }

  const atualizacoes = (await listarAtualizacoesParaUsuario()) as Atualizacao[]

  return (
    <div className="container mx-auto py-8 px-4 lg:px-6 max-w-5xl">
      <div className="mb-8 flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold mb-1 text-foreground">Atualizações</h1>
          <p className="text-sm text-muted-foreground">Tudo o que há de novo no FluxoPay.</p>
        </div>
        {session.isSuperAdmin && (
          <Button variant="outline" size="sm" asChild>
            <Link href="/atualizacoes/gerenciar">
              <Settings className="h-4 w-4 mr-2" />
              Gerenciar atualizações
            </Link>
          </Button>
        )}
      </div>

      {atualizacoes.length === 0 ? (
        <EmptyState
          title="Nenhuma atualização por enquanto"
          description="Quando houver novidades no FluxoPay, elas aparecem aqui."
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {atualizacoes.map((atualizacao) => (
            <AtualizacaoCard key={atualizacao.id} atualizacao={atualizacao} />
          ))}
        </div>
      )}
    </div>
  )
}
