import { cn } from "@/lib/utils"
import type { CategoriaAtualizacao } from "@/types/atualizacao"

const CATEGORIA_MAP: Record<CategoriaAtualizacao, string> = {
  "NOVA FUNCIONALIDADE": "bg-success-subtle text-success",
  MELHORIA: "bg-success-subtle text-success",
  IMPORTANTE: "bg-danger-subtle text-danger",
  AVISO: "bg-warning-subtle text-warning",
  FINANCEIRO: "bg-neutral-state-subtle text-neutral-state",
  "AÇÃO NECESSÁRIA": "bg-warning-subtle text-warning",
  INFORMATIVO: "bg-neutral-state-subtle text-neutral-state",
}

export function CategoriaAtualizacaoBadge({ categoria, className }: { categoria: string; className?: string }) {
  const classeCor = CATEGORIA_MAP[categoria as CategoriaAtualizacao] ?? "bg-neutral-state-subtle text-neutral-state"
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-control px-2 py-0.5 text-xs font-medium whitespace-nowrap",
        classeCor,
        className,
      )}
    >
      {categoria}
    </span>
  )
}
