import { AlertCircle } from "lucide-react"

export function AdminErroCarregamento({ mensagem }: { mensagem?: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center border border-danger/30 bg-danger-subtle rounded-lg">
      <AlertCircle className="h-8 w-8 text-danger mb-3" />
      <p className="text-sm font-medium text-foreground mb-1">Não foi possível carregar esta página</p>
      <p className="text-sm text-text-tertiary max-w-md">
        {mensagem || "Ocorreu um erro ao buscar os dados. Recarregue a página ou tente novamente em instantes."}
      </p>
    </div>
  )
}
