"use client"

import { useEffect, useMemo, useState } from "react"
import type { PedidoPagamento } from "@/types/pedido"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Filter, Search, X } from "lucide-react"
import { DashboardResumo, type AcaoAgoraItem } from "@/components/dashboard-resumo"
import { DashboardAnalytics } from "@/components/dashboard-analytics"

interface DashboardClientProps {
  pedidos: PedidoPagamento[]
  equipes: Array<{ id: string; nome: string }>
  tipoAcesso: string
  acaoAgoraItens: AcaoAgoraItem[]
  acaoAgoraMaisAntigo: { nome: string; tipo: string; createdAt: string } | null
}

export function DashboardClient({
  pedidos,
  equipes,
  tipoAcesso,
  acaoAgoraItens,
  acaoAgoraMaisAntigo,
}: DashboardClientProps) {
  const [showFilters, setShowFilters] = useState(false)
  const [dataInicio, setDataInicio] = useState("")
  const [dataFim, setDataFim] = useState("")
  const [busca, setBusca] = useState("")
  const [statusFilter, setStatusFilter] = useState("todos")
  const [tipoFilter, setTipoFilter] = useState("todos")
  const [equipeFilter, setEquipeFilter] = useState("todas")

  const setPreset = (dias: number) => {
    const fim = new Date()
    const inicio = new Date()
    inicio.setDate(inicio.getDate() - dias)
    setDataInicio(inicio.toISOString().split("T")[0])
    setDataFim(fim.toISOString().split("T")[0])
  }

  const setMonthPreset = () => {
    const agora = new Date()
    const inicio = new Date(agora.getFullYear(), agora.getMonth(), 1)
    setDataInicio(inicio.toISOString().split("T")[0])
    setDataFim(agora.toISOString().split("T")[0])
  }

  const clearFilters = () => {
    setDataInicio("")
    setDataFim("")
    setBusca("")
    setStatusFilter("todos")
    setTipoFilter("todos")
    setEquipeFilter("todas")
  }

  const filtrosAtivos =
    !!dataInicio || !!dataFim || !!busca || statusFilter !== "todos" || tipoFilter !== "todos" || equipeFilter !== "todas"

  const filteredPedidos = useMemo(() => {
    let result = pedidos

    if (dataInicio) {
      result = result.filter((p) => p.created_at >= dataInicio)
    }
    if (dataFim) {
      const fim = new Date(dataFim)
      fim.setDate(fim.getDate() + 1)
      result = result.filter((p) => p.created_at < fim.toISOString())
    }
    if (busca) {
      const q = busca.toLowerCase()
      result = result.filter(
        (p) =>
          p.colaborador?.nome_completo?.toLowerCase().includes(q) ||
          p.colaboradores?.nome_completo?.toLowerCase().includes(q),
      )
    }
    if (statusFilter !== "todos") {
      result = result.filter((p) => p.status === statusFilter)
    }
    if (tipoFilter !== "todos") {
      if (tipoFilter === "reembolso_km") {
        result = result.filter((p) => p.tipo_pedido === "reembolso_km")
      } else if (tipoFilter === "horas_extras") {
        result = result.filter((p) => (p.horas_extras_50 || 0) > 0 || (p.horas_extras_100 || 0) > 0)
      } else if (tipoFilter === "plantao") {
        result = result.filter((p) => (p.valor_plantao || 0) > 0)
      } else if (tipoFilter === "conducao") {
        result = result.filter((p) => (p.conducao || 0) > 0)
      }
    }
    if (equipeFilter !== "todas") {
      result = result.filter((p) => {
        const colab = (p.colaborador || p.colaboradores) as any
        if (equipeFilter === "sem-equipe") return !colab?.equipe_id
        return colab?.equipe_id === equipeFilter
      })
    }

    return result
  }, [pedidos, dataInicio, dataFim, busca, statusFilter, tipoFilter, equipeFilter])

  return (
    <div className="space-y-4">
      <Card className="border shadow-none">
        <div className="p-4">
          <div className="flex flex-wrap items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => setShowFilters(!showFilters)}>
              <Filter className="h-4 w-4 mr-1.5" />
              Filtros {filtrosAtivos && <span className="ml-1 tabular-nums">({filteredPedidos.length})</span>}
            </Button>
            <Button variant="outline" size="sm" className="h-8 text-xs" onClick={() => setPreset(7)}>
              7 dias
            </Button>
            <Button variant="outline" size="sm" className="h-8 text-xs" onClick={() => setPreset(30)}>
              30 dias
            </Button>
            <Button variant="outline" size="sm" className="h-8 text-xs" onClick={() => setPreset(90)}>
              90 dias
            </Button>
            <Button variant="outline" size="sm" className="h-8 text-xs" onClick={setMonthPreset}>
              Este mês
            </Button>
            {filtrosAtivos && (
              <Button variant="ghost" size="sm" className="h-8 text-xs" onClick={clearFilters}>
                <X className="h-3.5 w-3.5 mr-1" />
                Limpar
              </Button>
            )}
          </div>

          {showFilters && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 mt-3 pt-3 border-t">
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">Data início</label>
                <Input
                  type="date"
                  value={dataInicio}
                  onChange={(e) => setDataInicio(e.target.value)}
                  className="h-8 text-sm"
                />
              </div>
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">Data fim</label>
                <Input
                  type="date"
                  value={dataFim}
                  onChange={(e) => setDataFim(e.target.value)}
                  className="h-8 text-sm"
                />
              </div>
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">Status</label>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="h-8 text-sm">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="todos">Todos</SelectItem>
                    <SelectItem value="pendente_gerente">Pend. Gerente</SelectItem>
                    <SelectItem value="pendente_financeiro">Pend. Financeiro</SelectItem>
                    <SelectItem value="aprovado">Aprovado</SelectItem>
                    <SelectItem value="nota_recebida">Nota Recebida</SelectItem>
                    <SelectItem value="pago">Pago</SelectItem>
                    <SelectItem value="recusado">Recusado</SelectItem>
                    <SelectItem value="correcao">Correção</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">Tipo</label>
                <Select value={tipoFilter} onValueChange={setTipoFilter}>
                  <SelectTrigger className="h-8 text-sm">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="todos">Todos</SelectItem>
                    <SelectItem value="reembolso_km">Reembolso KM</SelectItem>
                    <SelectItem value="horas_extras">Horas Extras</SelectItem>
                    <SelectItem value="plantao">Plantão</SelectItem>
                    <SelectItem value="conducao">Condução</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">Equipe</label>
                <Select value={equipeFilter} onValueChange={setEquipeFilter}>
                  <SelectTrigger className="h-8 text-sm">
                    <SelectValue />
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
              </div>
              <div className="lg:col-span-5">
                <label className="text-xs text-muted-foreground mb-1 block">Buscar colaborador</label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Nome do colaborador..."
                    value={busca}
                    onChange={(e) => setBusca(e.target.value)}
                    className="pl-9 h-8 text-sm"
                  />
                </div>
              </div>
            </div>
          )}
        </div>
      </Card>

      <DashboardResumo
        pedidos={filteredPedidos}
        equipes={equipes}
        tipoAcesso={tipoAcesso}
        acaoAgoraItens={acaoAgoraItens}
        acaoAgoraMaisAntigo={acaoAgoraMaisAntigo}
      />

      <DashboardAnalytics pedidos={filteredPedidos} />
    </div>
  )
}
