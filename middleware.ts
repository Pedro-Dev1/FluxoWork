import { NextResponse, type NextRequest } from "next/server"
import { verifyAndParse } from "./lib/session-crypto"

// Chamadas de fora (Vercel Cron, webhook da Pagar.me) nunca têm o cookie de
// sessão — cada uma dessas rotas já valida sua própria autenticação
// (Bearer CRON_SECRET / Basic Auth do webhook) e precisa responder 401/200
// JSON direto, não um redirect 307 pra /login, que quebraria o cron e faria
// a Pagar.me tratar a entrega como falha e reenviar.
const ROTAS_EXTERNAS_AUTOAUTENTICADAS = ["/api/cron/", "/api/webhooks/"]

export async function middleware(request: NextRequest) {
  if (ROTAS_EXTERNAS_AUTOAUTENTICADAS.some((rota) => request.nextUrl.pathname.startsWith(rota))) {
    return NextResponse.next()
  }

  const response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  })

  response.headers.set("x-pathname", request.nextUrl.pathname)

  const sessionCookie = request.cookies.get("fluxopay_session")
  const session = await verifyAndParse<{ tipoAcesso: string; isSuperAdmin?: boolean }>(sessionCookie?.value)

  const publicRoutes = ["/login", "/setup", "/faq", "/termos", "/privacidade", "/esqueci-senha", "/redefinir-senha"]
  const isPublicRoute = publicRoutes.some((route) => request.nextUrl.pathname.startsWith(route))

  // Se não estiver logado e tentar acessar rota protegida, redirecionar para login
  if (!session && !isPublicRoute) {
    return NextResponse.redirect(new URL("/login", request.url))
  }

  // Se estiver logado como Colaborador, só pode acessar meus-pagamentos
  if (session?.tipoAcesso === "Colaborador") {
    if (!request.nextUrl.pathname.startsWith("/meus-pagamentos")) {
      return NextResponse.redirect(new URL("/meus-pagamentos", request.url))
    }
  }

  // /admin/* é exclusivo do Super Admin — cada page ali já tem seu próprio
  // guard, isso é defesa em profundidade pra quem tentar acessar direto pela URL.
  if (request.nextUrl.pathname.startsWith("/admin") && !session?.isSuperAdmin) {
    return NextResponse.redirect(new URL("/", request.url))
  }

  return response
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)"],
}
