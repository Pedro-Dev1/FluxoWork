import { cookies } from "next/headers"
import { signPayload, verifyAndParse } from "./session-crypto"

export interface SessionData {
  colaboradorId: string
  email: string
  nomeCompleto: string
  tipoAcesso: string
  cnpj?: string
  salario?: number
  tenantId: string | null
  isSuperAdmin: boolean
  // Só tem efeito quando isSuperAdmin é true: carteira que o Super Admin
  // escolheu focar no momento, em vez de ver todas as carteiras juntas.
  viewingAsTenantId?: string | null
}

export async function createSession(data: SessionData) {
  const cookieStore = await cookies()
  const signed = await signPayload(data)

  cookieStore.set("fluxopay_session", signed, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 7, // 7 dias
    path: "/",
  })
}

export async function getSession(): Promise<SessionData | null> {
  const cookieStore = await cookies()
  const sessionCookie = cookieStore.get("fluxopay_session")

  // getSession() é chamada também de Server Components (ex.: app/layout.tsx),
  // e o Next.js só permite escrever/apagar cookies em Server Actions, Route
  // Handlers ou middleware — nunca durante a renderização de um componente.
  // Por isso não apagamos o cookie inválido aqui; só tratamos como deslogado.
  // O middleware já bloqueia qualquer acesso com sessão inválida de qualquer
  // forma, e o cookie é substituído no próximo login.
  return await verifyAndParse<SessionData>(sessionCookie?.value)
}

export async function destroySession() {
  const cookieStore = await cookies()
  cookieStore.delete("fluxopay_session")
}
