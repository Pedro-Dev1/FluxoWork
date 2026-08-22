"use client"

import { useMemo } from "react"
import Link from "next/link"
import type { PedidoPagamento } from "@/types/pedido"
import { Card } from "@/components/ui/card"
import { useMaskedCurrency } from "@/components/currency-display"
import { ArrowRight, ArrowUpRight, ArrowDownRight } from "lucide-react"
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts"

export interface AcaoAgoraItem {
  label: string
  count: number
  href: string
}

interface AcaoAgoraMaisAntigo {
  nome: string
  tipo: string
  createdAt: string
}

interface DashboardResumoProps {
  pedidos: PedidoPagamento[]
  equipes: Array<{ id: string; nome: string }>
  tipoAcesso: string
  acaoAgoraItens: AcaoAgoraItem[]
  acaoAgoraMaisAntigo: AcaoAgoraMaisAntigo | null
}

const MESES = ["jan", "fev", "mar", "abr", "mai", "jun", "jul", "ago", "set", "out", "nov", "dez"]

function diasAtras(dataISO: string): number {
  const ms = Date.now() - new Date(dataISO).getTime()
  return Math.max(0, Math.floor(ms / (1000 * 60 * 60 * 24)))
}

function colaboradorDe(p: PedidoPagamento) {
  return p.colaborador || p.colaboradores
}

