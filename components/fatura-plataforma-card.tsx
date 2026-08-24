import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ExternalLink, Receipt } from "lucide-react"
import type { FaturaPlataforma } from "@/types/fatura-plataforma"

const MOEDA = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" })
const MESES = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"]

const STATUS_LABEL: Record<string, string> = {
  pendente: "Pendente",
  emitida: "Aguardando pagamento",
  paga: "Paga",
  falhou: "Em processamento",
  cancelada: "Cancelada",
  vencida: "Vencida",
}

const STATUS_CLASS: Record<string, string> = {
  pendente: "bg-warning-subtle text-warning",
  emitida: "bg-accent text-primary",
  paga: "bg-success-subtle text-success",
  falhou: "bg-muted text-muted-foreground",
  cancelada: "bg-muted text-muted-foreground",
  vencida: "bg-danger-subtle text-danger",
}

function formatarData(data: string | null): string {
  if (!data) return "—"
  return new Date(`${data}T00:00:00`).toLocaleDateString("pt-BR")
}

// Visão somente-leitura da fatura mensal que a própria FluxoPay emite pra
// esta carteira — não usa a tabela `faturas` (documentos que o Adm sobe pro
// time ver); lê direto de `faturas_plataforma`, mesma fonte do painel Super
// Admin. Faturas com status "falhou" não mostram erro interno aqui — isso é
// diagnóstico pro Super Admin, não pro cliente.
export function FaturaPlataformaCard({ faturas }: { faturas: FaturaPlataforma[] }) {
  if (faturas.length === 0) return null

  return (
    <Card className="mb-6">
      <CardContent className="p-4">
        <div className="flex items-center gap-2 mb-3">
          <Receipt className="h-4 w-4 text-primary" />
          <h2 className="text-sm font-medium text-foreground">Mensalidade FluxoPay</h2>
        </div>

        <div className="space-y-2">
          {faturas.map((fatura) => (
            <div
              key={fatura.id}
              className="flex items-center justify-between gap-4 py-2 border-b border-border last:border-0"
            >
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-medium text-foreground">
                    {MESES[fatura.referencia_mes - 1]}/{fatura.referencia_ano}
                  </p>
                  <span
                    className={`inline-flex items-center rounded-control px-2 py-0.5 text-xs font-medium ${STATUS_CLASS[fatura.status] || "bg-muted text-muted-foreground"}`}
                  >
                    {STATUS_LABEL[fatura.status] || fatura.status}
                  </span>
                </div>
                <p className="text-xs text-text-tertiary">
                  {fatura.quantidade_usuarios_ativos} usuário{fatura.quantidade_usuarios_ativos === 1 ? "" : "s"} ativo
                  {fatura.quantidade_usuarios_ativos === 1 ? "" : "s"} · vencimento {formatarData(fatura.data_vencimento)}
                </p>
              </div>

              <div className="flex items-center gap-3 shrink-0">
                <p className="text-sm font-medium text-foreground tabular-nums">{MOEDA.format(fatura.valor_total)}</p>
                {fatura.boleto_url && (
                  <Button variant="outline" size="sm" asChild>
                    <a href={fatura.boleto_url} target="_blank" rel="noopener noreferrer">
                      <ExternalLink className="mr-1.5 h-3.5 w-3.5" />
                      Ver boleto
                    </a>
                  </Button>
                )}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
