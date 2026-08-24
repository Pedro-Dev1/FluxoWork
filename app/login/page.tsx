"use client"

import type React from "react"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Alert, AlertDescription } from "@/components/ui/alert"
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
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header Navigation */}
      <header className="w-full py-4 px-6 border-b border-border">
        <nav className="max-w-7xl mx-auto flex items-center justify-end gap-1">
          <Link
            href="/login"
            className="px-4 py-2 text-sm font-medium text-primary"
          >
            Login
          </Link>
          <Link
            href="/faq"
            className="px-4 py-2 text-sm font-medium text-text-secondary hover:text-foreground transition-colors"
          >
            FAQ
          </Link>
          <Link
            href="/termos"
            className="px-4 py-2 text-sm font-medium text-text-secondary hover:text-foreground transition-colors"
          >
            Termos
          </Link>
          <Link
            href="/privacidade"
            className="px-4 py-2 text-sm font-medium text-text-secondary hover:text-foreground transition-colors"
          >
            Privacidade
          </Link>
        </nav>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-[400px]">
          {/* Logo */}
          <div className="text-center mb-8">
            <img src="/fluxopay-logo.png" alt="FluxoPay" className="h-14 w-auto mx-auto mb-3" />
            <p className="text-text-secondary text-sm">Plataforma de gestão de prestadores — Simpleqia</p>
          </div>

          {/* Login Card */}
          <div className="bg-card border border-border rounded-lg p-8">
            <div className="mb-6">
              <h1 className="text-lg font-semibold text-foreground">Acesse sua conta</h1>
              <p className="text-text-secondary text-sm mt-1">Área restrita a usuários autorizados</p>
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
                    className="pl-9 h-11"
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
                    className="pl-9 pr-10 h-11"
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

              <Button type="submit" disabled={loading} className="w-full h-11 text-sm font-semibold">
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Entrar"}
              </Button>

              <Button type="button" variant="outline" asChild className="w-full h-11 text-sm font-medium">
                <Link href="/esqueci-senha">Esqueci minha senha</Link>
              </Button>
            </form>
          </div>

          {/* Footer text */}
          <p className="text-center text-xs text-text-tertiary mt-6">
            Ao acessar, você concorda com nossos{" "}
            <Link href="/termos" className="text-primary hover:underline">
              Termos de Uso
            </Link>{" "}
            e{" "}
            <Link href="/privacidade" className="text-primary hover:underline">
              Política de Privacidade
            </Link>
          </p>
        </div>
      </main>

      {/* Footer */}
      <footer className="py-6 px-4 border-t border-border">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-2 text-xs text-text-tertiary">
          <p>2026 FluxoPay — Simpleqia. Todos os direitos reservados.</p>
          <div className="flex items-center gap-3">
            <span>Suporte: simpleqia.oficial@gmail.com</span>
            <span className="text-border-strong">|</span>
            <span>(11) 91486-0806</span>
          </div>
        </div>
      </footer>
    </div>
  )
}
