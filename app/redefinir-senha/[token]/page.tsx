import { verificarTokenRedefinicao } from "@/app/actions/auth"
import { RedefinirSenhaTokenForm } from "@/components/redefinir-senha-token-form"
import { AuthShell } from "@/components/auth-shell"
import Link from "next/link"
import { AlertTriangle } from "lucide-react"

export default async function RedefinirSenhaTokenPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params
  const { valido } = await verificarTokenRedefinicao(token)

  return (
    <AuthShell>
      {valido ? (
        <>
          <div className="mb-5">
            <h1 className="text-base font-semibold text-foreground">Criar nova senha</h1>
            <p className="text-text-secondary text-sm mt-0.5">Escolha uma nova senha para acessar sua conta.</p>
          </div>
          <RedefinirSenhaTokenForm token={token} />
        </>
      ) : (
        <div className="text-center py-2">
          <div className="mx-auto w-11 h-11 rounded-full bg-danger-subtle flex items-center justify-center mb-4">
            <AlertTriangle className="h-5 w-5 text-danger" />
          </div>
          <h2 className="text-base font-semibold text-foreground mb-1">Link inválido ou expirado</h2>
          <p className="text-text-secondary text-sm">
            Este link de redefinição não é mais válido. Solicite um novo link para redefinir sua senha.
          </p>
          <Link
            href="/esqueci-senha"
            className="inline-flex items-center justify-center h-10 px-5 mt-5 text-sm font-semibold text-primary-foreground bg-primary hover:bg-primary-hover rounded-control transition-colors"
          >
            Solicitar novo link
          </Link>
        </div>
      )}
    </AuthShell>
  )
}
