import { verificarTokenRedefinicao } from "@/app/actions/auth"
import { RedefinirSenhaTokenForm } from "@/components/redefinir-senha-token-form"
import Link from "next/link"
import { AlertTriangle } from "lucide-react"

export default async function RedefinirSenhaTokenPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params
  const { valido } = await verificarTokenRedefinicao(token)

  return (
    <div className="min-h-screen bg-[#0a0f1a] flex flex-col">
      <main className="flex-1 flex items-center justify-center px-4 py-8">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold">
              <span className="text-white">Fluxo</span>
              <span className="text-primary">Pay</span>
            </h1>
          </div>

          <div className="bg-[#111827] border border-gray-800 rounded-2xl p-6 shadow-2xl">
            {valido ? (
              <>
                <div className="mb-6">
                  <h2 className="text-xl font-semibold text-white">Criar nova senha</h2>
                  <p className="text-gray-400 text-sm mt-1">Escolha uma nova senha para acessar sua conta.</p>
                </div>
                <RedefinirSenhaTokenForm token={token} />
              </>
            ) : (
              <div className="text-center py-4">
                <div className="mx-auto w-12 h-12 rounded-full bg-danger-subtle flex items-center justify-center mb-4">
                  <AlertTriangle className="h-6 w-6 text-danger" />
                </div>
                <h2 className="text-xl font-semibold text-white mb-2">Link inválido ou expirado</h2>
                <p className="text-gray-400 text-sm">
                  Este link de redefinição não é mais válido. Solicite um novo link para redefinir sua senha.
                </p>
                <Link
                  href="/esqueci-senha"
                  className="inline-flex items-center justify-center h-11 px-6 mt-6 text-sm font-semibold text-white bg-primary hover:bg-primary/90 rounded-lg transition-colors"
                >
                  Solicitar novo link
                </Link>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  )
}
