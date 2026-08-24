"use client"

import { useEffect, useState } from "react"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu"
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
import { CategoriaAtualizacaoBadge } from "@/components/categoria-atualizacao-badge"
import { AtualizacaoFormDialog } from "@/components/atualizacao-form-dialog"
import {
  listarAtualizacoesAdmin,
  ativarAtualizacao,
  desativarAtualizacao,
  excluirAtualizacao,
  duplicarAtualizacao,
  contarDestinatariosAtualizacao,
  enviarEmailDaAtualizacao,
  type FiltroAtualizacaoAdmin,
} from "@/app/actions/atualizacoes"
import { useToast } from "@/hooks/use-toast"
import { Plus, MoreVertical, Pencil, Copy, Power, PowerOff, Trash2, Mail, Send } from "lucide-react"
import type { Atualizacao } from "@/types/atualizacao"

type Row = Atualizacao & { status_exibicao: string }

const TABS: { value: FiltroAtualizacaoAdmin; label: string }[] = [
  { value: "publicadas", label: "Publicadas" },
  { value: "rascunhos", label: "Rascunhos" },
  { value: "agendadas", label: "Agendadas" },
  { value: "desativadas", label: "Desativadas" },
]

const STATUS_CLASSES: Record<string, string> = {
  Ativa: "bg-success-subtle text-success",
  Rascunho: "bg-neutral-state-subtle text-neutral-state",
  Agendada: "bg-warning-subtle text-warning",
  Expirada: "bg-danger-subtle text-danger",
  Desativada: "bg-danger-subtle text-danger",
}

