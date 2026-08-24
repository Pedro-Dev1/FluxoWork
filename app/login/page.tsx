"use client"

import type React from "react"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { AuthShell } from "@/components/auth-shell"
import { login } from "@/app/actions/auth"
import { AlertCircle, Loader2, Mail, Lock, Eye, EyeOff } from "lucide-react"
import Link from "next/link"

export default function LoginPage() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [formData, setFormData] = useState({ email: "", password: "" })
  const [showPassword, setShowPassword] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError("")
    try {
      const result = await login(formData.email, formData.password)
      if (result?.error) setError(result.error)
    } catch {
      setError("Erro ao fazer login")
    } finally {
      setLoading(false)
    }
  }

  return (
    <AuthShell>
      <div className="mb-5">
        <h1 className="text-base font-semibold text-foreground">Acesse sua conta</h1>
        <p className="text-text-secondary text-sm mt-0.5">Área restrita a usuários autorizados</p>
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
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              required
              className="pl-9 h-10"
            />
          </div>
        </div>

        <div className="space-y-1.5">
          <label htmlFor="password" className="text-xs font-medium text-text-secondary">
            Senha
          </label>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-text-tertiary" />
            <Input
              id="password"
              type={showPassword ? "text" : "password"}
              placeholder="Digite sua senha"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              required
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
        </div>

        <Button type="submit" disabled={loading} className="w-full h-10 text-sm font-semibold">
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Entrar"}
        </Button>

        <Button type="button" variant="outline" asChild className="w-full h-10 text-sm font-medium">
          <Link href="/esqueci-senha">Esqueci minha senha</Link>
        </Button>
      </form>
    </AuthShell>
  )
}
