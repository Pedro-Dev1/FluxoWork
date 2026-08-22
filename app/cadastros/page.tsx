import { getUsuarioLogado } from "@/lib/auth-utils"
import { redirect } from "next/navigation"
import Link from "next/link"
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Users, UsersRound, Building2, ChevronRight } from "lucide-react"
import { PageHeader } from "@/components/ui/page-header"

export default async function CadastrosPage() {
  const usuario = await getUsuarioLogado()

  if (!usuario) {
    redirect("/login")
  }

  if (!["Financeiro", "Adm"].includes(usuario.tipo_acesso)) {
    redirect("/")
  }

  const cadastros = [
    {
      href: "/cadastros/colaboradores",
      title: "Colaboradores",
      description: "Gerencie os colaboradores do sistema, incluindo dados pessoais, salários e acessos.",
      icon: Users,
    },
    {
      href: "/cadastros/equipes",
      title: "Equipes",
      description: "Organize colaboradores em equipes e defina supervisores responsáveis.",
      icon: UsersRound,
    },
    {
      href: "/cadastros/centros-custo",
      title: "Centros de custo",
      description: "Gerencie os centros de custo para organização financeira dos pagamentos.",
      icon: Building2,
    },
  ]

  return (
    <div className="container mx-auto px-4 lg:px-6 py-8 max-w-5xl">
      <PageHeader title="Cadastros" description="Gerencie colaboradores, equipes e centros de custo do sistema" />

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {cadastros.map((item) => {
          const Icon = item.icon
          return (
            <Link key={item.href} href={item.href} className="group">
              <Card className="h-full border-border transition-colors hover:border-border-strong">
                <CardHeader className="pb-4">
                  <div className="flex items-start justify-between">
                    <div className="p-3 rounded-lg bg-accent text-primary">
                      <Icon className="h-6 w-6" />
                    </div>
                    <ChevronRight className="h-5 w-5 text-text-tertiary group-hover:text-foreground transition-colors" />
                  </div>
                  <CardTitle className="text-lg mt-4">{item.title}</CardTitle>
                  <CardDescription className="text-sm leading-relaxed">{item.description}</CardDescription>
                </CardHeader>
              </Card>
            </Link>
          )
        })}
      </div>
    </div>
  )
}
