"use client"

import { Fragment, useState, useMemo, useEffect } from "react"
import type { PedidoPagamento } from "@/types/pedido"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { useMaskedCurrency } from "@/components/currency-display"
import { SimplePager } from "@/components/ui/simple-pager"
import { Download, ChevronDown, ChevronUp, Receipt } from "lucide-react"

interface DashboardAnalyticsProps {
  // Já filtrado por quem chama (DashboardClient) — este componente só ordena, pagina e exibe.
  pedidos: PedidoPagamento[]
}

const STATUS_LABELS: Record<string, string> = {
  pendente_gerente: "Pend. Gerente",
  pendente_financeiro: "Pend. Financeiro",
  aprovado: "Aprovado",
  recusado: "Recusado",
  correcao: "Correção",
  pago: "Pago",
  nota_recebida: "Nota Recebida",
}

const STATUS_COLORS: Record<string, string> = {
  pendente_gerente: "bg-amber-50 text-amber-800 border-amber-200",
  pendente_financeiro: "bg-sky-50 text-sky-800 border-sky-200",
  aprovado: "bg-emerald-50 text-emerald-800 border-emerald-200",
  recusado: "bg-red-50 text-red-800 border-red-200",
  correcao: "bg-orange-50 text-orange-800 border-orange-200",
  pago: "bg-green-50 text-green-800 border-green-200",
  nota_recebida: "bg-teal-50 text-teal-800 border-teal-200",
}

function formatDateBR(dateString: string) {
  const d = new Date(dateString)
  return d.toLocaleDateString("pt-BR")
}