export function DashboardResumo({
  pedidos,
  equipes,
  tipoAcesso,
  acaoAgoraItens,
  acaoAgoraMaisAntigo,
}: DashboardResumoProps) {
  const { formatValue, valoresVisiveis } = useMaskedCurrency()

  const totalAcaoAgora = acaoAgoraItens.reduce((s, i) => s + i.count, 0)

  // Valor total do período (mês corrente) x mês anterior, a partir dos mesmos
  // pedidos já carregados na página — sem query nova.
  const comparacaoMensal = useMemo(() => {
    const agora = new Date()
    const inicioMesAtual = new Date(agora.getFullYear(), agora.getMonth(), 1)
    const inicioMesAnterior = new Date(agora.getFullYear(), agora.getMonth() - 1, 1)

    let totalAtual = 0
    let countAtual = 0
    let totalAnterior = 0
    let temMesAnterior = false

    pedidos.forEach((p) => {
      const d = new Date(p.created_at)
      if (d >= inicioMesAtual) {
        totalAtual += p.valor_total
        countAtual += 1
      } else if (d >= inicioMesAnterior && d < inicioMesAtual) {
        totalAnterior += p.valor_total
        temMesAnterior = true
      }
    })

    const deltaPct = temMesAnterior && totalAnterior !== 0 ? ((totalAtual - totalAnterior) / totalAnterior) * 100 : null

    return { totalAtual, countAtual, totalAnterior, temMesAnterior, deltaPct }
  }, [pedidos])

  // Sequência do fluxo — contagem pelo status real do sistema (não o vocabulário
  // genérico de "agendado", que não existe aqui: o que existe é aprovado ->
  // nota recebida -> pago, com recusado como ramo lateral).
  const sequenciaFluxo = useMemo(() => {
    const contagem = { aprovado: 0, notaRecebida: 0, pago: 0, recusado: 0 }
    pedidos.forEach((p) => {
      if (p.status === "aprovado") contagem.aprovado += 1
      else if (p.status === "nota_recebida") contagem.notaRecebida += 1
      else if (p.status === "pago") contagem.pago += 1
      else if (p.status === "recusado") contagem.recusado += 1
    })
    return contagem
  }, [pedidos])

  // Cortes: por equipe, por centro de custo, por prestador (top 5 cada)
  const cortes = useMemo(() => {
    const porEquipe = new Map<string, number>()
    const porCentroCusto = new Map<string, number>()
    const porPrestador = new Map<string, number>()

    pedidos.forEach((p) => {
      const colab = colaboradorDe(p) as any
      const nomeEquipe = colab?.equipe?.nome || "Sem equipe"
      porEquipe.set(nomeEquipe, (porEquipe.get(nomeEquipe) || 0) + p.valor_total)

      const cc = colab?.centro_custo ? `${colab.centro_custo.numero} - ${colab.centro_custo.nome}` : "Sem centro de custo"
      porCentroCusto.set(cc, (porCentroCusto.get(cc) || 0) + p.valor_total)

      const nomePrestador = colab?.nome_completo || "N/A"
      porPrestador.set(nomePrestador, (porPrestador.get(nomePrestador) || 0) + p.valor_total)
    })

    const top = (m: Map<string, number>, n: number) =>
      Array.from(m.entries())
        .sort((a, b) => b[1] - a[1])
        .slice(0, n)

    return {
      equipes: top(porEquipe, 5),
      centrosCusto: top(porCentroCusto, 5),
      prestadores: top(porPrestador, 5),
    }
  }, [pedidos])

  // Evolução mensal: solicitado (tudo) x aprovado+ (aprovado/nota_recebida/pago) x pago
  const evolucaoMensal = useMemo(() => {
    const meses = new Map<string, { label: string; solicitado: number; aprovado: number; pago: number }>()

    pedidos.forEach((p) => {
      const d = new Date(p.created_at)
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`
      const label = `${MESES[d.getMonth()]}/${String(d.getFullYear()).slice(2)}`
      if (!meses.has(key)) meses.set(key, { label, solicitado: 0, aprovado: 0, pago: 0 })
      const bucket = meses.get(key)!
      bucket.solicitado += p.valor_total
      if (["aprovado", "nota_recebida", "pago"].includes(p.status)) bucket.aprovado += p.valor_total
      if (p.status === "pago") bucket.pago += p.valor_total
    })

    return Array.from(meses.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([, v]) => v)
  }, [pedidos])

  const acaoAgoraLabel =
    tipoAcesso === "Gerente" || tipoAcesso === "Supervisor" ? "aguardando você" : "no seu radar hoje"

  const tooltipValor = (v: number) => (valoresVisiveis ? formatValue(v) : "R$ ------")

  return (
    <div className="space-y-4">
      {/* Bloco 1: requer ação agora */}
      {totalAcaoAgora > 0 && (
        <Card className="border-amber-200 bg-amber-50/60 shadow-none">
          <div className="p-5">
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <p className="text-sm font-medium text-amber-900">
                <span className="text-2xl font-semibold tabular-nums mr-2">{totalAcaoAgora}</span>
                {acaoAgoraLabel}
              </p>
              {acaoAgoraMaisAntigo && (
                <p className="text-xs text-amber-800">
                  Mais antigo: <span className="font-medium">{acaoAgoraMaisAntigo.nome}</span> ·{" "}
                  {acaoAgoraMaisAntigo.tipo} · há {diasAtras(acaoAgoraMaisAntigo.createdAt)}{" "}
                  {diasAtras(acaoAgoraMaisAntigo.createdAt) === 1 ? "dia" : "dias"}
                </p>
              )}
            </div>
            <div className="flex flex-wrap gap-2 mt-3">
              {acaoAgoraItens
                .filter((i) => i.count > 0)
                .map((item) => (
                  <Link
                    key={item.label}
                    href={item.href}
                    className="inline-flex items-center gap-1.5 rounded-md border border-amber-300 bg-white px-3 py-1.5 text-xs font-medium text-amber-900 hover:bg-amber-100 transition-colors"
                  >
                    <span className="tabular-nums font-semibold">{item.count}</span>
                    {item.label}
                    <ArrowRight className="h-3 w-3" />
                  </Link>
                ))}
            </div>
          </div>
        </Card>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Bloco 2: métrica primária */}
        <Card className="lg:col-span-2 border shadow-none">
          <div className="p-5">
            <p className="text-xs font-medium text-muted-foreground mb-1">Valor total do período</p>
            <div className="flex items-baseline gap-3 flex-wrap">
              <p className="text-4xl font-semibold tabular-nums text-foreground">
                {tooltipValor(comparacaoMensal.totalAtual)}
              </p>
              {comparacaoMensal.deltaPct !== null ? (
                <span
                  className={`inline-flex items-center gap-0.5 text-sm font-medium tabular-nums ${
                    comparacaoMensal.deltaPct >= 0 ? "text-emerald-700" : "text-red-700"
                  }`}
                >
                  {comparacaoMensal.deltaPct >= 0 ? (
                    <ArrowUpRight className="h-4 w-4" />
                  ) : (
                    <ArrowDownRight className="h-4 w-4" />
                  )}
                  {Math.abs(comparacaoMensal.deltaPct).toFixed(1)}% vs. mês anterior
                </span>
              ) : (
                <span className="text-sm text-muted-foreground">sem mês anterior comparável ainda</span>
              )}
            </div>
            <p className="text-xs text-muted-foreground mt-1 tabular-nums">
              {comparacaoMensal.countAtual} pedidos este mês
            </p>

            {evolucaoMensal.length > 1 && (
              <div className="mt-4 -ml-2">
                <ResponsiveContainer width="100%" height={200}>
                  <LineChart data={evolucaoMensal} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="0" vertical={false} stroke="#e7e2d9" />
                    <XAxis dataKey="label" fontSize={11} tickLine={false} axisLine={false} stroke="#78716c" />
                    <YAxis hide />
                    <Tooltip
                      formatter={((value: number, name: string) => [
                        tooltipValor(value),
                        name === "solicitado" ? "Solicitado" : name === "aprovado" ? "Aprovado" : "Pago",
                      ]) as any}
                      contentStyle={{ borderRadius: "6px", border: "1px solid #e7e2d9", fontSize: "12px" }}
                    />
                    <Line
                      type="monotone"
                      dataKey="solicitado"
                      stroke="#a8a29e"
                      strokeWidth={1.5}
                      strokeDasharray="4 3"
                      dot={false}
                    />
                    <Line type="monotone" dataKey="aprovado" stroke="#78716c" strokeWidth={2} dot={false} />
                    <Line type="monotone" dataKey="pago" stroke="#1e3a5f" strokeWidth={2.5} dot={false} />
                  </LineChart>
                </ResponsiveContainer>
                <div className="flex items-center gap-4 text-xs text-muted-foreground mt-1 pl-1">
                  <span className="inline-flex items-center gap-1.5">
                    <span className="h-0.5 w-3 bg-[#a8a29e] inline-block" /> Solicitado
                  </span>
                  <span className="inline-flex items-center gap-1.5">
                    <span className="h-0.5 w-3 bg-[#78716c] inline-block" /> Aprovado
                  </span>
                  <span className="inline-flex items-center gap-1.5">
                    <span className="h-0.5 w-3 bg-[#1e3a5f] inline-block" /> Pago
                  </span>
                </div>
              </div>
            )}
          </div>
        </Card>

        {/* Bloco 3: sequência do fluxo */}
        <Card className="border shadow-none">
          <div className="p-5">
            <p className="text-xs font-medium text-muted-foreground mb-3">Sequência do fluxo</p>
            <div className="space-y-2.5">
              <SequenciaLinha label="Aprovado" valor={sequenciaFluxo.aprovado} tone="neutral" />
              <SequenciaLinha label="Nota recebida" valor={sequenciaFluxo.notaRecebida} tone="neutral" />
              <SequenciaLinha label="Pago" valor={sequenciaFluxo.pago} tone="success" />
              <div className="pt-2 mt-2 border-t">
                <SequenciaLinha label="Recusado" valor={sequenciaFluxo.recusado} tone="danger" />
              </div>
            </div>
          </div>
        </Card>
      </div>

      {/* Bloco 4: cortes — um card só, dividido por régua fina, não três caixas iguais */}
      <Card className="border shadow-none">
        <div className="grid grid-cols-1 sm:grid-cols-3 divide-y sm:divide-y-0 sm:divide-x divide-border">
          <CorteColuna titulo="Maior volume (prestador)" itens={cortes.prestadores} formatValue={tooltipValor} />
          <CorteColuna titulo="Por equipe" itens={cortes.equipes} formatValue={tooltipValor} />
          <CorteColuna titulo="Por centro de custo" itens={cortes.centrosCusto} formatValue={tooltipValor} />
        </div>
      </Card>
    </div>
  )
}

function SequenciaLinha({
  label,
  valor,
  tone,
}: {
  label: string
  valor: number
  tone: "neutral" | "success" | "danger"
}) {
  const cor = tone === "success" ? "text-emerald-700" : tone === "danger" ? "text-red-700" : "text-foreground"
  return (
    <div className="flex items-center justify-between text-sm">
      <span className="text-muted-foreground">{label}</span>
      <span className={`font-semibold tabular-nums ${cor}`}>{valor}</span>
    </div>
  )
}

function CorteColuna({
  titulo,
  itens,
  formatValue,
}: {
  titulo: string
  itens: Array<[string, number]>
  formatValue: (v: number) => string
}) {
  return (
    <div className="p-5">
      <p className="text-xs font-medium text-muted-foreground mb-3">{titulo}</p>
      {itens.length === 0 ? (
        <p className="text-sm text-muted-foreground">Sem dados ainda.</p>
      ) : (
        <div className="space-y-2">
          {itens.map(([nome, valor]) => (
            <div key={nome} className="flex items-center justify-between gap-3 text-sm">
              <span className="text-foreground truncate">{nome}</span>
              <span className="font-medium tabular-nums text-right shrink-0">{formatValue(valor)}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
