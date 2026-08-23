"use client"

import { Fragment, useEffect, useMemo, useState } from "react"
import type { PedidoPagamento } from "@/types/pedido"
import type { Equipe } from "@/types/equipe"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableFooter, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { StatusBadge } from "@/components/ui/status-badge"
import { EmptyState } from "@/components/ui/empty-state"
import { Search, X, ChevronDown, ChevronUp, Download, FileText } from "lucide-react"
import { SimplePager } from "@/components/ui/simple-pager"
import { useMaskedCurrency } from "@/components/currency-display"

interface HistoricoCompletoListProps {
  pedidos: PedidoPagamento[]
  equipes: Equipe[]
}

const STATUS_OPTIONS = [
  { value: "todos", label: "Todos" },
  { value: "pendente_gerente", label: "Aguardando gerente" },
  { value: "pendente_financeiro", label: "Aguardando financeiro" },
  { value: "aprovado", label: "Aprovado" },
  { value: "pago", label: "Pago" },
  { value: "nota_recebida", label: "Nota recebida" },
  { value: "recusado", label: "Recusado" },
  { value: "correcao", label: "Correção solicitada" },
  { value: "aguardando_prorrogacao", label: "Prorrogação solicitada" },
  { value: "prorrogacao_negada", label: "Prorrogação negada" },
  { value: "expirado", label: "Expirado" },
]

