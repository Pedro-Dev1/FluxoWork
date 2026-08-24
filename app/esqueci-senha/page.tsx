"use client"

import type React from "react"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { AuthShell } from "@/components/auth-shell"
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
    <AuthShell>
      {enviado ? (
        <div className="text-center py-2">
          <div className="mx-auto w-11 h-11 rounded-full bg-success-subtle flex items-center justify-center mb-4">
            <CheckCircle2 className="h-5 w-5 text-success" />
          </div>
          <h2 className="text-base font-semibold text-foreground mb-1">Verifique seu e-mail</h2>
          <p className="text-text-secondary text-sm">
            Se {email} estiver cadastrado, você vai receber um link para redefinir sua senha em instantes.
          </p>
          <Link href="/login" className="inline-flex items-center gap-1.5 text-sm text-primary hover:underline mt-5">
            <ArrowLeft className="h-3.5 w-3.5" />
            Voltar para o login
          </Link>
        </div>
      ) : (
        <>
          <div className="mb-5">
            <h1 className="text-base font-semibold text-foreground">Esqueci minha senha</h1>
            <p className="text-text-secondary text-sm mt-0.5">
              Informe seu e-mail cadastrado e enviaremos um link para redefinir sua senha.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <Alert variant="destructive" className="border-danger/30 bg-danger-subtle">
                <AlertCircle className="h-4 w-4 text-danger" />
                <AlertDescription className="text-xs text-danger">{error}</AlertDescription>
              </Alert>
            )}

            <div className="space-y-1.5">
              <label htmlFor="email" className="text-xs font-medium text-text-secondary">
                E-mail
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-text-tertiary" />
                <Input
                  id="email"
                  type="email"
                  placeholder="seu@empresa.com.br"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  autoFocus
                  className="pl-9 h-10"
                />
              </div>
            </div>

            <Button type="submit" disabled={loading} className="w-full h-10 text-sm font-semibold">
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Enviar link de redefinição"}
            </Button>

            <Link
              href="/login"
              className="flex items-center justify-center gap-1.5 text-sm text-text-secondary hover:text-primary transition-colors"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              Voltar para o login
            </Link>
          </form>
        </>
      )}
    </AuthShell>
  )
}
