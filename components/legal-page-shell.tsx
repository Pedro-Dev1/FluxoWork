import type React from "react"
import Link from "next/link"
import { ArrowLeft } from "lucide-react"
import type { LucideIcon } from "lucide-react"
import { cn } from "@/lib/utils"

const NAV_ITEMS = [
  { href: "/login", label: "Login" },
  { href: "/faq", label: "FAQ" },
  { href: "/termos", label: "Termos" },
  { href: "/privacidade", label: "Privacidade" },
]

export function LegalPageShell({
  icon: Icon,
  title,
  subtitle,
  meta,
  activeHref,
  children,
}: {
  icon?: LucideIcon
  title: string
  subtitle: string
  meta?: React.ReactNode
  activeHref: string
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen bg-background">
      <header className="w-full py-3 px-6 border-b border-border">
        <nav className="max-w-7xl mx-auto flex items-center justify-between gap-4">
          <Link href="/login" className="flex items-center gap-2 text-text-secondary hover:text-foreground transition-colors shrink-0">
            <ArrowLeft className="h-4 w-4" />
            <span className="text-sm">Voltar ao login</span>
          </Link>
          <div className="flex items-center gap-1">
            {NAV_ITEMS.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "px-3 py-1.5 text-sm font-medium rounded-control transition-colors",
                  activeHref === item.href ? "text-primary" : "text-text-secondary hover:text-foreground",
                )}
              >
                {item.label}
              </Link>
            ))}
          </div>
        </nav>
      </header>

      <div className="py-10 px-4 border-b border-border">
        <div className="max-w-2xl mx-auto text-center">
          {Icon && (
            <div className="inline-flex items-center justify-center h-10 w-10 bg-accent rounded-control mb-4">
              <Icon className="h-5 w-5 text-primary" />
            </div>
          )}
          <h1 className="text-2xl font-semibold text-foreground mb-1.5">{title}</h1>
          <p className="text-text-secondary text-sm">{subtitle}</p>
          {meta && <div className="flex items-center justify-center gap-2 text-text-tertiary text-xs mt-3">{meta}</div>}
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 py-10">{children}</div>

      <footer className="py-5 px-4 border-t border-border">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-2 text-xs text-text-tertiary">
          <p>2026 FluxoPay — Simpleqia. Todos os direitos reservados.</p>
          <div className="flex items-center gap-3">
            <Link href="/termos" className="hover:text-foreground transition-colors">
              Termos
            </Link>
            <span className="text-border-strong">|</span>
            <Link href="/privacidade" className="hover:text-foreground transition-colors">
              Privacidade
            </Link>
          </div>
        </div>
      </footer>
    </div>
  )
}
