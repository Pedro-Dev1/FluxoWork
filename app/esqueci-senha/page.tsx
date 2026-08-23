"use client"

import type React from "react"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { solicitarRedefinicaoSenha } from "@/app/actions/auth"
import { AlertCircle, CheckCircle2, Loader2, Mail, ArrowLeft } from "lucide-react"
import Link from "next/link"

export default function EsqueciSenhaPage() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [enviado, setEnviado] = useState(false)
  const [email, setEmail] = useState("")

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError("")
    try {
      const result = await solicitarRedefinicaoSenha(email)
      if (result.success) {
        setEnviado(true)
      } else {
        setError(result.error || "Erro ao processar solicitação")
      }
    } catch {
      setError("Erro ao processar solicitação")
    } finally {
      setLoading(false)
    }
  }

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
            {enviado ? (
              <div className="text-center py-4">
                <div className="mx-auto w-12 h-12 rounded-full bg-success-subtle flex items-center justify-center mb-4">
                  <CheckCircle2 className="h-6 w-6 text-success" />
                </div>
                <h2 className="text-xl font-semibold text-white mb-2">Verifique seu e-mail</h2>
                <p className="text-gray-400 text-sm">
                  Se {email} estiver cadastrado, você vai receber um link para redefinir sua senha em instantes.
                </p>
                <Link href="/login" className="inline-flex items-center gap-1.5 text-sm text-primary hover:underline mt-6">
                  <ArrowLeft className="h-3.5 w-3.5" />
                  Voltar para o login
                </Link>
              </div>
            ) : (
              <>
                <div className="mb-6">
                  <h2 className="text-xl font-semibold text-white">Esqueci minha senha</h2>
                  <p className="text-gray-400 text-sm mt-1">
                    Informe seu e-mail cadastrado e enviaremos um link para redefinir sua senha.
                  </p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-5">
                  {error && (
                    <Alert variant="destructive" className="border-red-500/50 bg-red-500/10">
                      <AlertCircle className="h-4 w-4" />
                      <AlertDescription className="text-xs">{error}</AlertDescription>
                    </Alert>
                  )}

                  <div className="space-y-2">
                    <label className="text-xs font-medium text-gray-400 uppercase tracking-wide">E-mail</label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-500" />
                      <Input
                        type="email"
                        placeholder="seu@empresa.com.br"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                        autoFocus
                        className="pl-10 h-12 bg-[#1a2332] border-gray-700 text-white placeholder:text-gray-500 focus:border-primary"
                      />
                    </div>
                  </div>

                  <Button type="submit" disabled={loading} className="w-full h-12 text-sm font-semibold bg-primary hover:bg-primary/90">
                    {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Enviar link de redefinição"}
                  </Button>

                  <Link
                    href="/login"
                    className="flex items-center justify-center gap-1.5 text-sm text-gray-400 hover:text-primary transition-colors"
                  >
                    <ArrowLeft className="h-3.5 w-3.5" />
                    Voltar para o login
                  </Link>
                </form>
              </>
            )}
          </div>
        </div>
      </main>
    </div>
  )
}
