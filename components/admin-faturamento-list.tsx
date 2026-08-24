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
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { EmptyState } from "@/components/ui/empty-state"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Settings2, MoreVertical, Loader2, FileText, Send, ExternalLink } from "lucide-react"
import {
  atualizarConfiguracaoFaturamento,
  gerarFaturaManual,
  listarConfiguracaoFaturamento,
  listarFaturasPlataforma,
  reenviarEmailFatura,
} from "@/app/actions/faturamento"
import { useToast } from "@/hooks/use-toast"
import type { CarteiraFaturamento, FaturaPlataforma } from "@/types/fatura-plataforma"

type Fatura = FaturaPlataforma & { tenant: { nome: string } | null }

const MOEDA = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" })
const MESES = [
  "Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez",
]

const STATUS_LABEL: Record<string, string> = {
  pendente: "Pendente",
  emitida: "Aguardando pagamento",
  paga: "Paga",
  falhou: "Falhou",
  cancelada: "Cancelada",
  vencida: "Vencida",
}

const STATUS_CLASS: Record<string, string> = {
  pendente: "bg-warning-subtle text-warning",
  emitida: "bg-accent text-primary",
  paga: "bg-success-subtle text-success",
  falhou: "bg-danger-subtle text-danger",
  cancelada: "bg-muted text-muted-foreground",
  vencida: "bg-danger-subtle text-danger",
}

function formatarData(data: string | null): string {
  if (!data) return "—"
  return new Date(`${data}T00:00:00`).toLocaleDateString("pt-BR")
}