export function HistoricoCompletoList({ pedidos, equipes }: HistoricoCompletoListProps) {
  const { formatValue } = useMaskedCurrency()
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [showFilters, setShowFilters] = useState(false)
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(25)

  const [busca, setBusca] = useState("")
  const [equipeFiltro, setEquipeFiltro] = useState("todas")
  const [statusFiltro, setStatusFiltro] = useState("todos")

  const filtrosAtivos = !!busca || equipeFiltro !== "todas" || statusFiltro !== "todos"

  const pedidosFiltrados = useMemo(() => {
    let result = pedidos
    if (busca) {
      const q = busca.toLowerCase()
      result = result.filter((p) => p.colaborador?.nome_completo?.toLowerCase().includes(q))
    }
    if (equipeFiltro === "sem-equipe") {
      result = result.filter((p) => !p.colaborador?.equipe_id)
    } else if (equipeFiltro !== "todas") {
      result = result.filter((p) => p.colaborador?.equipe_id === equipeFiltro)
    }
    if (statusFiltro !== "todos") {
      result = result.filter((p) => p.status === statusFiltro)
    }
    return result
  }, [pedidos, busca, equipeFiltro, statusFiltro])

  useEffect(() => {
    setPage(1)
  }, [busca, equipeFiltro, statusFiltro, pageSize])

  const pedidosPaginados = pedidosFiltrados.slice((page - 1) * pageSize, page * pageSize)
  const totalFiltrado = pedidosFiltrados.reduce((s, p) => s + p.valor_total, 0)

  const limparFiltros = () => {
    setBusca("")
    setEquipeFiltro("todas")
    setStatusFiltro("todos")
  }

  const stats = {
    total: pedidos.length,
    valorTotal: pedidos.reduce((acc, p) => acc + p.valor_total, 0),
    aprovados: pedidos.filter((p) => p.status === "aprovado").length,
    pendentes: pedidos.filter((p) => p.status.includes("pendente")).length,
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <Card className="p-4">
          <p className="text-xs text-text-tertiary mb-1">Total de pedidos</p>
          <p className="text-xl font-semibold tabular-nums text-foreground">{stats.total}</p>
        </Card>
        <Card className="p-4">
          <p className="text-xs text-text-tertiary mb-1">Valor total</p>
          <p className="text-xl font-semibold tabular-nums text-foreground">{formatValue(stats.valorTotal)}</p>
        </Card>
        <Card className="p-4">
          <p className="text-xs text-text-tertiary mb-1">Aprovados</p>
          <p className="text-xl font-semibold tabular-nums text-success">{stats.aprovados}</p>
        </Card>
        <Card className="p-4">
          <p className="text-xs text-text-tertiary mb-1">Pendentes</p>
          <p className="text-xl font-semibold tabular-nums text-warning">{stats.pendentes}</p>
        </Card>
      </div>

      <div>
        <div className="flex flex-wrap items-center gap-2 mb-4">
          <Button variant="outline" size="sm" className="h-8 rounded-control" onClick={() => setShowFilters(!showFilters)}>
            <Search className="h-3.5 w-3.5 mr-1.5" />
            {busca ? `Colaborador: ${busca}` : "Colaborador"}
          </Button>
          <Select value={equipeFiltro} onValueChange={setEquipeFiltro}>
            <SelectTrigger className="h-8 w-auto rounded-control text-xs gap-1.5 border-border">
              <SelectValue>
                {equipeFiltro === "todas"
                  ? "Equipe: todas"
                  : equipeFiltro === "sem-equipe"
                    ? "Equipe: sem equipe"
                    : `Equipe: ${equipes.find((e) => e.id === equipeFiltro)?.nome || ""}`}
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todas">Todas</SelectItem>
              <SelectItem value="sem-equipe">Sem equipe</SelectItem>
              {equipes.map((e) => (
                <SelectItem key={e.id} value={e.id}>
                  {e.nome}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={statusFiltro} onValueChange={setStatusFiltro}>
            <SelectTrigger className="h-8 w-auto rounded-control text-xs gap-1.5 border-border">
              <SelectValue>
                {"Status: " + (STATUS_OPTIONS.find((s) => s.value === statusFiltro)?.label || "Todos")}
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              {STATUS_OPTIONS.map((s) => (
                <SelectItem key={s.value} value={s.value}>
                  {s.label}
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

        {pedidosFiltrados.length === 0 ? (
          <EmptyState title="Nenhum pedido encontrado" description="Ajuste os filtros para ver outros resultados." />
        ) : (
          <>
            <p className="text-sm text-text-secondary mb-3">
              <span className="font-medium text-foreground tabular-nums">{pedidosFiltrados.length}</span>{" "}
              {pedidosFiltrados.length === 1 ? "pedido encontrado" : "pedidos encontrados"} ·{" "}
              <span className="font-medium text-foreground tabular-nums">{formatValue(totalFiltrado)}</span>
            </p>

            <div className="border border-border rounded-lg overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow className="bg-surface hover:bg-surface border-border">
                    <TableHead className="h-9 text-xs font-medium text-text-tertiary">Colaborador</TableHead>
                    <TableHead className="h-9 text-xs font-medium text-text-tertiary hidden md:table-cell">Criado por</TableHead>
                    <TableHead className="h-9 text-xs font-medium text-text-tertiary hidden sm:table-cell">Criado</TableHead>
                    <TableHead className="h-9 text-xs font-medium text-text-tertiary">Status</TableHead>
                    <TableHead className="h-9 text-xs font-medium text-text-tertiary text-right">Valor total</TableHead>
                    <TableHead className="h-9 w-10" />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {pedidosPaginados.map((pedido) => {
                    const isExpanded = expandedId === pedido.id
                    const colaboradorNome = pedido.colaborador?.nome_completo || "N/A"
                    const criadoPor = pedido.criado_por?.nome_completo || "N/A"
                    const notaFiscal = Array.isArray(pedido.notas_fiscais) ? pedido.notas_fiscais[0] : pedido.notas_fiscais || null

                    return (
                      <Fragment key={pedido.id}>
                        <TableRow
                          className="group cursor-pointer h-11 border-border hover:bg-surface"
                          onClick={() => setExpandedId(isExpanded ? null : pedido.id)}
                        >
                          <TableCell className="py-2 text-sm font-medium text-foreground">{colaboradorNome}</TableCell>
                          <TableCell className="py-2 text-sm text-text-tertiary hidden md:table-cell">{criadoPor}</TableCell>
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
                            <TableCell colSpan={6} className="bg-surface px-4 py-3">
                              {pedido.tipo_pedido !== "reembolso_km" && (
                                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm mb-3">
                                  <div>
                                    <p className="text-xs text-text-tertiary">Salário base</p>
                                    <p className="font-medium tabular-nums">
                                      {formatValue(pedido.salario_base ?? pedido.colaborador?.salario ?? 0)}
                                    </p>
                                  </div>
                                  <div>
                                    <p className="text-xs text-text-tertiary">Horas extras</p>
                                    <p className="font-medium tabular-nums">{formatValue(pedido.horas_extras || 0)}</p>
                                  </div>
                                  {(pedido.valor_km || 0) > 0 && (
                                    <div>
                                      <p className="text-xs text-text-tertiary">Quilometragem</p>
                                      <p className="font-medium tabular-nums">{formatValue(pedido.valor_km || 0)}</p>
                                    </div>
                                  )}
                                  {(pedido.conducao || 0) > 0 && (
                                    <div>
                                      <p className="text-xs text-text-tertiary">Condução</p>
                                      <p className="font-medium tabular-nums">{formatValue(pedido.conducao || 0)}</p>
                                    </div>
                                  )}
                                  {(pedido.valor_plantao || 0) > 0 && (
                                    <div>
                                      <p className="text-xs text-text-tertiary">Plantão</p>
                                      <p className="font-medium tabular-nums">{formatValue(pedido.valor_plantao || 0)}</p>
                                    </div>
                                  )}
                                  {(pedido.valor_desconto || 0) > 0 && (
                                    <div>
                                      <p className="text-xs text-text-tertiary">Desconto</p>
                                      <p className="font-medium tabular-nums text-danger">-{formatValue(pedido.valor_desconto || 0)}</p>
                                    </div>
                                  )}
                                </div>
                              )}

                              {pedido.observacao_gerente && (
                                <div className="mb-2">
                                  <p className="text-xs text-text-tertiary">Observação do gerente</p>
                                  <p className="text-sm text-text-secondary">{pedido.observacao_gerente}</p>
                                </div>
                              )}
                              {pedido.observacao_financeiro && (
                                <div className="mb-2">
                                  <p className="text-xs text-text-tertiary">Observação do financeiro</p>
                                  <p className="text-sm text-text-secondary">{pedido.observacao_financeiro}</p>
                                </div>
                              )}

                              {notaFiscal && (
                                <div className="pt-2 mt-2 border-t border-border">
                                  <div className="flex items-center gap-1.5 mb-1">
                                    <FileText className="w-3.5 h-3.5 text-text-tertiary" />
                                    <p className="text-xs text-text-tertiary">
                                      Nota fiscal {notaFiscal.numero_nfse ? `nº ${notaFiscal.numero_nfse}` : ""} ·{" "}
                                      {formatValue(notaFiscal.valor_servico ?? 0)}
                                    </p>
                                  </div>
                                  <div className="flex gap-3">
                                    {notaFiscal.arquivo_xml_url && (
                                      <a
                                        href={notaFiscal.arquivo_xml_url}
                                        download
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="inline-flex items-center gap-1 text-xs text-primary hover:underline font-medium"
                                      >
                                        <Download className="h-3.5 w-3.5" />
                                        XML
                                      </a>
                                    )}
                                    {notaFiscal.arquivo_pdf_url && (
                                      <a
                                        href={notaFiscal.arquivo_pdf_url}
                                        download
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="inline-flex items-center gap-1 text-xs text-primary hover:underline font-medium"
                                      >
                                        <Download className="h-3.5 w-3.5" />
                                        PDF
                                      </a>
                                    )}
                                  </div>
                                </div>
                              )}
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
              totalItems={pedidosFiltrados.length}
              onPageChange={setPage}
              onPageSizeChange={setPageSize}
            />
          </>
        )}
      </div>
    </div>
  )
}
