"use client"

import type React from "react"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { redefinirSenhaComToken } from "@/app/actions/auth"
import { AlertCircle, CheckCircle2, Loader2, Lock, Eye, EyeOff } from "lucide-react"
import { useRouter } from "next/navigation"

interface RedefinirSenhaTokenFormProps {
  token: string
}

export function RedefinirSenhaTokenForm({ token }: RedefinirSenhaTokenFormProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [sucesso, setSucesso] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [novaSenha, setNovaSenha] = useState("")
  const [confirmarSenha, setConfirmarSenha] = useState("")

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")

    if (novaSenha !== confirmarSenha) {
      setError("As senhas não coincidem")
      return
    }

    setLoading(true)
    try {
      const result = await redefinirSenhaComToken(token, novaSenha)
      if (result.success) {
        setSucesso(true)
        setTimeout(() => router.push("/login"), 2000)
      } else {
        setError(result.error || "Erro ao redefinir senha")
      }
    } catch {
      setError("Erro ao redefinir senha")
    } finally {
      setLoading(false)
    }
  }

  if (sucesso) {
    return (
      <div className="text-center py-2">
        <div className="mx-auto w-11 h-11 rounded-full bg-success-subtle flex items-center justify-center mb-4">
          <CheckCircle2 className="h-5 w-5 text-success" />
        </div>
        <h3 className="text-base font-semibold text-foreground mb-1">Senha redefinida</h3>
        <p className="text-text-secondary text-sm">Redirecionando para o login...</p>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <Alert variant="destructive" className="border-danger/30 bg-danger-subtle">
          <AlertCircle className="h-4 w-4 text-danger" />
          <AlertDescription className="text-xs text-danger">{error}</AlertDescription>
        </Alert>
      )}

      <div className="space-y-1.5">
        <label className="text-xs font-medium text-text-secondary">Nova senha</label>
        <div className="relative">
          <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-text-tertiary" />
          <Input
            type={showPassword ? "text" : "password"}
            placeholder="Mínimo 8 caracteres"
            value={novaSenha}
            onChange={(e) => setNovaSenha(e.target.value)}
            required
            autoFocus
            className="pl-9 pr-10 h-10"
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-text-tertiary hover:text-text-secondary"
            aria-label={showPassword ? "Ocultar senha" : "Mostrar senha"}
          >
            {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        </div>
        <p className="text-xs text-text-tertiary">Use letras maiúsculas, minúsculas e números.</p>
      </div>

      <div className="space-y-1.5">
        <label className="text-xs font-medium text-text-secondary">Confirmar nova senha</label>
        <div className="relative">
          <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-text-tertiary" />
          <Input
            type={showPassword ? "text" : "password"}
            placeholder="Repita a nova senha"
            value={confirmarSenha}
            onChange={(e) => setConfirmarSenha(e.target.value)}
            required
            className="pl-9 h-10"
          />
        </div>
      </div>

      <Button type="submit" disabled={loading} className="w-full h-10 text-sm font-semibold">
        {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Redefinir senha"}
      </Button>
    </form>
  )
}