export function AdminFaturamentoList({
  carteirasIniciais,
  faturasIniciais,
}: {
  carteirasIniciais: CarteiraFaturamento[]
  faturasIniciais: Fatura[]
}) {
  const { toast } = useToast()
  const [carteiras, setCarteiras] = useState(carteirasIniciais)
  const [faturas, setFaturas] = useState(faturasIniciais)

  const [carteiraConfig, setCarteiraConfig] = useState<CarteiraFaturamento | null>(null)
  const [salvandoConfig, setSalvandoConfig] = useState(false)
  const [form, setForm] = useState({
    valorPorUsuarioAtivo: "",
    diaFaturamento: "",
    documento: "",
    emailFaturamento: "",
    telefoneFaturamento: "",
  })

  const [carteiraGerar, setCarteiraGerar] = useState<CarteiraFaturamento | null>(null)
  const [gerando, setGerando] = useState(false)
  const [reenviando, setReenviando] = useState<string | null>(null)

  const recarregar = async () => {
    try {
      const [novasCarteiras, novasFaturas] = await Promise.all([
        listarConfiguracaoFaturamento(),
        listarFaturasPlataforma(),
      ])
      setCarteiras(novasCarteiras)
      setFaturas(novasFaturas)
    } catch {}
  }

  const abrirConfig = (carteira: CarteiraFaturamento) => {
    setCarteiraConfig(carteira)
    setForm({
      valorPorUsuarioAtivo: carteira.valor_por_usuario_ativo?.toString() || "",
      diaFaturamento: carteira.dia_faturamento?.toString() || "",
      documento: carteira.documento || "",
      emailFaturamento: carteira.email_faturamento || "",
      telefoneFaturamento: carteira.telefone_faturamento || "",
    })
  }

  const handleSalvarConfig = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!carteiraConfig) return

    setSalvandoConfig(true)
    try {
      await atualizarConfiguracaoFaturamento(carteiraConfig.id, {
        valorPorUsuarioAtivo: Number(form.valorPorUsuarioAtivo),
        diaFaturamento: Number(form.diaFaturamento),
        documento: form.documento,
        emailFaturamento: form.emailFaturamento || null,
        telefoneFaturamento: form.telefoneFaturamento || null,
      })
      toast({ title: "Faturamento configurado" })
      setCarteiraConfig(null)
      recarregar()
    } catch (error) {
      toast({
        title: "Erro ao salvar configuração",
        description: error instanceof Error ? error.message : "Tente novamente",
        variant: "destructive",
      })
    } finally {
      setSalvandoConfig(false)
    }
  }

  const handleGerarFatura = async () => {
    if (!carteiraGerar) return
    setGerando(true)
    try {
      await gerarFaturaManual(carteiraGerar.id)
      toast({ title: `Fatura gerada para ${carteiraGerar.nome}` })
      setCarteiraGerar(null)
      recarregar()
    } catch (error) {
      toast({
        title: "Erro ao gerar fatura",
        description: error instanceof Error ? error.message : "Tente novamente",
        variant: "destructive",
      })
    } finally {
      setGerando(false)
    }
  }

  const handleReenviar = async (faturaId: string) => {
    setReenviando(faturaId)
    try {
      await reenviarEmailFatura(faturaId)
      toast({ title: "E-mail reenviado" })
    } catch (error) {
      toast({
        title: "Erro ao reenviar e-mail",
        description: error instanceof Error ? error.message : "Tente novamente",
        variant: "destructive",
      })
    } finally {
      setReenviando(null)
    }
  }

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-sm font-medium text-foreground mb-3">Carteiras</h2>

        {carteiras.length === 0 ? (
          <EmptyState title="Nenhuma carteira ainda" description="Crie uma carteira em /admin/carteiras primeiro." />
        ) : (
          <div className="space-y-2">
            {carteiras.map((carteira) => {
              const configurado = carteira.valor_por_usuario_ativo != null && carteira.dia_faturamento != null && carteira.documento != null
              const estimativa = carteira.usuarios_ativos * (carteira.valor_por_usuario_ativo || 0)

              return (
                <Card key={carteira.id}>
                  <CardContent className="p-4 flex items-center justify-between gap-4">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="font-medium text-foreground truncate">{carteira.nome}</p>
                        <span
                          className={`inline-flex items-center rounded-control px-2 py-0.5 text-xs font-medium ${
                            configurado ? "bg-success-subtle text-success" : "bg-warning-subtle text-warning"
                          }`}
                        >
                          {configurado ? "Configurado" : "Pendente configuração"}
                        </span>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {carteira.usuarios_ativos} usuário{carteira.usuarios_ativos === 1 ? "" : "s"} ativo
                        {carteira.usuarios_ativos === 1 ? "" : "s"}
                        {carteira.dia_faturamento ? ` · dia ${carteira.dia_faturamento} de cada mês` : ""}
                      </p>
                    </div>

                    <div className="flex items-center gap-4 shrink-0">
                      {configurado && (
                        <div className="text-right">
                          <p className="text-xs text-muted-foreground">Próxima fatura</p>
                          <p className="font-medium text-foreground tabular-nums">{MOEDA.format(estimativa)}</p>
                        </div>
                      )}

                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => abrirConfig(carteira)}>
                            <Settings2 className="mr-2 h-4 w-4" />
                            Configurar faturamento
                          </DropdownMenuItem>
                          <DropdownMenuItem disabled={!configurado} onClick={() => setCarteiraGerar(carteira)}>
                            <FileText className="mr-2 h-4 w-4" />
                            Gerar fatura agora
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        )}
      </div>

      <div>
        <h2 className="text-sm font-medium text-foreground mb-3">Faturas emitidas</h2>

        {faturas.length === 0 ? (
          <EmptyState title="Nenhuma fatura ainda" description="Faturas geradas manualmente ou pelo agendamento mensal aparecem aqui." />
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Carteira</TableHead>
                  <TableHead>Referência</TableHead>
                  <TableHead>Usuários</TableHead>
                  <TableHead className="text-right">Valor</TableHead>
                  <TableHead>Vencimento</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Boleto</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {faturas.map((fatura) => (
                  <TableRow key={fatura.id}>
                    <TableCell>{fatura.tenant?.nome || "—"}</TableCell>
                    <TableCell className="tabular-nums">
                      {MESES[fatura.referencia_mes - 1]}/{fatura.referencia_ano}
                    </TableCell>
                    <TableCell className="tabular-nums">{fatura.quantidade_usuarios_ativos}</TableCell>
                    <TableCell className="text-right tabular-nums">{MOEDA.format(fatura.valor_total)}</TableCell>
                    <TableCell className="whitespace-nowrap tabular-nums">{formatarData(fatura.data_vencimento)}</TableCell>
                    <TableCell>
                      <span className={`inline-flex items-center rounded-control px-2 py-0.5 text-xs font-medium ${STATUS_CLASS[fatura.status]}`}>
                        {STATUS_LABEL[fatura.status] || fatura.status}
                      </span>
                      {fatura.erro_mensagem && (
                        <p className="text-xs text-danger mt-1 max-w-xs">{fatura.erro_mensagem}</p>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      {fatura.boleto_url ? (
                        <div className="flex items-center justify-end gap-1">
                          <Button variant="ghost" size="icon" asChild>
                            <a href={fatura.boleto_url} target="_blank" rel="noopener noreferrer" title="Ver boleto">
                              <ExternalLink className="h-4 w-4" />
                            </a>
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            title="Reenviar e-mail"
                            disabled={reenviando === fatura.id}
                            onClick={() => handleReenviar(fatura.id)}
                          >
                            {reenviando === fatura.id ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <Send className="h-4 w-4" />
                            )}
                          </Button>
                        </div>
                      ) : (
                        "—"
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </div>

      <Dialog open={!!carteiraConfig} onOpenChange={(open) => !open && setCarteiraConfig(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Configurar faturamento — {carteiraConfig?.nome}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSalvarConfig} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="valor">Valor por usuário ativo (R$)</Label>
                <Input
                  id="valor"
                  type="number"
                  step="0.01"
                  min="0.01"
                  value={form.valorPorUsuarioAtivo}
                  onChange={(e) => setForm((p) => ({ ...p, valorPorUsuarioAtivo: e.target.value }))}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="dia">Dia do mês</Label>
                <Input
                  id="dia"
                  type="number"
                  min="1"
                  max="28"
                  value={form.diaFaturamento}
                  onChange={(e) => setForm((p) => ({ ...p, diaFaturamento: e.target.value }))}
                  required
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="documento">CNPJ do cliente</Label>
              <Input
                id="documento"
                value={form.documento}
                onChange={(e) => setForm((p) => ({ ...p, documento: e.target.value }))}
                placeholder="00.000.000/0000-00"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">E-mail de cobrança (opcional)</Label>
              <Input
                id="email"
                type="email"
                value={form.emailFaturamento}
                onChange={(e) => setForm((p) => ({ ...p, emailFaturamento: e.target.value }))}
                placeholder="Se vazio, usa o e-mail do Adm da carteira"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="telefone">Telefone de cobrança (opcional)</Label>
              <Input
                id="telefone"
                value={form.telefoneFaturamento}
                onChange={(e) => setForm((p) => ({ ...p, telefoneFaturamento: e.target.value }))}
                placeholder="11999999999"
              />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setCarteiraConfig(null)}>
                Cancelar
              </Button>
              <Button type="submit" disabled={salvandoConfig}>
                {salvandoConfig && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Salvar
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!carteiraGerar} onOpenChange={(open) => !open && setCarteiraGerar(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Gerar fatura para {carteiraGerar?.nome}?</AlertDialogTitle>
            <AlertDialogDescription>
              Isso emite um boleto real via Pagar.me cobrando o cliente pelos usuários ativos deste mês. Essa ação
              não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={gerando}>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleGerarFatura} disabled={gerando}>
              {gerando && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Gerar fatura
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
