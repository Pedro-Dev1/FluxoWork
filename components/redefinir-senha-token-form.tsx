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
      <div className="text-center py-4">
        <div className="mx-auto w-12 h-12 rounded-full bg-success-subtle flex items-center justify-center mb-4">
          <CheckCircle2 className="h-6 w-6 text-success" />
        </div>
        <h3 className="text-lg font-semibold text-white mb-1">Senha redefinida</h3>
        <p className="text-gray-400 text-sm">Redirecionando para o login...</p>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {error && (
        <Alert variant="destructive" className="border-red-500/50 bg-red-500/10">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription className="text-xs">{error}</AlertDescription>
        </Alert>
      )}

      <div className="space-y-2">
        <label className="text-xs font-medium text-gray-400 uppercase tracking-wide">Nova senha</label>
        <div className="relative">
          <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-500" />
          <Input
            type={showPassword ? "text" : "password"}
            placeholder="Mínimo 8 caracteres"
            value={novaSenha}
            onChange={(e) => setNovaSenha(e.target.value)}
            required
            autoFocus
            className="pl-10 pr-10 h-12 bg-[#1a2332] border-gray-700 text-white placeholder:text-gray-500 focus:border-primary"
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300"
          >
            {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
          </button>
        </div>
        <p className="text-xs text-gray-500">Use letras maiúsculas, minúsculas e números.</p>
      </div>

      <div className="space-y-2">
        <label className="text-xs font-medium text-gray-400 uppercase tracking-wide">Confirmar nova senha</label>
        <div className="relative">
          <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-500" />
          <Input
            type={showPassword ? "text" : "password"}
            placeholder="Repita a nova senha"
            value={confirmarSenha}
            onChange={(e) => setConfirmarSenha(e.target.value)}
            required
            className="pl-10 h-12 bg-[#1a2332] border-gray-700 text-white placeholder:text-gray-500 focus:border-primary"
          />
        </div>
      </div>

      <Button type="submit" disabled={loading} className="w-full h-12 text-sm font-semibold bg-primary hover:bg-primary/90">
        {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Redefinir senha"}
      </Button>
    </form>
  )
}
