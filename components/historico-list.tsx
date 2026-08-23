"use client"

import { Fragment, useState } from "react"
import type { PedidoPagamento } from "@/types/pedido"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { StatusBadge } from "@/components/ui/status-badge"
import { EmptyState } from "@/components/ui/empty-state"
import { ChevronDown, ChevronUp } from "lucide-react"
import { useMaskedCurrency } from "@/components/currency-display"
import { PedidoComposicao } from "./pedido-composicao"

interface HistoricoListProps {
  pedidos: PedidoPagamento[]
}

export function HistoricoList({ pedidos }: HistoricoListProps) {
  const { formatValue } = useMaskedCurrency()
  const [expandedId, setExpandedId] = useState<string | null>(null)

  if (pedidos.length === 0) {
    return <EmptyState title="Nenhum pedido criado ainda" />
  }

  return (
    <div className="border border-border rounded-lg overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow className="bg-surface hover:bg-surface border-border">
            <TableHead className="h-9 text-xs font-medium text-text-tertiary">Colaborador</TableHead>
            <TableHead className="h-9 text-xs font-medium text-text-tertiary hidden sm:table-cell">Criado</TableHead>
            <TableHead className="h-9 text-xs font-medium text-text-tertiary">Status</TableHead>
            <TableHead className="h-9 text-xs font-medium text-text-tertiary text-right">Valor total</TableHead>
            <TableHead className="h-9 w-10" />
          </TableRow>
        </TableHeader>
        <TableBody>
          {pedidos.map((pedido) => {
            const colaboradorNome = pedido.colaborador?.nome_completo || "N/A"
            const isReembolsoKm = pedido.tipo_pedido === "reembolso_km"
            const isExpanded = expandedId === pedido.id

            return (
              <Fragment key={pedido.id}>
                <TableRow
                  className="group cursor-pointer h-11 border-border hover:bg-surface"
                  onClick={() => setExpandedId(isExpanded ? null : pedido.id)}
                >
                  <TableCell className="py-2 text-sm font-medium text-foreground">
                    <div className="flex items-center gap-2">
                      {colaboradorNome}
                      {isReembolsoKm && <span className="text-xs font-normal text-text-tertiary">· Reembolso KM</span>}
                    </div>
                  </TableCell>
                  <TableCell className="py-2 text-sm text-text-tertiary tabular-nums hidden sm:table-cell">
                    {new Date(pedido.created_at).toLocaleDateString("pt-BR")}
                  </TableCell>
                  <TableCell className="py-2">
                    <StatusBadge status={pedido.status} />
                  </TableCell>
                  <TableCell className="py-2 text-sm font-medium text-right tabular-nums text-foreground">
                    {formatValue(pedido.valor_total)}
                  </TableCell>
                  <TableCell className="py-2">
                    <div className="flex items-center justify-end">
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
                      <PedidoComposicao pedido={pedido} />
                      {pedido.observacao_gerente && (
                        <div className="mt-3 mb-2">
                          <p className="text-xs text-text-tertiary">Observação do gerente</p>
                          <p className="text-sm text-text-secondary">{pedido.observacao_gerente}</p>
                        </div>
                      )}
                      {pedido.observacao_financeiro && (
                        <div className="mt-3">
                          <p className="text-xs text-text-tertiary">Observação do financeiro</p>
                          <p className="text-sm text-text-secondary">{pedido.observacao_financeiro}</p>
                        </div>
                      )}
                    </TableCell>
                  </TableRow>
                )}
              </Fragment>
            )
          })}
        </TableBody>
      </Table>
    </div>
  )
}
