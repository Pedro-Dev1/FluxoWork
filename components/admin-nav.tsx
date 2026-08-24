"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"

const ITENS = [
  { href: "/admin", label: "Visão geral" },
  { href: "/admin/carteiras", label: "Carteiras" },
  { href: "/admin/usuarios", label: "Usuários" },
  { href: "/admin/auditoria", label: "Auditoria" },
  { href: "/admin/faturamento", label: "Faturamento" },
  { href: "/atualizacoes/gerenciar", label: "Atualizações" },
]

export function AdminNav() {
  const pathname = usePathname()

  return (
    <nav className="flex items-center gap-1 border-b border-border overflow-x-auto">
      {ITENS.map((item) => {
        const isActive = item.href === "/admin" ? pathname === "/admin" : pathname.startsWith(item.href)
        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "px-3 py-2 text-sm whitespace-nowrap border-b-2 -mb-px transition-colors",
              isActive
                ? "border-primary text-primary font-medium"
                : "border-transparent text-muted-foreground hover:text-foreground",
            )}
          >
            {item.label}
          </Link>
        )
      })}
    </nav>
  )
}
