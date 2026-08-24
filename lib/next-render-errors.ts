// Erros de controle interno do Next.js (ex.: "Dynamic server usage" durante
// a tentativa de pré-renderização estática, ou os erros especiais de
// redirect()/notFound()) usam exceções que precisam continuar subindo sem
// serem tratadas como erro de aplicação — se um try/catch engolir isso, o
// Next perde a detecção de rota dinâmica ou um redirect() vira tela de erro
// em vez de navegar. Sempre checar isso antes de tratar um erro capturado
// numa Server Component que usa cookies()/redirect()/notFound() por baixo.
export function ehErroDeControleDoNext(error: unknown): boolean {
  if (!error || typeof error !== "object") return false
  const digest = (error as { digest?: unknown }).digest
  return typeof digest === "string" && (digest === "DYNAMIC_SERVER_USAGE" || digest.startsWith("NEXT_"))
}
