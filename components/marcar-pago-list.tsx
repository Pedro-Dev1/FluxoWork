"use client"

import { Fragment, useEffect, useMemo, useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableFooter, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import {
  Download,
  Search,
  X,
  Check,
  XIcon,
  CreditCard,
  ChevronDown,
  ChevronUp,
} from "lucide-react"
import type { PedidoPagamento } from "@/types/pedido"
import { useRouter } from "next/navigation"
import { listarEquipes } from "@/app/actions/equipes"
import { aprovarNotaFiscal, recusarNotaFiscal, marcarPedidoPago } from "@/app/actions/pedidos"
import type { Equipe } from "@/types/equipe"
import { useMaskedCurrency } from "@/components/currency-display"
import { useSystemStatus } from "./system-status-provider"
import { SystemSuspendedDialog } from "./system-suspended-dialog"
import { SimplePager } from "@/components/ui/simple-pager"
import { toast } from "sonner"
import { PedidoComposicao } from "./pedido-composicao"

interface MarcarPagoListProps {
  pedidos: PedidoPagamento[]
}

function composicaoDe(pedido: PedidoPagamento) {
  const isReembolsoKm = pedido.tipo_pedido === "reembolso_km"
  const valorNF = isReembolsoKm
    ? pedido.valor_km
    : (pedido.salario_base ?? pedido.colaborador?.salario ?? 0) +
      (pedido.horas_extras || 0) +
      (pedido.valor_plantao || 0) +
      (pedido.comissao || 0) -
      (pedido.valor_desconto || 0)
  return { isReembolsoKm, valorNF }
}

export function MarcarPagoList({ pedidos }: MarcarPagoListProps) {
  const router = useRouter()
  const { formatValue } = useMaskedCurrency()
  const { isSystemSuspended, suspensionReason } = useSystemStatus()
  const [suspendedDialogOpen, setSuspendedDialogOpen] = useState(false)
  const [equipes, setEquipes] = useState<Equipe[]>([])
  const [approvingId, setApprovingId] = useState<string | null>(null)
  const [rejectingId, setRejectingId] = useState<string | null>(null)
  const [payingId, setPayingId] = useState<string | null>(null)
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [recusarAlvo, setRecusarAlvo] = useState<string | null>(null)
  const [motivoRecusa, setMotivoRecusa] = useState("")
  const [confirmAlvo, setConfirmAlvo] = useState<{ pedido: PedidoPagamento; tipo: "aprovar-nota" | "marcar-pago" } | null>(null)
  const [showFilters, setShowFilters] = useState(false)
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(25)

  const [busca, setBusca] = useState("")
  const [equipeFiltro, setEquipeFiltro] = useState("todas")

  useEffect(() => {
    listarEquipes().then(setEquipes).catch(console.error)
  }, [])

  const filtrosAtivos = !!busca || equipeFiltro !== "todas"

  const filteredPedidos = useMemo(() => {
    let result = pedidos
    if (busca) {
      const q = busca.toLowerCase()
      result = result.filter((p) => p.colaborador?.nome_completo?.toLowerCase().includes(q))
    }
    if (equipeFiltro !== "todas") {
      result = result.filter((p) => (p.colaborador as any)?.equipe_id === equipeFiltro)
    }
    return result
  }, [pedidos, busca, equipeFiltro])

  useEffect(() => {
    setPage(1)
  }, [busca, equipeFiltro, pageSize])

  const pagedPedidos = filteredPedidos.slice((page - 1) * pageSize, page * pageSize)

  const totalFiltrado = filteredPedidos.reduce((s, p) => s + p.valor_total, 0)

  const limparFiltros = () => {
    setBusca("")
    setEquipeFiltro("todas")
  }

  const handleAprovarNota = (pedido: PedidoPagamento) => {
    if (isSystemSuspended) {
      setSuspendedDialogOpen(true)
      return
    }
    setConfirmAlvo({ pedido, tipo: "aprovar-nota" })
  }

  const executarAprovarNota = async (pedidoId: string) => {
    try {
      setApprovingId(pedidoId)
      await aprovarNotaFiscal(pedidoId)
      toast.success("Nota fiscal marcada como recebida")
      router.refresh()
    } catch (error) {
      console.error("[v0] Erro ao aprovar nota:", error)
      toast.error(error instanceof Error ? error.message : "Erro ao aprovar nota fiscal")
    } finally {
      setApprovingId(null)
    }
  }

  const handleRecusarNota = async () => {
    if (!recusarAlvo) return
    const motivo = motivoRecusa.trim()
    if (!motivo) {
      toast.error("Por favor, informe o motivo da recusa")
      return
    }
    try {
      setRejectingId(recusarAlvo)
      await recusarNotaFiscal(recusarAlvo, motivo)
      toast.success("Nota fiscal recusada")
      setMotivoRecusa("")
      setRecusarAlvo(null)
      router.refresh()
    } catch (error) {
      console.error("[v0] Erro ao recusar nota:", error)
      toast.error(error instanceof Error ? error.message : "Erro ao recusar nota fiscal")
    } finally {
      setRejectingId(null)
    }
  }

  const handleMarcarPago = (pedido: PedidoPagamento) => {
    if (isSystemSuspended) {
      setSuspendedDialogOpen(true)
      return
    }
    setConfirmAlvo({ pedido, tipo: "marcar-pago" })
  }

  const executarMarcarPago = async (pedidoId: string) => {
    try {
      setPayingId(pedidoId)
      await marcarPedidoPago(pedidoId)
      toast.success("Pedido marcado como pago")
      router.refresh()
    } catch (error) {
      console.error("[v0] Erro ao marcar como pago:", error)
      toast.error(error instanceof Error ? error.message : "Erro ao marcar pedido como pago")
    } finally {
      setPayingId(null)
    }
  }

  const confirmarAcao = async () => {
    if (!confirmAlvo) return
    if (confirmAlvo.tipo === "aprovar-nota") {
      await executarAprovarNota(confirmAlvo.pedido.id)
    } else {
      await executarMarcarPago(confirmAlvo.pedido.id)
    }
    setConfirmAlvo(null)
  }

  if (pedidos.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <p className="text-sm font-medium text-foreground mb-1">Nenhum pedido aguardando pagamento</p>
        <p className="text-sm text-text-tertiary">
          Todos os pedidos com nota fiscal já foram pagos ou não há pedidos com nota anexada.
        </p>
      </div>
    )
  }

  return (
    <div>
      <SystemSuspendedDialog open={suspendedDialogOpen} onOpenChange={setSuspendedDialogOpen} reason={suspensionReason} />

      <Dialog open={!!recusarAlvo} onOpenChange={(open) => !open && setRecusarAlvo(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Recusar nota fiscal</DialogTitle>
          </DialogHeader>
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-text-secondary">Motivo da recusa</label>
            <Textarea
              value={motivoRecusa}
              onChange={(e) => setMotivoRecusa(e.target.value)}
              placeholder="Ex: valor da nota incorreto, dados divergentes..."
              rows={3}
              autoFocus
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRecusarAlvo(null)}>
              Cancelar
            </Button>
            <Button
              variant="destructive"
              onClick={handleRecusarNota}
              disabled={rejectingId === recusarAlvo}
            >
              {rejectingId === recusarAlvo ? "Recusando..." : "Confirmar recusa"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!confirmAlvo} onOpenChange={(open) => !open && setConfirmAlvo(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {confirmAlvo?.tipo === "aprovar-nota" ? "Marcar nota como recebida" : "Marcar pedido como pago"}
            </DialogTitle>
          </DialogHeader>
          {confirmAlvo && (
            <div className="space-y-3">
              <div className="flex items-center justify-between rounded-control bg-surface px-3 py-2">
                <p className="text-sm font-medium text-foreground">{confirmAlvo.pedido.colaborador?.nome_completo || "Colaborador"}</p>
                <p className="text-lg font-semibold tabular-nums text-foreground">{formatValue(confirmAlvo.pedido.valor_total)}</p>
              </div>
              <PedidoComposicao pedido={confirmAlvo.pedido} />
              <p className="text-sm text-text-secondary">
                {confirmAlvo.tipo === "aprovar-nota"
                  ? "Confirma que a nota fiscal deste pedido foi recebida e conferida?"
                  : "Confirma que este pedido foi pago?"}
              </p>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmAlvo(null)}>
              Cancelar
            </Button>
            <Button
              onClick={confirmarAcao}
              disabled={confirmAlvo ? (confirmAlvo.tipo === "aprovar-nota" ? approvingId : payingId) === confirmAlvo.pedido.id : false}
            >
              Confirmar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Filtros — pílulas com valor no rótulo, painel expandido só quando necessário */}
      <div className="flex flex-wrap items-center gap-2 mb-4">
        <Button variant="outline" size="sm" className="h-8 rounded-control" onClick={() => setShowFilters(!showFilters)}>
          <Search className="h-3.5 w-3.5 mr-1.5" />
          {busca ? `Colaborador: ${busca}` : "Colaborador"}
        </Button>
        <Select value={equipeFiltro} onValueChange={setEquipeFiltro}>
          <SelectTrigger className="h-8 w-auto rounded-control text-xs gap-1.5 border-border">
            <SelectValue>
              {equipeFiltro === "todas" ? "Equipe: todas" : `Equipe: ${equipes.find((e) => e.id === equipeFiltro)?.nome || ""}`}
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="todas">Todas</SelectItem>
            {equipes.map((e) => (
              <SelectItem key={e.id} value={e.id}>
                {e.nome}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {filtrosAtivos && (
          <Button variant="ghost" size="sm" className="h-8 text-xs text-text-tertiary" onClick={limparFiltros}>
            <X className="h-3.5 w-3.5 mr-1" />
            Limpar
          </Button>
        )}
      </div>

      {showFilters && (
        <div className="mb-4 pb-4 border-b border-border">
          <label className="text-xs font-medium text-text-secondary mb-1 block">Buscar colaborador</label>
          <Input
            placeholder="Nome do colaborador..."
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            className="h-9 max-w-sm"
            autoFocus
          />
        </div>
      )}

      {/* Resumo */}
      <p className="text-sm text-text-secondary mb-3">
        <span className="font-medium text-foreground tabular-nums">{filteredPedidos.length}</span>{" "}
        {filteredPedidos.length === 1 ? "pedido aguardando pagamento" : "pedidos aguardando pagamento"} ·{" "}
        <span className="font-medium text-foreground tabular-nums">{formatValue(totalFiltrado)}</span>
      </p>

      <div className="border border-border rounded-lg overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-surface hover:bg-surface border-border">
              <TableHead className="h-9 text-xs font-medium text-text-tertiary">Colaborador</TableHead>
              <TableHead className="h-9 text-xs font-medium text-text-tertiary hidden md:table-cell">Equipe</TableHead>
              <TableHead className="h-9 text-xs font-medium text-text-tertiary hidden sm:table-cell">Criado</TableHead>
              <TableHead className="h-9 text-xs font-medium text-text-tertiary">Tipo</TableHead>
              <TableHead className="h-9 text-xs font-medium text-text-tertiary text-right">Valor</TableHead>
              <TableHead className="h-9 w-10" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {pagedPedidos.map((pedido) => {
              const { isReembolsoKm, valorNF } = composicaoDe(pedido)
              const isExpanded = expandedId === pedido.id
              const isPago = pedido.status === "pago"
              const isNotaRecebida = pedido.status === "nota_recebida"
              const podeMarcarPago = isPago ? false : isReembolsoKm ? pedido.status === "aprovado" : isNotaRecebida
              const podeAprovarOuRecusar = !isPago && !isReembolsoKm && !isNotaRecebida

              let notaFiscal: any = null
              if (pedido.notas_fiscais) {
                notaFiscal = Array.isArray(pedido.notas_fiscais) ? pedido.notas_fiscais[0] || null : pedido.notas_fiscais
              }
              const pdfUrl = notaFiscal?.arquivo_pdf_url || pedido.nota_fiscal_url

              return (
                <Fragment key={pedido.id}>
                  <TableRow
                    className="group cursor-pointer h-11 border-border hover:bg-surface"
                    onClick={() => setExpandedId(isExpanded ? null : pedido.id)}
                  >
                    <TableCell className="py-2 text-sm font-medium text-foreground">
                      {pedido.colaborador?.nome_completo || "Colaborador"}
                    </TableCell>
                    <TableCell className="py-2 text-sm text-text-tertiary hidden md:table-cell">
                      {(pedido.colaborador as any)?.equipe?.nome || "—"}
                    </TableCell>
                    <TableCell className="py-2 text-sm text-text-tertiary tabular-nums hidden sm:table-cell">
                      {new Date(pedido.created_at).toLocaleDateString("pt-BR")}
                    </TableCell>
                    <TableCell className="py-2 text-sm text-text-secondary">
                      {isPago ? "Pago" : isNotaRecebida ? "Nota recebida" : isReembolsoKm ? "Reembolso KM" : "Nota anexada"}
                    </TableCell>
                    <TableCell className="py-2 text-sm font-medium text-right tabular-nums text-foreground">
                      {formatValue(pedido.valor_total)}
                    </TableCell>
                    <TableCell className="py-2">
                      <div className="flex items-center justify-end gap-1">
                        {/* Ações no fim da linha, visíveis no hover */}
                        <div
                          className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity"
                          onClick={(e) => e.stopPropagation()}
                        >
                          {podeAprovarOuRecusar && (
                            <>
                              <button
                                title="Marcar nota como recebida"
                                onClick={() => handleAprovarNota(pedido)}
                                disabled={approvingId === pedido.id}
                                className="h-7 w-7 inline-flex items-center justify-center rounded-control text-success hover:bg-success-subtle disabled:opacity-50"
                              >
                                <Check className="h-4 w-4" />
                              </button>
                              <button
                                title="Recusar nota"
                                onClick={() => {
                                  setRecusarAlvo(pedido.id)
                                  setMotivoRecusa("")
                                }}
                                className="h-7 w-7 inline-flex items-center justify-center rounded-control text-danger hover:bg-danger-subtle"
                              >
                                <XIcon className="h-4 w-4" />
                              </button>
                            </>
                          )}
                          {podeMarcarPago && (
                            <button
                              title="Marcar como pago"
                              onClick={() => handleMarcarPago(pedido)}
                              disabled={payingId === pedido.id}
                              className="h-7 px-2 inline-flex items-center gap-1 rounded-control text-xs font-medium text-primary hover:bg-accent disabled:opacity-50"
                            >
                              <CreditCard className="h-3.5 w-3.5" />
                              Pago
                            </button>
                          )}
                        </div>
                        {isExpanded ? (
                          <ChevronUp className="h-4 w-4 text-text-tertiary" />
                        ) : (
                          <ChevronDown className="h-4 w-4 text-text-tertiary" />
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                  {isExpanded && (
                    <TableRow className="border-border">
                      <TableCell colSpan={6} className="bg-surface px-4 py-3">
                        <PedidoComposicao pedido={pedido} />
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm mt-3">
                          {!isReembolsoKm && Math.abs(valorNF - pedido.valor_total) > 0.01 && (
                            <div>
                              <p className="text-xs text-text-tertiary">Valor da nota fiscal</p>
                              <p className="font-medium tabular-nums">{formatValue(valorNF)}</p>
                            </div>
                          )}
                          {pdfUrl && (
                            <div>
                              <p className="text-xs text-text-tertiary mb-1">Documento</p>
                              <a
                                href={pdfUrl}
                                download
                                target="_blank"
                                rel="noopener noreferrer"
                                onClick={(e) => {
                                  if (!pdfUrl || pdfUrl.includes("undefined")) {
                                    e.preventDefault()
                                    toast.error("PDF não disponível.")
                                  }
                                }}
                                className="inline-flex items-center gap-1 text-primary hover:underline font-medium"
                              >
                                <Download className="h-3.5 w-3.5" />
                                PDF
                              </a>
                            </div>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  )}
                </Fragment>
              )
            })}
          </TableBody>
          <TableFooter>
            <TableRow className="border-border">
              <TableCell colSpan={4} className="text-xs font-medium text-text-tertiary py-2 hidden sm:table-cell">
                Total
              </TableCell>
              <TableCell colSpan={2} className="text-xs font-medium text-text-tertiary py-2 sm:hidden">
                Total
              </TableCell>
              <TableCell className="text-right text-sm font-semibold tabular-nums py-2" colSpan={2}>
                {formatValue(totalFiltrado)}
              </TableCell>
            </TableRow>
          </TableFooter>
        </Table>
      </div>

      <SimplePager
        page={page}
        pageSize={pageSize}
        totalItems={filteredPedidos.length}
        onPageChange={setPage}
        onPageSizeChange={setPageSize}
      />
    </div>
  )
}
