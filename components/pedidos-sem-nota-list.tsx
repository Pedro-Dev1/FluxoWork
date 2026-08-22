"use client"

import { Fragment, useEffect, useMemo, useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableFooter, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Search, X, ChevronDown, ChevronUp } from "lucide-react"
import type { PedidoPagamento } from "@/types/pedido"
import type { Equipe } from "@/types/equipe"
import { listarEquipes } from "@/app/actions/equipes"
import { useMaskedCurrency } from "@/components/currency-display"
import { SimplePager } from "@/components/ui/simple-pager"

interface PedidosSemNotaListProps {
  pedidos: PedidoPagamento[]
}

function composicaoDe(pedido: PedidoPagamento) {
  const salarioBase = pedido.salario_base ?? pedido.colaborador?.salario ?? 0
  const valorNF =
    salarioBase + (pedido.horas_extras || 0) + (pedido.conducao || 0) + (pedido.valor_plantao || 0) - (pedido.valor_desconto || 0)
  return { salarioBase, valorNF }
}

export function PedidosSemNotaList({ pedidos }: PedidosSemNotaListProps) {
  const { formatValue } = useMaskedCurrency()
  const [equipes, setEquipes] = useState<Equipe[]>([])
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [showFilters, setShowFilters] = useState(false)
  const [busca, setBusca] = useState("")
  const [equipeFiltro, setEquipeFiltro] = useState("todas")
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(25)

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

  const filtros = (
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
  )

  if (pedidos.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <p className="text-sm font-medium text-foreground mb-1">Todos os colaboradores anexaram suas notas</p>
        <p className="text-sm text-text-tertiary">Nenhum pedido aprovado aguardando nota fiscal no momento.</p>
      </div>
    )
  }

  return (
    <div>
      {filtros}

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

      {filteredPedidos.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <p className="text-sm font-medium text-foreground mb-1">Nenhum pedido encontrado</p>
          <p className="text-sm text-text-tertiary">Ajuste os filtros para ver outros resultados.</p>
        </div>
      ) : (
        <>
          <p className="text-sm text-text-secondary mb-3">
            <span className="font-medium text-foreground tabular-nums">{filteredPedidos.length}</span>{" "}
            {filteredPedidos.length === 1 ? "pedido aguardando nota" : "pedidos aguardando nota"} ·{" "}
            <span className="font-medium text-foreground tabular-nums">{formatValue(totalFiltrado)}</span>
          </p>

          <div className="border border-border rounded-lg overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="bg-surface hover:bg-surface border-border">
                  <TableHead className="h-9 text-xs font-medium text-text-tertiary">Colaborador</TableHead>
                  <TableHead className="h-9 text-xs font-medium text-text-tertiary hidden md:table-cell">Equipe</TableHead>
                  <TableHead className="h-9 text-xs font-medium text-text-tertiary hidden sm:table-cell">Criado</TableHead>
                  <TableHead className="h-9 text-xs font-medium text-text-tertiary">Situação</TableHead>
                  <TableHead className="h-9 text-xs font-medium text-text-tertiary text-right">Valor NF</TableHead>
                  <TableHead className="h-9 w-10" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {pagedPedidos.map((pedido) => {
                  const { salarioBase, valorNF } = composicaoDe(pedido)
                  const isExpanded = expandedId === pedido.id
                  const diasDesdeAprovacao = Math.floor((Date.now() - new Date(pedido.created_at).getTime()) / (1000 * 60 * 60 * 24))
                  const temDeadline = pedido.data_limite_anexo_nota
                  const deadlineExpirado = !!temDeadline && new Date(pedido.data_limite_anexo_nota as string).getTime() < Date.now()

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
                        <TableCell className="py-2 text-sm tabular-nums">
                          {deadlineExpirado ? (
                            <span className="font-medium text-danger">Prazo expirado</span>
                          ) : (
                            <span className="text-text-secondary">
                              {diasDesdeAprovacao} {diasDesdeAprovacao === 1 ? "dia" : "dias"} sem nota
                            </span>
                          )}
                        </TableCell>
                        <TableCell className="py-2 text-sm font-medium text-right tabular-nums text-foreground">
                          {formatValue(valorNF)}
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
                          <TableCell colSpan={6} className="bg-surface px-4 py-3">
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
                              <div>
                                <p className="text-xs text-text-tertiary">Salário</p>
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
                              {(pedido.conducao || 0) > 0 && (
                                <div>
                                  <p className="text-xs text-text-tertiary">Condução</p>
                                  <p className="font-medium tabular-nums">{formatValue(pedido.conducao || 0)}</p>
                                </div>
                              )}
                              {(pedido.valor_desconto || 0) > 0 && (
                                <div>
                                  <p className="text-xs text-text-tertiary">Desconto</p>
                                  <p className="font-medium tabular-nums text-danger">-{formatValue(pedido.valor_desconto || 0)}</p>
                                  {pedido.motivo_desconto && (
                                    <p className="text-xs text-text-tertiary mt-0.5">{pedido.motivo_desconto}</p>
                                  )}
                                </div>
                              )}
                              {Math.abs(valorNF - pedido.valor_total) > 0.01 && (
                                <div>
                                  <p className="text-xs text-text-tertiary">Total do pedido</p>
                                  <p className="font-medium tabular-nums">{formatValue(pedido.valor_total)}</p>
                                </div>
                              )}
                              {temDeadline && (
                                <div>
                                  <p className="text-xs text-text-tertiary">Prazo para anexar nota</p>
                                  <p className={`font-medium tabular-nums ${deadlineExpirado ? "text-danger" : ""}`}>
                                    {new Date(pedido.data_limite_anexo_nota as string).toLocaleDateString("pt-BR")}
                                  </p>
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
        </>
      )}
    </div>
  )
}
