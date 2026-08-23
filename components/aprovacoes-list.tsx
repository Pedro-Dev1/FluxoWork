"use client"

import { Fragment, useState } from "react"
import type { PedidoPagamento } from "@/types/pedido"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { StatusBadge } from "@/components/ui/status-badge"
import { EmptyState } from "@/components/ui/empty-state"
import { Check, X, AlertCircle, ChevronDown, ChevronUp, User } from "lucide-react"
import { acaoGerente, acaoFinanceiro } from "@/app/actions/pedidos"
import { useRouter } from "next/navigation"
import { useMaskedCurrency } from "@/components/currency-display"
import { useSystemStatus } from "./system-status-provider"
import { SystemSuspendedDialog } from "./system-suspended-dialog"
import { toast } from "sonner"

interface AprovacoesListProps {
  pedidos: PedidoPagamento[]
  tipoAcesso: string
}

type AcaoTipo = "aprovar" | "recusar" | "corrigir"

function composicaoDe(pedido: PedidoPagamento) {
  const isReembolsoKm = pedido.tipo_pedido === "reembolso_km"
  const salarioBase = pedido.salario_base ?? pedido.colaborador?.salario ?? 0
  return { isReembolsoKm, salarioBase }
}

export function AprovacoesList({ pedidos, tipoAcesso }: AprovacoesListProps) {
  const router = useRouter()
  const { formatValue } = useMaskedCurrency()
  const { isSystemSuspended, suspensionReason } = useSystemStatus()
  const [suspendedDialogOpen, setSuspendedDialogOpen] = useState(false)
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [processingId, setProcessingId] = useState<string | null>(null)

  const [dialogAlvo, setDialogAlvo] = useState<{ pedido: PedidoPagamento; acao: AcaoTipo } | null>(null)
  const [observacao, setObservacao] = useState("")
  const [dataPrevisao, setDataPrevisao] = useState("")
  const [dialogError, setDialogError] = useState("")

  const totalPendente = pedidos.reduce((s, p) => s + p.valor_total, 0)

  const executarAcao = async (pedido: PedidoPagamento, acao: AcaoTipo, obs: string, dataPrevisaoPagamento?: string) => {
    setProcessingId(pedido.id)
    try {
      if (tipoAcesso === "Gerente" || tipoAcesso === "Adm") {
        await acaoGerente({ pedido_id: pedido.id, acao, observacao: obs })
      } else if (tipoAcesso === "Financeiro") {
        await acaoFinanceiro({ pedido_id: pedido.id, acao, observacao: obs, data_previsao_pagamento: dataPrevisaoPagamento })
      }
      toast.success(
        acao === "aprovar" ? "Pedido aprovado" : acao === "recusar" ? "Pedido recusado" : "Correção solicitada",
      )
      router.refresh()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Erro ao processar ação. Tente novamente.")
    } finally {
      setProcessingId(null)
    }
  }

  const abrirDialog = (pedido: PedidoPagamento, acao: AcaoTipo) => {
    if (isSystemSuspended) {
      setSuspendedDialogOpen(true)
      return
    }
    setDialogAlvo({ pedido, acao })
    setObservacao("")
    setDataPrevisao("")
    setDialogError("")
  }

  const confirmarDialog = async () => {
    if (!dialogAlvo) return
    const { pedido, acao } = dialogAlvo

    if (acao !== "aprovar" && !observacao.trim()) {
      setDialogError("Por favor, adicione uma observação explicando o motivo")
      return
    }
    if (acao === "aprovar" && tipoAcesso === "Financeiro" && !dataPrevisao) {
      setDialogError("Por favor, informe a data de previsão de pagamento")
      return
    }

    await executarAcao(pedido, acao, observacao, dataPrevisao)
    setDialogAlvo(null)
  }

  if (pedidos.length === 0) {
    return <EmptyState title="Nenhum pedido pendente" description="Não há pedidos aguardando aprovação no momento." />
  }

  const dialogTitulo =
    dialogAlvo?.acao === "aprovar" ? "Aprovar pedido" : dialogAlvo?.acao === "corrigir" ? "Solicitar correção" : "Recusar pedido"

  const DetalhesPedido = ({ pedido }: { pedido: PedidoPagamento }) => {
    const { isReembolsoKm, salarioBase } = composicaoDe(pedido)
    return (
      <div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm mb-3">
          {isReembolsoKm ? (
            <div>
              <p className="text-xs text-text-tertiary">Quilometragem</p>
              <p className="font-medium tabular-nums">{formatValue(pedido.valor_km || 0)}</p>
            </div>
          ) : (
            <>
              <div>
                <p className="text-xs text-text-tertiary">Salário base</p>
                <p className="font-medium tabular-nums">{formatValue(salarioBase)}</p>
              </div>
              <div>
                <p className="text-xs text-text-tertiary">Horas extras</p>
                <p className="font-medium tabular-nums">{formatValue(pedido.horas_extras || 0)}</p>
              </div>
              {(pedido.valor_plantao || 0) > 0 && (
                <div>
                  <p className="text-xs text-text-tertiary">Plantão</p>
                  <p className="font-medium tabular-nums">{formatValue(pedido.valor_plantao || 0)}</p>
                </div>
              )}
              {(pedido.comissao || 0) > 0 && (
                <div>
                  <p className="text-xs text-text-tertiary">Comissão</p>
                  <p className="font-medium tabular-nums">{formatValue(pedido.comissao || 0)}</p>
                </div>
              )}
              {(pedido.valor_km || 0) > 0 && (
                <div>
                  <p className="text-xs text-text-tertiary">Quilometragem</p>
                  <p className="font-medium tabular-nums">{formatValue(pedido.valor_km || 0)}</p>
                </div>
              )}
              {(pedido.valor_desconto || 0) > 0 && (
                <div>
                  <p className="text-xs text-text-tertiary">Desconto</p>
                  <p className="font-medium tabular-nums text-danger">-{formatValue(pedido.valor_desconto || 0)}</p>
                </div>
              )}
            </>
          )}
        </div>

        {pedido.criado_por && (
          <p className="text-xs text-text-tertiary flex items-center gap-1 mb-2">
            <User className="w-3 h-3" />
            Solicitado por {pedido.criado_por.nome_completo}
          </p>
        )}
        {tipoAcesso === "Financeiro" && pedido.data_aprovacao_gerente && (
          <p className="text-xs text-success flex items-center gap-1 mb-2">
            <Check className="w-3 h-3" />
            Aprovado pelo gerente em{" "}
            {new Date(pedido.data_aprovacao_gerente).toLocaleString("pt-BR", {
              day: "2-digit",
              month: "2-digit",
              year: "numeric",
              hour: "2-digit",
              minute: "2-digit",
            })}
          </p>
        )}

        {(pedido.horas_extras || 0) > 0 && (
          <div className="mb-2">
            <p className="text-xs text-text-tertiary">Motivo das horas extras</p>
            <p className="text-sm text-text-secondary">{pedido.motivo_horas_extras || "Não informado"}</p>
          </div>
        )}
        {(pedido.valor_plantao || 0) > 0 && (
          <div className="mb-2">
            <p className="text-xs text-text-tertiary">Motivo do plantão</p>
            <p className="text-sm text-text-secondary">{pedido.motivo_plantao || "Não informado"}</p>
          </div>
        )}
        {(pedido.comissao || 0) > 0 && (
          <div className="mb-2">
            <p className="text-xs text-text-tertiary">Motivo da comissão</p>
            <p className="text-sm text-text-secondary">{pedido.motivo_comissao || "Não informado"}</p>
          </div>
        )}
        {(pedido.valor_desconto || 0) > 0 && (
          <div className="mb-2">
            <p className="text-xs text-text-tertiary">Motivo do desconto</p>
            <p className="text-sm text-text-secondary">{pedido.motivo_desconto || "Não informado"}</p>
          </div>
        )}
        {pedido.observacao_gerente && (
          <div className="mb-2">
            <p className="text-xs text-text-tertiary">Observação do gerente</p>
            <p className="text-sm text-text-secondary">{pedido.observacao_gerente}</p>
          </div>
        )}
        {pedido.observacao_financeiro && (
          <div>
            <p className="text-xs text-text-tertiary">Observação do financeiro</p>
            <p className="text-sm text-text-secondary">{pedido.observacao_financeiro}</p>
          </div>
        )}
      </div>
    )
  }

  return (
    <div>
      <SystemSuspendedDialog open={suspendedDialogOpen} onOpenChange={setSuspendedDialogOpen} reason={suspensionReason} />

      <Dialog open={!!dialogAlvo} onOpenChange={(open) => !open && setDialogAlvo(null)}>
        <DialogContent className="sm:max-w-lg max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{dialogTitulo}</DialogTitle>
          </DialogHeader>

          {dialogAlvo && (
            <div className="space-y-4">
              <div className="flex items-center justify-between rounded-control bg-surface px-3 py-2">
                <div>
                  <p className="text-sm font-medium text-foreground">{dialogAlvo.pedido.colaborador?.nome_completo || "N/A"}</p>
                  <StatusBadge status={dialogAlvo.pedido.status} className="mt-1" />
                </div>
                <p className="text-lg font-semibold tabular-nums text-foreground">{formatValue(dialogAlvo.pedido.valor_total)}</p>
              </div>

              <div className="border-t border-border pt-3">
                <DetalhesPedido pedido={dialogAlvo.pedido} />
              </div>

              <div className="border-t border-border pt-3 space-y-3">
                {dialogAlvo.acao === "aprovar" && tipoAcesso === "Financeiro" && (
                  <div className="space-y-1.5">
                    <Label htmlFor="data-previsao" className="text-xs font-medium text-text-secondary">
                      Data de previsão de pagamento *
                    </Label>
                    <Input
                      id="data-previsao"
                      type="date"
                      value={dataPrevisao}
                      onChange={(e) => {
                        setDataPrevisao(e.target.value)
                        setDialogError("")
                      }}
                      min={new Date().toISOString().split("T")[0]}
                    />
                    <p className="text-xs text-text-tertiary">Esta data será visível para o colaborador, supervisor e gerente.</p>
                  </div>
                )}
                <div className="space-y-1.5">
                  <Label className="text-xs font-medium text-text-secondary">
                    {dialogAlvo.acao === "aprovar" ? "Observação (opcional)" : "Motivo *"}
                  </Label>
                  <Textarea
                    value={observacao}
                    onChange={(e) => {
                      setObservacao(e.target.value)
                      setDialogError("")
                    }}
                    placeholder={
                      dialogAlvo.acao === "corrigir"
                        ? "Explique o que precisa ser corrigido..."
                        : dialogAlvo.acao === "recusar"
                          ? "Explique o motivo da recusa..."
                          : "Adicione uma observação..."
                    }
                    rows={3}
                    autoFocus
                  />
                </div>
                {dialogError && <p className="text-xs text-danger">{dialogError}</p>}
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogAlvo(null)}>
              Cancelar
            </Button>
            <Button
              variant={dialogAlvo?.acao === "recusar" ? "destructive" : "default"}
              onClick={confirmarDialog}
              disabled={processingId === dialogAlvo?.pedido.id}
            >
              {processingId === dialogAlvo?.pedido.id
                ? "Processando..."
                : dialogAlvo?.acao === "aprovar"
                  ? "Confirmar aprovação"
                  : dialogAlvo?.acao === "recusar"
                    ? "Confirmar recusa"
                    : "Confirmar correção"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <p className="text-sm text-text-secondary mb-3">
        <span className="font-medium text-foreground tabular-nums">{pedidos.length}</span>{" "}
        {pedidos.length === 1 ? "pedido pendente" : "pedidos pendentes"} ·{" "}
        <span className="font-medium text-foreground tabular-nums">{formatValue(totalPendente)}</span>
      </p>

      <div className="border border-border rounded-lg overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-surface hover:bg-surface border-border">
              <TableHead className="h-9 text-xs font-medium text-text-tertiary">Colaborador</TableHead>
              <TableHead className="h-9 text-xs font-medium text-text-tertiary hidden md:table-cell">Criado</TableHead>
              <TableHead className="h-9 text-xs font-medium text-text-tertiary">Status</TableHead>
              <TableHead className="h-9 text-xs font-medium text-text-tertiary text-right">Valor total</TableHead>
              <TableHead className="h-9 w-10" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {pedidos.map((pedido) => {
              const { isReembolsoKm } = composicaoDe(pedido)
              const isExpanded = expandedId === pedido.id

              return (
                <Fragment key={pedido.id}>
                  <TableRow
                    className="group cursor-pointer h-11 border-border hover:bg-surface"
                    onClick={() => setExpandedId(isExpanded ? null : pedido.id)}
                  >
                    <TableCell className="py-2 text-sm font-medium text-foreground">
                      <div className="flex items-center gap-2">
                        {pedido.colaborador?.nome_completo || "N/A"}
                        {isReembolsoKm && (
                          <span className="text-xs font-normal text-text-tertiary">· Reembolso KM</span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="py-2 text-sm text-text-tertiary tabular-nums hidden md:table-cell">
                      {new Date(pedido.created_at).toLocaleDateString("pt-BR")}
                    </TableCell>
                    <TableCell className="py-2">
                      <StatusBadge status={pedido.status} />
                    </TableCell>
                    <TableCell className="py-2 text-sm font-medium text-right tabular-nums text-foreground">
                      {formatValue(pedido.valor_total)}
                    </TableCell>
                    <TableCell className="py-2">
                      <div className="flex items-center justify-end gap-1">
                        <div
                          className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <button
                            title="Aprovar"
                            onClick={() => abrirDialog(pedido, "aprovar")}
                            disabled={processingId === pedido.id}
                            className="h-7 w-7 inline-flex items-center justify-center rounded-control text-success hover:bg-success-subtle disabled:opacity-50"
                          >
                            <Check className="h-4 w-4" />
                          </button>
                          {tipoAcesso !== "Financeiro" && (
                            <button
                              title="Solicitar correção"
                              onClick={() => abrirDialog(pedido, "corrigir")}
                              className="h-7 w-7 inline-flex items-center justify-center rounded-control text-warning hover:bg-warning-subtle"
                            >
                              <AlertCircle className="h-4 w-4" />
                            </button>
                          )}
                          <button
                            title="Recusar"
                            onClick={() => abrirDialog(pedido, "recusar")}
                            className="h-7 w-7 inline-flex items-center justify-center rounded-control text-danger hover:bg-danger-subtle"
                          >
                            <X className="h-4 w-4" />
                          </button>
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
                      <TableCell colSpan={5} className="bg-surface px-4 py-3">
                        <DetalhesPedido pedido={pedido} />
                      </TableCell>
                    </TableRow>
                  )}
                </Fragment>
              )
            })}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
