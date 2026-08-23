// Assina/verifica o cookie de sessão com HMAC-SHA256 via Web Crypto — funciona
// tanto no runtime Node (Server Actions) quanto no runtime Edge (middleware.ts),
// sem depender de nenhuma biblioteca nova.

function getSecret(): string {
  const secret = process.env.SESSION_SECRET
  if (!secret) {
    throw new Error("SESSION_SECRET não configurado. Defina essa variável de ambiente antes de autenticar usuários.")
  }
  return secret
}

function base64UrlEncode(bytes: Uint8Array): string {
  let binary = ""
  for (const b of bytes) binary += String.fromCharCode(b)
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "")
}

function base64UrlDecode(str: string): Uint8Array {
  const padLength = (4 - (str.length % 4)) % 4
  const padded = str.replace(/-/g, "+").replace(/_/g, "/") + "=".repeat(padLength)
  const binary = atob(padded)
  const bytes = new Uint8Array(binary.length)
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i)
  return bytes
}

async function getKey(): Promise<CryptoKey> {
  const enc = new TextEncoder()
  return crypto.subtle.importKey("raw", enc.encode(getSecret()), { name: "HMAC", hash: "SHA-256" }, false, [
    "sign",
    "verify",
  ])
}

export async function signPayload(payload: unknown): Promise<string> {
  const payloadB64 = base64UrlEncode(new TextEncoder().encode(JSON.stringify(payload)))
  const key = await getKey()
  const signature = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(payloadB64))
  const sigB64 = base64UrlEncode(new Uint8Array(signature))
  return `${payloadB64}.${sigB64}`
}

export async function verifyAndParse<T = unknown>(raw: string | undefined | null): Promise<T | null> {
  if (!raw) return null

  const parts = raw.split(".")
  if (parts.length !== 2) return null
  const [payloadB64, sigB64] = parts

  try {
    const key = await getKey()
    const valid = await crypto.subtle.verify(
      "HMAC",
      key,
      base64UrlDecode(sigB64) as BufferSource,
      new TextEncoder().encode(payloadB64) as BufferSource,
    )
    if (!valid) return null

    const json = new TextDecoder().decode(base64UrlDecode(payloadB64))
    return JSON.parse(json) as T
  } catch {
    return null
  }
}
