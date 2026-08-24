"use client"

import { useTransition } from "react"
import { useRouter } from "next/navigation"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { definirVisualizacaoTenant } from "@/app/actions/auth"
import { Building2 } from "lucide-react"

interface Tenant {
  id: string
  nome: string
}

export function TenantSwitcher({
  tenants,
  viewingAsTenantId,
}: {
  tenants: Tenant[]
  viewingAsTenantId: string | null
}) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

  const handleChange = (value: string) => {
    const tenantId = value === "todas" ? null : value
    startTransition(async () => {
      await definirVisualizacaoTenant(tenantId)
      router.refresh()
    })
  }

  return (
    <Select value={viewingAsTenantId ?? "todas"} onValueChange={handleChange} disabled={isPending}>
      <SelectTrigger className="h-8 w-[180px] text-xs gap-2 shrink-0" title="Ver como carteira">
        <Building2 className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="todas">Todas as carteiras</SelectItem>
        {tenants.map((t) => (
          <SelectItem key={t.id} value={t.id}>
            {t.nome}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}
