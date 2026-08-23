"use client"

import { Button } from "@/components/ui/button"
import { CheckCircle, XCircle } from "lucide-react"
import { formatCurrency } from "@/lib/utils"
import { useState } from "react"
import { responderSolicitacaoProrrogacao } from "@/app/actions/pedidos"
import { useRouter } from "next/navigation"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Input } from "@/components/ui/input"
import { toast } from "sonner"

interface Pedido {
  id: string
  colaborador_id: string
  valor_total: number
  created_at: string
  data_limite_anexo_nota: string
  motivo_prorrogacao: string
  data_solicitacao_prorrogacao: string
  colaborador: {
    nome_completo: string
    salario: number
  }
}

interface SolicitacoesProrrogacaoListProps {
  solicitacoes: Pedido[]
}

export function SolicitacoesProrrogacaoList({ solicitacoes }: SolicitacoesProrrogacaoListProps) {
  const [loading, setLoading] = useState<string | null>(null)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [acaoSelecionada, setAcaoSelecionada] = useState<"aprovar" | "negar" | null>(null)
  const [pedidoSelecionado, setPedidoSelecionado] = useState<Pedido | null>(null)
  const [observacao, setObservacao] = useState("")
  const [novaData, setNovaData] = useState("")
  const router = useRouter()

  const handleAbrirDialog = (pedido: Pedido, acao: "aprovar" | "negar") => {
    setPedidoSelecionado(pedido)
    setAcaoSelecionada(acao)
    setDialogOpen(true)
  }

  const handleResponder = async () => {
    if (!pedidoSelecionado || !acaoSelecionada) return

    try {
      setLoading(pedidoSelecionado.id)

      let diasExtensao: number | undefined
      if (acaoSelecionada === "aprovar") {
        if (!novaData) {
          toast.error("Por favor, selecione a nova data limite")
          return
        }
        const dataEscolhida = new Date(novaData + "T12:00:00")
        const hoje = new Date()
        diasExtensao = Math.ceil((dataEscolhida.getTime() - hoje.getTime()) / (1000 * 60 * 60 * 24))

        if (diasExtensao < 1) {
          toast.error("A nova data deve ser futura")
          return
        }
      }

      await responderSolicitacaoProrrogacao(
        pedidoSelecionado.id,
        acaoSelecionada === "aprovar",
        observacao,
        diasExtensao,
      )
      toast.success(acaoSelecionada === "aprovar" ? "Prorrogação aprovada" : "Solicitação negada")
      setDialogOpen(false)
      setObservacao("")
      setNovaData("")
      setPedidoSelecionado(null)
      setAcaoSelecionada(null)
      router.refresh()
    } catch (error) {
      console.error("[v0] Erro ao responder solicitação:", error)
      toast.error(error instanceof Error ? error.message : "Erro ao processar solicitação")
    } finally {
      setLoading(null)
    }
  }

  if (solicitacoes.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <p className="text-sm font-medium text-foreground mb-1">Nenhuma solicitação pendente</p>
        <p className="text-sm text-text-tertiary">Todas as solicitações de prorrogação foram processadas.</p>
      </div>
    )
  }

  return (
    <>
      <p className="text-sm text-text-secondary mb-3">
        <span className="font-medium text-foreground tabular-nums">{solicitacoes.length}</span>{" "}
        {solicitacoes.length === 1 ? "solicitação pendente" : "solicitações pendentes"}
      </p>

      <div className="space-y-3">
        {solicitacoes.map((solicitacao) => {
          const prazoExpirado = new Date(solicitacao.data_limite_anexo_nota).getTime() < new Date().getTime()
          const diasAtrasado = Math.ceil(
            (new Date().getTime() - new Date(solicitacao.data_limite_anexo_nota).getTime()) / (1000 * 60 * 60 * 24),
          )

          return (
            <div
              key={solicitacao.id}
              className={`rounded-lg border border-border bg-card p-4 ${prazoExpirado ? "border-l-4 border-l-danger" : ""}`}
            >
              <div className="flex items-start justify-between gap-3 mb-3">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-sm font-medium text-foreground">{solicitacao.colaborador.nome_completo}</span>
                  <span className="text-sm text-text-tertiary tabular-nums">{formatCurrency(solicitacao.valor_total)}</span>
                  <span className="text-xs text-text-tertiary tabular-nums">
                    Prazo original: {new Date(solicitacao.data_limite_anexo_nota).toLocaleDateString("pt-BR")}
                  </span>
                  {prazoExpirado && (
                    <span className="text-xs font-medium text-danger tabular-nums">
                      {diasAtrasado} {diasAtrasado === 1 ? "dia" : "dias"} atrasado
                    </span>
                  )}
                </div>
                <span className="text-xs text-text-tertiary tabular-nums shrink-0">
                  Solicitado em{" "}
                  {new Date(solicitacao.data_solicitacao_prorrogacao).toLocaleDateString("pt-BR", {
                    day: "2-digit",
                    month: "2-digit",
                    year: "numeric",
                  })}
                </span>
              </div>

              <div className="rounded-control bg-surface px-3 py-2 mb-3">
                <p className="text-xs text-text-tertiary mb-0.5">Motivo da solicitação</p>
                <p className="text-sm text-text-secondary">{solicitacao.motivo_prorrogacao}</p>
              </div>

              <div className="flex gap-2">
                <Button
                  size="sm"
                  onClick={() => handleAbrirDialog(solicitacao, "aprovar")}
                  disabled={loading === solicitacao.id}
                  className="bg-success hover:bg-success/90 text-white"
                >
                  <CheckCircle className="w-3.5 h-3.5 mr-1.5" />
                  Aprovar
                </Button>
                <Button
                  size="sm"
                  onClick={() => handleAbrirDialog(solicitacao, "negar")}
                  disabled={loading === solicitacao.id}
                  variant="outline"
                  className="border-danger text-danger hover:bg-danger-subtle hover:text-danger"
                >
                  <XCircle className="w-3.5 h-3.5 mr-1.5" />
                  Negar
                </Button>
              </div>
            </div>
          )
        })}
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {acaoSelecionada === "aprovar" ? "Aprovar Prorrogação de Prazo" : "Negar Solicitação"}
            </DialogTitle>
            <DialogDescription>
              {acaoSelecionada === "aprovar"
                ? "Configure o novo prazo para o colaborador anexar a nota fiscal."
                : "Informe o motivo da negação da solicitação."}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            {acaoSelecionada === "aprovar" && (
              <div>
                <Label htmlFor="novaData">Nova Data Limite *</Label>
                <Input
                  id="novaData"
                  type="date"
                  value={novaData}
                  onChange={(e) => setNovaData(e.target.value)}
                  min={new Date(Date.now() + 86400000).toISOString().split("T")[0]}
                  className="mt-2"
                />
                {novaData && (
                  <p className="text-xs text-muted-foreground mt-1">
                    Novo prazo: {new Date(novaData + "T12:00:00").toLocaleDateString("pt-BR")}
                  </p>
                )}
              </div>
            )}
            <div>
              <Label htmlFor="observacao">
                {acaoSelecionada === "aprovar" ? "Observação (opcional)" : "Motivo da Negação *"}
              </Label>
              <Textarea
                id="observacao"
                placeholder={
                  acaoSelecionada === "aprovar"
                    ? "Adicione uma observação sobre a prorrogação..."
                    : "Explique o motivo da negação..."
                }
                value={observacao}
                onChange={(e) => setObservacao(e.target.value)}
                rows={4}
                className="mt-2"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setDialogOpen(false)
                setObservacao("")
                setNovaData("")
                setPedidoSelecionado(null)
                setAcaoSelecionada(null)
              }}
              disabled={!!loading}
            >
              Cancelar
            </Button>
            <Button
              onClick={handleResponder}
              disabled={
                !!loading ||
                (acaoSelecionada === "negar" && !observacao.trim()) ||
                (acaoSelecionada === "aprovar" && !novaData)
              }
              className={acaoSelecionada === "aprovar" ? "bg-green-600 hover:bg-green-700" : ""}
            >
              {loading ? "Processando..." : acaoSelecionada === "aprovar" ? "Aprovar" : "Negar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
