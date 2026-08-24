"use client"

import { useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { EmptyState } from "@/components/ui/empty-state"
import { Plus, MoreVertical, Power, PowerOff, Loader2 } from "lucide-react"
import { criarTenant, ativarTenant, desativarTenant, listarTenants } from "@/app/actions/tenants"
import { useToast } from "@/hooks/use-toast"

interface Carteira {
  id: string
  nome: string
  slug: string
  ativo: boolean
  total_colaboradores: number
}

function slugify(texto: string): string {
  return texto
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
}

export function AdminCarteirasList({ carteirasIniciais }: { carteirasIniciais: Carteira[] }) {
  const { toast } = useToast()
  const [carteiras, setCarteiras] = useState(carteirasIniciais)
  const [open, setOpen] = useState(false)
  const [salvando, setSalvando] = useState(false)
  const [nome, setNome] = useState("")
  const [slug, setSlug] = useState("")
  const [slugEditadoManualmente, setSlugEditadoManualmente] = useState(false)

  const recarregar = async () => {
    try {
      setCarteiras(await listarTenants())
    } catch {}
  }

  const handleNomeChange = (valor: string) => {
    setNome(valor)
    if (!slugEditadoManualmente) {
      setSlug(slugify(valor))
    }
  }

  const handleCriar = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!nome.trim() || !slug.trim()) {
      toast({ title: "Preencha nome e identificador", variant: "destructive" })
      return
    }

    setSalvando(true)
    try {
      await criarTenant({ nome, slug })
      toast({ title: "Carteira criada" })
      setOpen(false)
      setNome("")
      setSlug("")
      setSlugEditadoManualmente(false)
      recarregar()
    } catch (error) {
      toast({
        title: "Erro ao criar carteira",
        description: error instanceof Error ? error.message : "Tente novamente",
        variant: "destructive",
      })
    } finally {
      setSalvando(false)
    }
  }

  const handleToggle = async (carteira: Carteira) => {
    try {
      if (carteira.ativo) {
        await desativarTenant(carteira.id)
        toast({ title: "Carteira desativada" })
      } else {
        await ativarTenant(carteira.id)
        toast({ title: "Carteira ativada" })
      }
      recarregar()
    } catch {
      toast({ title: "Erro ao atualizar carteira", variant: "destructive" })
    }
  }

  return (
    <div>
      <div className="flex justify-end mb-4">
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Nova carteira
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Nova carteira</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleCriar} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="nome">Nome</Label>
                <Input id="nome" value={nome} onChange={(e) => handleNomeChange(e.target.value)} required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="slug">Identificador</Label>
                <Input
                  id="slug"
                  value={slug}
                  onChange={(e) => {
                    setSlug(e.target.value)
                    setSlugEditadoManualmente(true)
                  }}
                  required
                />
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                  Cancelar
                </Button>
                <Button type="submit" disabled={salvando}>
                  {salvando && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Criar
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {carteiras.length === 0 ? (
        <EmptyState title="Nenhuma carteira ainda" description="Crie a primeira carteira para começar." />
      ) : (
        <div className="space-y-2">
          {carteiras.map((carteira) => (
            <Card key={carteira.id}>
              <CardContent className="p-4 flex items-center justify-between gap-4">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="font-medium text-foreground truncate">{carteira.nome}</p>
                    <span
                      className={`inline-flex items-center rounded-control px-2 py-0.5 text-xs font-medium ${
                        carteira.ativo ? "bg-success-subtle text-success" : "bg-danger-subtle text-danger"
                      }`}
                    >
                      {carteira.ativo ? "Ativa" : "Inativa"}
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {carteira.slug} · {carteira.total_colaboradores} colaborador
                    {carteira.total_colaboradores === 1 ? "" : "es"}
                  </p>
                </div>

                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon">
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => handleToggle(carteira)}>
                      {carteira.ativo ? (
                        <>
                          <PowerOff className="mr-2 h-4 w-4" />
                          Desativar
                        </>
                      ) : (
                        <>
                          <Power className="mr-2 h-4 w-4" />
                          Ativar
                        </>
                      )}
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
