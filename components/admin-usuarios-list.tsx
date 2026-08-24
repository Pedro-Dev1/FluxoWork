"use client"

import { useMemo, useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { EmptyState } from "@/components/ui/empty-state"
import { Search, ShieldPlus, ShieldMinus } from "lucide-react"
import { promoverSuperAdmin, revogarSuperAdmin, listarColaboradoresGlobal, listarSuperAdmins } from "@/app/actions/tenants"
import { useToast } from "@/hooks/use-toast"

interface Colaborador {
  id: string
  nome_completo: string
  email: string
  tipo_acesso: string
  ativo: boolean
  tenant: { id: string; nome: string } | { id: string; nome: string }[] | null
}

interface Tenant {
  id: string
  nome: string
}

interface SuperAdmin {
  id: string
  nome_completo: string
  email: string
}

function nomeTenant(tenant: Colaborador["tenant"]): string {
  if (!tenant) return "Sem carteira"
  const t = Array.isArray(tenant) ? tenant[0] : tenant
  return t?.nome || "Sem carteira"
}

export function AdminUsuariosList({
  colaboradoresIniciais,
  superAdminsIniciais,
  tenants,
}: {
  colaboradoresIniciais: Colaborador[]
  superAdminsIniciais: SuperAdmin[]
  tenants: Tenant[]
}) {
  const { toast } = useToast()
  const [colaboradores, setColaboradores] = useState(colaboradoresIniciais)
  const [superAdmins, setSuperAdmins] = useState(superAdminsIniciais)
  const [busca, setBusca] = useState("")
  const [promoverAlvo, setPromoverAlvo] = useState<Colaborador | null>(null)
  const [revogarAlvo, setRevogarAlvo] = useState<SuperAdmin | null>(null)
  const [tenantDestino, setTenantDestino] = useState<string>(tenants[0]?.id || "")

  const filtrados = useMemo(() => {
    const termo = busca.trim().toLowerCase()
    if (!termo) return colaboradores
    return colaboradores.filter(
      (c) => c.nome_completo.toLowerCase().includes(termo) || c.email.toLowerCase().includes(termo),
    )
  }, [colaboradores, busca])

  const recarregar = async () => {
    try {
      const [novosColaboradores, novosSuperAdmins] = await Promise.all([
        listarColaboradoresGlobal(),
        listarSuperAdmins(),
      ])
      setColaboradores(novosColaboradores as any)
      setSuperAdmins(novosSuperAdmins)
    } catch (error) {
      console.error("[v0] Erro ao recarregar usuários:", error)
    }
  }

  const confirmarPromover = async () => {
    if (!promoverAlvo) return
    try {
      await promoverSuperAdmin(promoverAlvo.id)
      toast({ title: `${promoverAlvo.nome_completo} agora é Super Admin` })
      recarregar()
    } catch (error) {
      toast({
        title: "Erro ao promover",
        description: error instanceof Error ? error.message : "Tente novamente",
        variant: "destructive",
      })
    } finally {
      setPromoverAlvo(null)
    }
  }

  const confirmarRevogar = async () => {
    if (!revogarAlvo || !tenantDestino) return
    try {
      await revogarSuperAdmin(revogarAlvo.id, tenantDestino)
      toast({ title: `Super Admin revogado de ${revogarAlvo.nome_completo}` })
      recarregar()
    } catch (error) {
      toast({
        title: "Erro ao revogar",
        description: error instanceof Error ? error.message : "Tente novamente",
        variant: "destructive",
      })
    } finally {
      setRevogarAlvo(null)
    }
  }

  return (
    <div>
      {superAdmins.length > 0 && (
        <div className="mb-6">
          <p className="text-sm font-medium text-foreground mb-2">Super Admins atuais</p>
          <div className="space-y-2">
            {superAdmins.map((sa) => (
              <Card key={sa.id}>
                <CardContent className="p-4 flex items-center justify-between gap-4">
                  <div className="min-w-0">
                    <p className="font-medium text-foreground truncate">{sa.nome_completo}</p>
                    <p className="text-sm text-muted-foreground truncate">{sa.email}</p>
                  </div>
                  <Button variant="outline" size="sm" onClick={() => setRevogarAlvo(sa)}>
                    <ShieldMinus className="mr-2 h-4 w-4" />
                    Revogar
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      <p className="text-sm font-medium text-foreground mb-2">Colaboradores</p>

      <div className="relative mb-4 max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input placeholder="Buscar por nome ou e-mail" value={busca} onChange={(e) => setBusca(e.target.value)} className="pl-9" />
      </div>

      {filtrados.length === 0 ? (
        <EmptyState title="Nenhum colaborador encontrado" />
      ) : (
        <div className="space-y-2">
          {filtrados.map((colaborador) => (
            <Card key={colaborador.id}>
              <CardContent className="p-4 flex items-center justify-between gap-4">
                <div className="min-w-0">
                  <p className="font-medium text-foreground truncate">{colaborador.nome_completo}</p>
                  <p className="text-sm text-muted-foreground truncate">
                    {colaborador.email} · {colaborador.tipo_acesso} · {nomeTenant(colaborador.tenant)}
                    {!colaborador.ativo && " · Desativado"}
                  </p>
                </div>
                <Button variant="outline" size="sm" onClick={() => setPromoverAlvo(colaborador)}>
                  <ShieldPlus className="mr-2 h-4 w-4" />
                  Promover a Super Admin
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <AlertDialog open={!!promoverAlvo} onOpenChange={(open) => !open && setPromoverAlvo(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Promover {promoverAlvo?.nome_completo} a Super Admin?</AlertDialogTitle>
            <AlertDialogDescription>
              Essa conta passa a enxergar e operar sobre todas as carteiras do sistema, sem restrição — sai da
              carteira atual ({nomeTenant(promoverAlvo?.tenant || null)}).
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={confirmarPromover}>Promover</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={!!revogarAlvo} onOpenChange={(open) => !open && setRevogarAlvo(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Revogar Super Admin de {revogarAlvo?.nome_completo}?</AlertDialogTitle>
            <AlertDialogDescription>
              Essa conta volta a pertencer a uma única carteira. Escolha qual:
            </AlertDialogDescription>
          </AlertDialogHeader>
          <Select value={tenantDestino} onValueChange={setTenantDestino}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {tenants.map((t) => (
                <SelectItem key={t.id} value={t.id}>
                  {t.nome}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={confirmarRevogar} disabled={!tenantDestino}>
              Revogar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
