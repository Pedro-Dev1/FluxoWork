"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"
import { Switch } from "@/components/ui/switch"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Loader2 } from "lucide-react"
import { criarAtualizacao, atualizarAtualizacao, listarTenantsParaSelecao } from "@/app/actions/atualizacoes"
import { useToast } from "@/hooks/use-toast"
import type { Atualizacao, CategoriaAtualizacao, NovaAtualizacao } from "@/types/atualizacao"

const CATEGORIAS: CategoriaAtualizacao[] = [
  "NOVA FUNCIONALIDADE",
  "MELHORIA",
  "IMPORTANTE",
  "AVISO",
  "FINANCEIRO",
  "AÇÃO NECESSÁRIA",
  "INFORMATIVO",
]

const PAPEIS = ["Adm", "Financeiro", "Gerente", "Supervisor", "Colaborador"]

function paraInputDatetime(iso: string | null | undefined): string {
  if (!iso) return ""
  const d = new Date(iso)
  const pad = (n: number) => String(n).padStart(2, "0")
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
}

interface AtualizacaoFormDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  atualizacao?: Atualizacao | null
  onSaved: () => void
}

export function AtualizacaoFormDialog({ open, onOpenChange, atualizacao, onSaved }: AtualizacaoFormDialogProps) {
  const { toast } = useToast()
  const [salvando, setSalvando] = useState(false)
  const [tenants, setTenants] = useState<{ id: string; nome: string }[]>([])

  const [form, setForm] = useState<NovaAtualizacao>({
    titulo: "",
    subtitulo: "",
    descricao: "",
    categoria: "INFORMATIVO",
    imagem_url: "",
    cta_texto: "",
    cta_url: "",
    destaque: false,
    exibir_na_plataforma: true,
    enviar_email: false,
    publish_at: null,
    expires_at: null,
    tenant_id: null,
    roles: [],
  })

  useEffect(() => {
    if (!open) return
    listarTenantsParaSelecao()
      .then(setTenants)
      .catch(() => {})
  }, [open])

  useEffect(() => {
    if (!open) return
    if (atualizacao) {
      setForm({
        titulo: atualizacao.titulo,
        subtitulo: atualizacao.subtitulo || "",
        descricao: atualizacao.descricao,
        categoria: atualizacao.categoria,
        imagem_url: atualizacao.imagem_url || "",
        cta_texto: atualizacao.cta_texto || "",
        cta_url: atualizacao.cta_url || "",
        destaque: atualizacao.destaque,
        exibir_na_plataforma: atualizacao.exibir_na_plataforma,
        enviar_email: atualizacao.enviar_email,
        publish_at: atualizacao.publish_at,
        expires_at: atualizacao.expires_at,
        tenant_id: atualizacao.tenant_id,
        roles: atualizacao.roles || [],
      })
    } else {
      setForm({
        titulo: "",
        subtitulo: "",
        descricao: "",
        categoria: "INFORMATIVO",
        imagem_url: "",
        cta_texto: "",
        cta_url: "",
        destaque: false,
        exibir_na_plataforma: true,
        enviar_email: false,
        publish_at: null,
        expires_at: null,
        tenant_id: null,
        roles: [],
      })
    }
  }, [open, atualizacao])

  const togglePapel = (papel: string) => {
    setForm((prev) => {
      const atual = prev.roles || []
      return { ...prev, roles: atual.includes(papel) ? atual.filter((r) => r !== papel) : [...atual, papel] }
    })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!form.titulo.trim() || !form.descricao.trim()) {
      toast({ title: "Preencha título e descrição", variant: "destructive" })
      return
    }

    setSalvando(true)
    try {
      if (atualizacao) {
        await atualizarAtualizacao(atualizacao.id, form)
        toast({ title: "Atualização salva" })
      } else {
        await criarAtualizacao(form)
        toast({ title: "Atualização criada como rascunho" })
      }
      onOpenChange(false)
      onSaved()
    } catch (error) {
      toast({
        title: "Erro ao salvar",
        description: error instanceof Error ? error.message : "Tente novamente",
        variant: "destructive",
      })
    } finally {
      setSalvando(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>{atualizacao ? "Editar atualização" : "Nova atualização"}</DialogTitle>
          <DialogDescription>Conteúdo exibido em /atualizacoes e, se marcado, enviado por e-mail.</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="flex-1 overflow-hidden flex flex-col">
          <ScrollArea className="flex-1 pr-4">
            <div className="space-y-4 pb-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="titulo">Título *</Label>
                  <Input
                    id="titulo"
                    value={form.titulo}
                    onChange={(e) => setForm((p) => ({ ...p, titulo: e.target.value }))}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="categoria">Categoria *</Label>
                  <Select
                    value={form.categoria}
                    onValueChange={(v) => setForm((p) => ({ ...p, categoria: v as CategoriaAtualizacao }))}
                  >
                    <SelectTrigger id="categoria">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {CATEGORIAS.map((c) => (
                        <SelectItem key={c} value={c}>
                          {c}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="subtitulo">Subtítulo</Label>
                <Input
                  id="subtitulo"
                  value={form.subtitulo}
                  onChange={(e) => setForm((p) => ({ ...p, subtitulo: e.target.value }))}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="descricao">Descrição *</Label>
                <Textarea
                  id="descricao"
                  rows={4}
                  value={form.descricao}
                  onChange={(e) => setForm((p) => ({ ...p, descricao: e.target.value }))}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="imagem_url">URL da imagem (opcional)</Label>
                <Input
                  id="imagem_url"
                  value={form.imagem_url}
                  onChange={(e) => setForm((p) => ({ ...p, imagem_url: e.target.value }))}
                  placeholder="https://..."
                />
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="cta_texto">Texto do botão (CTA)</Label>
                  <Input
                    id="cta_texto"
                    value={form.cta_texto}
                    onChange={(e) => setForm((p) => ({ ...p, cta_texto: e.target.value }))}
                    placeholder="Ex: Saiba mais"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="cta_url">Link do botão</Label>
                  <Input
                    id="cta_url"
                    value={form.cta_url}
                    onChange={(e) => setForm((p) => ({ ...p, cta_url: e.target.value }))}
                    placeholder="/caminho ou https://..."
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Público</Label>
                <div className="border rounded-lg p-3 flex flex-wrap gap-4">
                  {PAPEIS.map((papel) => (
                    <div key={papel} className="flex items-center space-x-2">
                      <Checkbox
                        id={`papel-${papel}`}
                        checked={(form.roles || []).includes(papel)}
                        onCheckedChange={() => togglePapel(papel)}
                      />
                      <label htmlFor={`papel-${papel}`} className="text-sm cursor-pointer">
                        {papel}
                      </label>
                    </div>
                  ))}
                </div>
                <p className="text-xs text-muted-foreground">Nenhum papel marcado = visível para todos os papéis.</p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="tenant">Carteira</Label>
                <Select
                  value={form.tenant_id ?? "todas"}
                  onValueChange={(v) => setForm((p) => ({ ...p, tenant_id: v === "todas" ? null : v }))}
                >
                  <SelectTrigger id="tenant">
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
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="publish_at">Publicar em (opcional)</Label>
                  <Input
                    id="publish_at"
                    type="datetime-local"
                    value={paraInputDatetime(form.publish_at)}
                    onChange={(e) =>
                      setForm((p) => ({ ...p, publish_at: e.target.value ? new Date(e.target.value).toISOString() : null }))
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="expires_at">Expira em (opcional)</Label>
                  <Input
                    id="expires_at"
                    type="datetime-local"
                    value={paraInputDatetime(form.expires_at)}
                    onChange={(e) =>
                      setForm((p) => ({ ...p, expires_at: e.target.value ? new Date(e.target.value).toISOString() : null }))
                    }
                  />
                </div>
              </div>

              <div className="space-y-3 border rounded-lg p-3">
                <div className="flex items-center justify-between">
                  <Label htmlFor="exibir" className="cursor-pointer">
                    Exibir na plataforma
                  </Label>
                  <Switch
                    id="exibir"
                    checked={form.exibir_na_plataforma}
                    onCheckedChange={(v) => setForm((p) => ({ ...p, exibir_na_plataforma: v }))}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <Label htmlFor="enviar_email" className="cursor-pointer">
                    Enviar por e-mail
                  </Label>
                  <Switch
                    id="enviar_email"
                    checked={form.enviar_email}
                    onCheckedChange={(v) => setForm((p) => ({ ...p, enviar_email: v }))}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <Label htmlFor="destaque" className="cursor-pointer">
                    Destaque (banner no dashboard)
                  </Label>
                  <Switch
                    id="destaque"
                    checked={form.destaque}
                    onCheckedChange={(v) => setForm((p) => ({ ...p, destaque: v }))}
                  />
                </div>
              </div>
            </div>
          </ScrollArea>

          <DialogFooter className="pt-4 border-t">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={salvando}>
              {salvando && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {atualizacao ? "Salvar" : "Criar rascunho"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
