"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import {
  Users,
  Receipt,
  CheckSquare,
  LogOut,
  UsersRound,
  AlertCircle,
  FileText,
  LayoutDashboard,
  DollarSign,
  Menu,
  X,
  Lock,
  Building2,
  Landmark,
  ScrollText,
  Megaphone,
  ShieldCheck,
} from "lucide-react"
import { logout } from "@/app/actions/auth"
import { Button } from "@/components/ui/button"
import { useState, useEffect } from "react"
import { contarPendencias } from "@/app/actions/contadores"

interface SidebarNavigationProps {
  tipoAcesso?: string
  isSuperAdmin?: boolean
  viewingAsTenantId?: string | null
}

interface NavItem {
  href: string
  label: string
  icon: any
  badge?: number
  roles?: string[]
}

interface NavGroup {
  title?: string
  items: NavItem[]
}

export function SidebarNavigation({ tipoAcesso, isSuperAdmin, viewingAsTenantId }: SidebarNavigationProps) {
  const pathname = usePathname()
  const [mobileOpen, setMobileOpen] = useState(false)
  const [pendencias, setPendencias] = useState({ aprovacoes: 0, painelFinanceiro: 0, correcoes: 0, acompanhamento: 0 })

  // Aparece pra qualquer papel, sempre em cima — visível em toda página, não
  // só num link solto no dashboard.
  const superAdminGroup: NavGroup[] = isSuperAdmin
    ? [
        {
          title: "Super Admin",
          items: [
            { href: "/admin", label: "Painel", icon: ShieldCheck },
            { href: "/admin/carteiras", label: "Carteiras", icon: Building2 },
            { href: "/admin/usuarios", label: "Usuários", icon: UsersRound },
            { href: "/admin/auditoria", label: "Auditoria", icon: FileText },
          ],
        },
      ]
    : []

  useEffect(() => {
    const fetchPendencias = async () => {
      try {
        const counts = await contarPendencias()
        setPendencias(counts)
      } catch {}
    }
    fetchPendencias()
    const interval = setInterval(fetchPendencias, 30000)
    return () => clearInterval(interval)
  }, [])

  const getGroups = (): NavGroup[] => {
    // Super Admin sem carteira escolhida no seletor = visão de controle da
    // plataforma, sem o menu operacional de uma empresa específica
    // misturado. O menu de Pedidos/Financeiro/Gestão só faz sentido quando
    // "ver como" está apontando pra uma carteira — aí sim ele opera como se
    // fosse o Adm daquela empresa.
    if (isSuperAdmin && !viewingAsTenantId) {
      return superAdminGroup
    }

    if (tipoAcesso === "Colaborador") {
      return [
        ...superAdminGroup,
        {
          items: [
            { href: "/meus-pagamentos", label: "Meus Pagamentos", icon: Receipt },
            { href: "/faturas", label: "Faturas", icon: FileText },
            { href: "/atualizacoes", label: "Atualizações", icon: Megaphone },
          ],
        },
        { items: [{ href: "/redefinir-senha", label: "Redefinir Senha", icon: Lock }] },
      ]
    }

    if (tipoAcesso === "Supervisor") {
      return [
        ...superAdminGroup,
        {
          items: [
            { href: "/", label: "Dashboard", icon: LayoutDashboard },
            { href: "/atualizacoes", label: "Atualizações", icon: Megaphone },
          ],
        },
        {
          title: "Pedidos",
          items: [
            { href: "/pedidos", label: "Criar Pedido", icon: Receipt },
            { href: "/historico", label: "Meus Pedidos", icon: FileText },
            { href: "/meus-pagamentos", label: "Meus Pagamentos", icon: DollarSign },
            { href: "/faturas", label: "Faturas", icon: FileText },
          ],
        },
        {
          title: "Equipe",
          items: [
            { href: "/supervisor/notas-equipe", label: "Notas da Equipe", icon: Users },
            { href: "/acompanhamento", label: "Acompanhamento", icon: AlertCircle, badge: pendencias.acompanhamento },
          ],
        },
        { items: [{ href: "/redefinir-senha", label: "Redefinir Senha", icon: Lock }] },
      ]
    }

    const groups: NavGroup[] = [
      ...superAdminGroup,
      {
        items: [
          { href: "/", label: "Dashboard", icon: LayoutDashboard },
          { href: "/atualizacoes", label: "Atualizações", icon: Megaphone },
        ],
      },
      {
        title: "Pedidos",
        items: [
          { href: "/pedidos", label: "Criar Pedido", icon: Receipt, roles: ["Adm", "Gerente"] },
          { href: "/historico", label: "Meus Pedidos", icon: FileText, roles: ["Gerente"], badge: pendencias.correcoes },
          { href: "/aprovacoes", label: "Aprovações", icon: CheckSquare, roles: ["Adm", "Gerente", "Financeiro"], badge: pendencias.aprovacoes },
          { href: "/acompanhamento", label: "Acompanhamento", icon: AlertCircle, roles: ["Adm", "Gerente", "Financeiro"], badge: pendencias.acompanhamento },
          { href: "/meus-pagamentos", label: "Meus Pagamentos", icon: Receipt, roles: ["Gerente", "Financeiro"] },
        ],
      },
      {
        title: "Financeiro",
        items: [
          { href: "/financeiro", label: "Painel Financeiro", icon: DollarSign, roles: ["Adm", "Financeiro"], badge: pendencias.painelFinanceiro },
          { href: "/faturas", label: "Faturas", icon: FileText, roles: ["Adm", "Financeiro", "Gerente"] },
          { href: "/fiscal", label: "Fiscal", icon: Landmark, roles: ["Adm", "Financeiro"] },
          { href: "/contratos", label: "Contratos", icon: ScrollText, roles: ["Adm", "Financeiro"] },
        ],
      },
      {
        title: "Gestão",
        items: [
          { href: "/cadastros", label: "Cadastros", icon: Building2, roles: ["Adm", "Financeiro"] },
          { href: "/gestao", label: "Gestão de Pessoas", icon: UsersRound, roles: ["Adm", "Financeiro"] },
        ],
      },
      { items: [{ href: "/redefinir-senha", label: "Redefinir Senha", icon: Lock }] },
    ]

    return groups
      .map((group) => ({
        ...group,
        items: group.items.filter((item) => !item.roles || item.roles.includes(tipoAcesso || "")),
      }))
      .filter((group) => group.items.length > 0)
  }

  const groups = getGroups()

  const handleLogout = async () => {
    await logout()
  }

  const NavLink = ({ item, onClick }: { item: NavItem; onClick?: () => void }) => {
    const Icon = item.icon
    const isActive = pathname === item.href
    const hasBadge = (item.badge ?? 0) > 0

    return (
      <Link
        href={item.href}
        onClick={onClick}
        className={cn(
          "group flex items-center gap-3 px-3 py-2 text-sm rounded-control transition-colors",
          isActive
            ? "bg-accent text-primary font-medium"
            : "text-text-secondary font-normal hover:text-foreground hover:bg-surface",
        )}
      >
        <Icon className={cn("h-4 w-4 shrink-0", isActive ? "text-primary" : "text-text-tertiary")} />
        <span className="flex-1 truncate">{item.label}</span>
        {hasBadge && (
          <span className="ml-auto flex h-5 min-w-[20px] items-center justify-center rounded-full bg-primary text-primary-foreground text-[10px] font-bold px-1.5 tabular-nums">
            {item.badge}
          </span>
        )}
      </Link>
    )
  }

  const NavGroups = ({ onItemClick }: { onItemClick?: () => void }) => (
    <>
      {groups.map((group, i) => (
        <div key={group.title || i} className={i > 0 ? "mt-4" : undefined}>
          {group.title && (
            <p className="px-3 mb-1 text-[11px] font-medium uppercase tracking-wide text-text-tertiary">{group.title}</p>
          )}
          <div className="space-y-0.5">
            {group.items.map((item) => (
              <NavLink key={item.href} item={item} onClick={onItemClick} />
            ))}
          </div>
        </div>
      ))}
    </>
  )

  return (
    <>
      {/* Mobile toggle */}
      <Button
        variant="outline"
        size="icon"
        className="lg:hidden fixed top-3 left-3 z-50 h-9 w-9"
        onClick={() => setMobileOpen(!mobileOpen)}
      >
        {mobileOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
      </Button>

      {/* Desktop sidebar */}
      <aside className="fixed top-0 left-0 z-40 h-screen w-56 hidden lg:flex flex-col border-r border-border bg-card">
        <div className="flex items-center h-16 px-4 border-b border-border">
          <Link href="/" className="flex items-center">
            <img src="/fluxopay-logo.png" alt="Fluxopay" className="h-10 w-auto" />
          </Link>
        </div>

        <nav className="flex-1 overflow-y-auto py-4 px-3">
          <NavGroups />
        </nav>

        {tipoAcesso && (
          <div className="border-t border-border p-3">
            <Button
              variant="ghost"
              onClick={handleLogout}
              className="w-full justify-start gap-3 text-text-secondary hover:text-foreground h-9 text-sm font-normal"
            >
              <LogOut className="h-4 w-4" />
              <span>Sair</span>
            </Button>
          </div>
        )}
      </aside>

      {/* Mobile sidebar overlay */}
      {mobileOpen && (
        <>
          <div className="fixed inset-0 z-40 bg-foreground/50 lg:hidden" onClick={() => setMobileOpen(false)} />
          <aside className="fixed top-0 left-0 z-50 h-screen w-72 bg-card border-r border-border lg:hidden flex flex-col shadow-2xl animate-in slide-in-from-left duration-200">
            <div className="flex items-center justify-between h-16 px-4 border-b border-border">
              <Link href="/" className="flex items-center">
                <img src="/fluxopay-logo.png" alt="Fluxopay" className="h-10 w-auto" />
              </Link>
              <Button variant="ghost" size="icon" onClick={() => setMobileOpen(false)} className="h-8 w-8">
                <X className="h-4 w-4" />
              </Button>
            </div>

            <nav className="flex-1 overflow-y-auto py-4 px-3">
              <NavGroups onItemClick={() => setMobileOpen(false)} />
            </nav>

            {tipoAcesso && (
              <div className="border-t border-border p-3">
                <Button
                  variant="ghost"
                  onClick={handleLogout}
                  className="w-full justify-start gap-3 text-text-secondary hover:text-foreground h-9 text-sm font-normal"
                >
                  <LogOut className="h-4 w-4" />
                  <span>Sair</span>
                </Button>
              </div>
            )}
          </aside>
        </>
      )}
    </>
  )
}