export function DashboardAnalytics({ pedidos }: DashboardAnalyticsProps) {
  const { formatValue, valoresVisiveis } = useMaskedCurrency()

  const [sortField, setSortField] = useState<string>("created_at")
  const [sortAsc, setSortAsc] = useState(false)
  const [expandedRow, setExpandedRow] = useState<string | null>(null)
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(25)

  // Sort (a filtragem já vem pronta do componente pai)
  const sortedPedidos = useMemo(() => {
    const result = [...pedidos]
    result.sort((a, b) => {
      let valA: any, valB: any
      if (sortField === "created_at") {
        valA = a.created_at
        valB = b.created_at
      } else if (sortField === "valor_total") {
        valA = a.valor_total
        valB = b.valor_total
      } else if (sortField === "nome") {
        valA = (a.colaborador?.nome_completo || a.colaboradores?.nome_completo || "").toLowerCase()
        valB = (b.colaborador?.nome_completo || b.colaboradores?.nome_completo || "").toLowerCase()
      } else if (sortField === "status") {
        valA = a.status
        valB = b.status
      }
      if (valA < valB) return sortAsc ? -1 : 1
      if (valA > valB) return sortAsc ? 1 : -1
      return 0
    })
    return result
  }, [pedidos, sortField, sortAsc])

  // Volta pra página 1 sempre que o conjunto filtrado (vindo de fora) ou a
  // ordenação mudar — senão a página pode ficar "além do fim" da lista nova.
  useEffect(() => {
    setPage(1)
  }, [pedidos, sortField, sortAsc, pageSize])

  const pagedPedidos = useMemo(() => {
    const start = (page - 1) * pageSize
    return sortedPedidos.slice(start, start + pageSize)
  }, [sortedPedidos, page, pageSize])

  const filteredPedidos = sortedPedidos // export/contagem usam o conjunto completo, não só a página

  const handleSort = (field: string) => {
    if (sortField === field) {
      setSortAsc(!sortAsc)
    } else {
      setSortField(field)
      setSortAsc(true)
    }
  }

  const SortIcon = ({ field }: { field: string }) => {
    if (sortField !== field) return null
    return sortAsc ? <ChevronUp className="h-3 w-3 inline ml-1" /> : <ChevronDown className="h-3 w-3 inline ml-1" />
  }

  // Export Excel (XML Spreadsheet)
  const exportExcel = () => {
    const headers = [
      "Data",
      "Colaborador",
      "Equipe",
      "Centro de Custo",
      "Tipo",
      "Status",
      "Salario Base",
      "HE 50% (h)",
      "HE 100% (h)",
      "Valor Horas Extras",
      "Reembolso KM",
      "Plantao",
      "Conducao",
      "Comissao",
      "Desconto",
      "Valor Total",
      "Criado por",
      "Previsao Pagamento",
    ]

    const escXml = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")

    let xmlRows = ""
    // Header row
    xmlRows += "<Row>"
    headers.forEach((h) => {
      xmlRows += `<Cell><Data ss:Type="String">${escXml(h)}</Data></Cell>`
    })
    xmlRows += "</Row>"

    // Data rows
    filteredPedidos.forEach((p) => {
      const colab = p.colaborador || p.colaboradores
      const nome = colab?.nome_completo || ""
      const equipeNome = (colab as any)?.equipe?.nome || ""
      const ccNome = (colab as any)?.centro_custo ? `${(colab as any).centro_custo.numero} - ${(colab as any).centro_custo.nome}` : ""
      const tipo = p.tipo_pedido === "reembolso_km" ? "Reembolso KM" : "Completo"
      const salarioBase = p.tipo_pedido === "reembolso_km" ? 0 : (p.salario_base ?? colab?.salario ?? 0)
      const he50h = p.horas_extras_50 || 0
      const he100h = p.horas_extras_100 || 0
      const valorHe = p.horas_extras || 0
      const criadoPor = p.criado_por?.nome_completo || ""
      const previsao = p.data_previsao_pagamento ? formatDateBR(p.data_previsao_pagamento) : ""

      xmlRows += "<Row>"
      xmlRows += `<Cell><Data ss:Type="String">${escXml(formatDateBR(p.created_at))}</Data></Cell>`
      xmlRows += `<Cell><Data ss:Type="String">${escXml(nome)}</Data></Cell>`
      xmlRows += `<Cell><Data ss:Type="String">${escXml(equipeNome)}</Data></Cell>`
      xmlRows += `<Cell><Data ss:Type="String">${escXml(ccNome)}</Data></Cell>`
      xmlRows += `<Cell><Data ss:Type="String">${escXml(tipo)}</Data></Cell>`
      xmlRows += `<Cell><Data ss:Type="String">${escXml(STATUS_LABELS[p.status] || p.status)}</Data></Cell>`
      xmlRows += `<Cell><Data ss:Type="Number">${salarioBase.toFixed(2)}</Data></Cell>`
      xmlRows += `<Cell><Data ss:Type="Number">${he50h}</Data></Cell>`
      xmlRows += `<Cell><Data ss:Type="Number">${he100h}</Data></Cell>`
      xmlRows += `<Cell><Data ss:Type="Number">${valorHe.toFixed(2)}</Data></Cell>`
      xmlRows += `<Cell><Data ss:Type="Number">${(p.valor_km || 0).toFixed(2)}</Data></Cell>`
      xmlRows += `<Cell><Data ss:Type="Number">${(p.valor_plantao || 0).toFixed(2)}</Data></Cell>`
      xmlRows += `<Cell><Data ss:Type="Number">${(p.conducao || 0).toFixed(2)}</Data></Cell>`
      xmlRows += `<Cell><Data ss:Type="Number">${(p.comissao || 0).toFixed(2)}</Data></Cell>`
      xmlRows += `<Cell><Data ss:Type="Number">${(p.valor_desconto || 0).toFixed(2)}</Data></Cell>`
      xmlRows += `<Cell><Data ss:Type="Number">${p.valor_total.toFixed(2)}</Data></Cell>`
      xmlRows += `<Cell><Data ss:Type="String">${escXml(criadoPor)}</Data></Cell>`
      xmlRows += `<Cell><Data ss:Type="String">${escXml(previsao)}</Data></Cell>`
      xmlRows += "</Row>"
    })

    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<?mso-application progid="Excel.Sheet"?>
<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet"
  xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet">
  <Worksheet ss:Name="Relatorio">
    <Table>${xmlRows}</Table>
  </Worksheet>
</Workbook>`

    const blob = new Blob([xml], { type: "application/vnd.ms-excel" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `fluxopay_relatorio_${new Date().toISOString().split("T")[0]}.xls`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="space-y-6">
      {/* Filters + Table */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <Receipt className="h-4 w-4" />
              Todos os Pedidos ({filteredPedidos.length})
            </CardTitle>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={exportExcel}>
                <Download className="h-4 w-4 mr-1" />
                Excel
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-0">
          {/* Table */}
          <div className="rounded-lg border overflow-hidden">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/30 hover:bg-muted/30">
                    <TableHead
                      className="cursor-pointer hover:text-foreground text-xs"
                      onClick={() => handleSort("created_at")}
                    >
                      Data <SortIcon field="created_at" />
                    </TableHead>
                    <TableHead
                      className="cursor-pointer hover:text-foreground text-xs"
                      onClick={() => handleSort("nome")}
                    >
                      Colaborador <SortIcon field="nome" />
                    </TableHead>
                    <TableHead className="text-xs hidden lg:table-cell">Equipe</TableHead>
                    <TableHead className="text-xs">Tipo</TableHead>
                    <TableHead
                      className="cursor-pointer hover:text-foreground text-xs"
                      onClick={() => handleSort("status")}
                    >
                      Status <SortIcon field="status" />
                    </TableHead>
                    <TableHead
                      className="cursor-pointer hover:text-foreground text-xs text-right"
                      onClick={() => handleSort("valor_total")}
                    >
                      Valor Total <SortIcon field="valor_total" />
                    </TableHead>
                    <TableHead className="text-xs w-8"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {pagedPedidos.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-8 text-muted-foreground text-sm">
                        Nenhum pedido encontrado com os filtros selecionados
                      </TableCell>
                    </TableRow>
                  ) : (
                    pagedPedidos.map((p) => {
                      const colab = p.colaborador || p.colaboradores
                      const nome = colab?.nome_completo || "N/A"
                      const isExpanded = expandedRow === p.id
                      const tipo = p.tipo_pedido === "reembolso_km" ? "Reembolso KM" : "Completo"

                      return (
                        <Fragment key={p.id}>
                          <TableRow
                            className="cursor-pointer hover:bg-muted/30"
                            onClick={() => setExpandedRow(isExpanded ? null : p.id)}
                          >
                            <TableCell className="text-xs font-mono">{formatDateBR(p.created_at)}</TableCell>
                            <TableCell className="text-sm font-medium">{nome}</TableCell>
                            <TableCell className="hidden lg:table-cell text-xs text-muted-foreground">
                              {(colab as any)?.equipe?.nome || "-"}
                            </TableCell>
                            <TableCell>
                              <Badge variant="outline" className="text-xs font-normal">
                                {tipo}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <Badge className={`text-xs font-normal ${STATUS_COLORS[p.status] || ""}`}>
                                {STATUS_LABELS[p.status] || p.status}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-right text-sm font-semibold">
                              {formatValue(p.valor_total)}
                            </TableCell>
                            <TableCell>
                              {isExpanded ? (
                                <ChevronUp className="h-4 w-4 text-muted-foreground" />
                              ) : (
                                <ChevronDown className="h-4 w-4 text-muted-foreground" />
                              )}
                            </TableCell>
                          </TableRow>
                          {isExpanded && (
                            <TableRow key={`${p.id}-detail`}>
                              <TableCell colSpan={7} className="bg-muted/20 px-6 py-3">
                                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
                                  {p.tipo_pedido !== "reembolso_km" && (
                                    <div>
                                      <span className="text-muted-foreground text-xs block">Salário Base</span>
                                      <span className="font-medium">
                                        {formatValue(p.salario_base ?? colab?.salario ?? 0)}
                                      </span>
                                    </div>
                                  )}
                                  {((p.horas_extras_50 || 0) > 0 || (p.horas_extras_100 || 0) > 0) && (
                                    <div>
                                      <span className="text-muted-foreground text-xs block">Horas Extras</span>
                                      <span className="font-medium">
                                        {p.horas_extras_50 || 0}h (50%) + {p.horas_extras_100 || 0}h (100%)
                                      </span>
                                      {p.motivo_horas_extras && (
                                        <span className="text-xs text-muted-foreground block">{p.motivo_horas_extras}</span>
                                      )}
                                    </div>
                                  )}
                                  {(p.valor_km || 0) > 0 && (
                                    <div>
                                      <span className="text-muted-foreground text-xs block">Reembolso KM</span>
                                      <span className="font-medium">{formatValue(p.valor_km)}</span>
                                    </div>
                                  )}
                                  {(p.valor_plantao || 0) > 0 && (
                                    <div>
                                      <span className="text-muted-foreground text-xs block">Plantão</span>
                                      <span className="font-medium">{formatValue(p.valor_plantao)}</span>
                                      {p.motivo_plantao && (
                                        <span className="text-xs text-muted-foreground block">{p.motivo_plantao}</span>
                                      )}
                                    </div>
                                  )}
                                  {(p.conducao || 0) > 0 && (
                                    <div>
                                      <span className="text-muted-foreground text-xs block">Condução</span>
                                      <span className="font-medium">{formatValue(p.conducao)}</span>
                                    </div>
                                  )}
                                  {(p.comissao || 0) > 0 && (
                                    <div>
                                      <span className="text-muted-foreground text-xs block">Comissão</span>
                                      <span className="font-medium">{formatValue(p.comissao || 0)}</span>
                                      {p.motivo_comissao && (
                                        <span className="text-xs text-muted-foreground block">{p.motivo_comissao}</span>
                                      )}
                                    </div>
                                  )}
                                  {(p.valor_desconto || 0) > 0 && (
                                    <div>
                                      <span className="text-muted-foreground text-xs block">Desconto</span>
                                      <span className="font-medium text-red-600">{formatValue(p.valor_desconto, true)}</span>
                                      {p.motivo_desconto && (
                                        <span className="text-xs text-muted-foreground block">{p.motivo_desconto}</span>
                                      )}
                                    </div>
                                  )}
                                  {p.data_previsao_pagamento && (
                                    <div>
                                      <span className="text-muted-foreground text-xs block">Previsão Pagamento</span>
                                      <span className="font-medium">{formatDateBR(p.data_previsao_pagamento)}</span>
                                    </div>
                                  )}
                                  {(p.colaborador as any)?.equipe?.nome && (
                                    <div>
                                      <span className="text-muted-foreground text-xs block">Equipe</span>
                                      <span className="font-medium">{(p.colaborador as any).equipe.nome}</span>
                                    </div>
                                  )}
                                  {(p.colaborador as any)?.centro_custo && (
                                    <div>
                                      <span className="text-muted-foreground text-xs block">Centro de Custo</span>
                                      <span className="font-medium">{(p.colaborador as any).centro_custo.numero} - {(p.colaborador as any).centro_custo.nome}</span>
                                    </div>
                                  )}
                                  {p.criado_por && (
                                    <div>
                                      <span className="text-muted-foreground text-xs block">Criado por</span>
                                      <span className="font-medium">{p.criado_por.nome_completo}</span>
                                    </div>
                                  )}
                                </div>
                              </TableCell>
                            </TableRow>
                          )}
                        </Fragment>
                      )
                    })
                  )}
                </TableBody>
              </Table>
            </div>
          </div>

          <SimplePager
            page={page}
            pageSize={pageSize}
            totalItems={filteredPedidos.length}
            onPageChange={setPage}
            onPageSizeChange={setPageSize}
          />
        </CardContent>
      </Card>
    </div>
  )
}
