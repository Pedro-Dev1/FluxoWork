import { cn } from "@/lib/utils"
import type { StatusPedido } from "@/types/pedido"

const STATUS_MAP: Record<StatusPedido, { label: string; className: string }> = {
  pendente_gerente: { label: "Aguardando gerente", className: "bg-neutral-state-subtle text-neutral-state" },
  pendente_financeiro: { label: "Aguardando financeiro", className: "bg-neutral-state-subtle text-neutral-state" },
  aprovado: { label: "Aprovado", className: "bg-success-subtle text-success" },
  recusado: { label: "Recusado", className: "bg-danger-subtle text-danger" },
  correcao: { label: "Correção solicitada", className: "bg-warning-subtle text-warning" },
  pago: { label: "Pago", className: "bg-success-subtle text-success" },
  nota_recebida: { label: "Nota recebida", className: "bg-neutral-state-subtle text-neutral-state" },
  aguardando_prorrogacao: { label: "Prorrogação solicitada", className: "bg-warning-subtle text-warning" },
  prorrogacao_negada: { label: "Prorrogação negada", className: "bg-danger-subtle text-danger" },
  expirado: { label: "Expirado", className: "bg-danger-subtle text-danger" },
}

export function StatusBadge({ status, className }: { status: StatusPedido | string; className?: string }) {
  const config = STATUS_MAP[status as StatusPedido] ?? { label: status, className: "bg-neutral-state-subtle text-neutral-state" }
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-control px-2 py-0.5 text-xs font-medium whitespace-nowrap",
        config.className,
        className,
      )}
    >
      {config.label}
    </span>
  )
}
