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

  const session = await verifyAndParse<SessionData>(sessionCookie?.value)
  if (!session) {
    // Cookie ausente, malformado ou com assinatura inválida — trata como
    // deslogado e limpa o cookie em vez de deixá-lo pendurado.
    if (sessionCookie) cookieStore.delete("fluxopay_session")
    return null
  }
  return session
}

export async function destroySession() {
  const cookieStore = await cookies()
  cookieStore.delete("fluxopay_session")
}