export function AtualizacoesAdminList() {
  const { toast } = useToast()
  const [aba, setAba] = useState<FiltroAtualizacaoAdmin>("publicadas")
  const [linhas, setLinhas] = useState<Row[]>([])
  const [carregando, setCarregando] = useState(true)
  const [formOpen, setFormOpen] = useState(false)
  const [editando, setEditando] = useState<Atualizacao | null>(null)
  const [excluirId, setExcluirId] = useState<string | null>(null)
  const [enviandoId, setEnviandoId] = useState<string | null>(null)
  const [confirmEnvio, setConfirmEnvio] = useState<{ id: string; titulo: string; contagem: number } | null>(null)

  const carregar = async (filtro: FiltroAtualizacaoAdmin) => {
    setCarregando(true)
    try {
      const dados = await listarAtualizacoesAdmin(filtro)
      setLinhas(dados as Row[])
    } catch {
      toast({ title: "Erro ao carregar atualizações", variant: "destructive" })
    } finally {
      setCarregando(false)
    }
  }

  useEffect(() => {
    carregar(aba)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [aba])

  const handleNova = () => {
    setEditando(null)
    setFormOpen(true)
  }

  const handleEditar = (row: Row) => {
    setEditando(row)
    setFormOpen(true)
  }

  const handleDuplicar = async (id: string) => {
    try {
      await duplicarAtualizacao(id)
      toast({ title: "Atualização duplicada como rascunho" })
      carregar(aba)
    } catch {
      toast({ title: "Erro ao duplicar", variant: "destructive" })
    }
  }

  const handleAtivar = async (id: string) => {
    try {
      await ativarAtualizacao(id)
      toast({ title: "Atualização publicada" })
      carregar(aba)
    } catch {
      toast({ title: "Erro ao publicar", variant: "destructive" })
    }
  }

  const handleDesativar = async (id: string) => {
    try {
      await desativarAtualizacao(id)
      toast({ title: "Atualização desativada" })
      carregar(aba)
    } catch {
      toast({ title: "Erro ao desativar", variant: "destructive" })
    }
  }

  const handleExcluirConfirmado = async () => {
    if (!excluirId) return
    try {
      await excluirAtualizacao(excluirId)
      toast({ title: "Atualização removida" })
      carregar(aba)
    } catch {
      toast({ title: "Erro ao excluir", variant: "destructive" })
    } finally {
      setExcluirId(null)
    }
  }

  const handleAbrirEnvio = async (row: Row) => {
    const contagem = await contarDestinatariosAtualizacao({ tenantId: row.tenant_id, roles: row.roles })
    setConfirmEnvio({ id: row.id, titulo: row.titulo, contagem })
  }

  const handleConfirmarEnvio = async () => {
    if (!confirmEnvio) return
    setEnviandoId(confirmEnvio.id)
    try {
      const resultado = await enviarEmailDaAtualizacao(confirmEnvio.id)
      toast({
        title: "E-mails processados",
        description: `${resultado.enviados} enviados, ${resultado.pulados} pulados, ${resultado.falhados} falharam.`,
      })
    } catch {
      toast({ title: "Erro ao enviar e-mails", variant: "destructive" })
    } finally {
      setEnviandoId(null)
      setConfirmEnvio(null)
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4 gap-4 flex-wrap">
        <Tabs value={aba} onValueChange={(v) => setAba(v as FiltroAtualizacaoAdmin)}>
          <TabsList>
            {TABS.map((t) => (
              <TabsTrigger key={t.value} value={t.value}>
                {t.label}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
        <Button onClick={handleNova}>
          <Plus className="mr-2 h-4 w-4" />
          Nova atualização
        </Button>
      </div>

      {carregando ? (
        <div className="text-sm text-muted-foreground">Carregando...</div>
      ) : linhas.length === 0 ? (
        <EmptyState title="Nada por aqui" description="Nenhuma atualização nesta categoria ainda." />
      ) : (
        <div className="space-y-2">
          {linhas.map((row) => (
            <Card key={row.id}>
              <CardContent className="p-4 flex items-start justify-between gap-4">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <CategoriaAtualizacaoBadge categoria={row.categoria} />
                    <span
                      className={`inline-flex items-center rounded-control px-2 py-0.5 text-xs font-medium ${
                        STATUS_CLASSES[row.status_exibicao] || "bg-neutral-state-subtle text-neutral-state"
                      }`}
                    >
                      {row.status_exibicao}
                    </span>
                  </div>
                  <p className="font-medium text-foreground mt-2 truncate">{row.titulo}</p>
                  <p className="text-sm text-muted-foreground truncate">{row.descricao}</p>
                  <p className="text-xs text-text-tertiary mt-1">
                    {row.roles && row.roles.length > 0 ? row.roles.join(", ") : "Todos os papéis"}
                    {" · "}
                    {row.enviar_email ? "Com e-mail" : "Só plataforma"}
                  </p>
                </div>

                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon">
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => handleEditar(row)}>
                      <Pencil className="mr-2 h-4 w-4" />
                      Editar
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleDuplicar(row.id)}>
                      <Copy className="mr-2 h-4 w-4" />
                      Duplicar
                    </DropdownMenuItem>
                    {row.status_exibicao !== "Ativa" && row.status_exibicao !== "Agendada" && (
                      <DropdownMenuItem onClick={() => handleAtivar(row.id)}>
                        <Power className="mr-2 h-4 w-4" />
                        Ativar
                      </DropdownMenuItem>
                    )}
                    {(row.status_exibicao === "Ativa" || row.status_exibicao === "Agendada") && (
                      <DropdownMenuItem onClick={() => handleDesativar(row.id)}>
                        <PowerOff className="mr-2 h-4 w-4" />
                        Desativar
                      </DropdownMenuItem>
                    )}
                    {row.enviar_email && (
                      <DropdownMenuItem onClick={() => handleAbrirEnvio(row)} disabled={enviandoId === row.id}>
                        <Mail className="mr-2 h-4 w-4" />
                        Enviar e-mail
                      </DropdownMenuItem>
                    )}
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={() => setExcluirId(row.id)} className="text-danger">
                      <Trash2 className="mr-2 h-4 w-4" />
                      Excluir
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <AtualizacaoFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        atualizacao={editando}
        onSaved={() => carregar(aba)}
      />

      <AlertDialog open={!!excluirId} onOpenChange={(open) => !open && setExcluirId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir atualização?</AlertDialogTitle>
            <AlertDialogDescription>
              Se ainda não foi publicada, é removida de vez. Se já foi publicada, fica desativada — o histórico é
              mantido.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleExcluirConfirmado}>Confirmar</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={!!confirmEnvio} onOpenChange={(open) => !open && setConfirmEnvio(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Enviar &quot;{confirmEnvio?.titulo}&quot; por e-mail?</AlertDialogTitle>
            <AlertDialogDescription>
              Será enviado para {confirmEnvio?.contagem} usuário{confirmEnvio?.contagem === 1 ? "" : "s"}. Quem já
              recebeu não recebe de novo.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmarEnvio}>
              <Send className="mr-2 h-4 w-4" />
              Enviar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
