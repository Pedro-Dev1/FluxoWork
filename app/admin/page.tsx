import { Card, CardContent } from "@/components/ui/card"
import { obterEstatisticasAdmin } from "@/app/actions/tenants"

export default async function AdminOverviewPage() {
  const stats = await obterEstatisticasAdmin()

  const cards = [
    { label: "Carteiras", value: stats.totalCarteiras },
    { label: "Colaboradores", value: stats.totalColaboradores },
    { label: "Super Admins", value: stats.totalSuperAdmins },
  ]

  return (
    <div className="grid gap-4 sm:grid-cols-3">
      {cards.map((card) => (
        <Card key={card.label}>
          <CardContent className="p-6">
            <p className="text-sm text-muted-foreground">{card.label}</p>
            <p className="text-3xl font-semibold text-foreground mt-1 tabular-nums">{card.value}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
