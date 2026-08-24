import { getSupabaseServerClient } from "./supabase-server"
import { getSession } from "./session"

export async function getUsuarioLogado() {
  const session = await getSession()

  if (!session) return null

  const supabase = await getSupabaseServerClient()
  const { data: colaborador } = await supabase
    .from("colaboradores")
    .select("*")
    .eq("id", session.colaboradorId)
    .single()

  return colaborador
}

export function podeAcessarRota(tipoAcesso: string, rota: string): boolean {
  const permissoes: Record<string, string[]> = {
    Adm: ["/", "/colaboradores", "/pedidos", "/aprovacoes"],
    Financeiro: ["/", "/aprovacoes", "/meus-pagamentos"],
    Gerente: ["/", "/aprovacoes", "/meus-pagamentos"],
    Supervisor: ["/", "/pedidos", "/meus-pagamentos"],
    Colaborador: ["/", "/meus-pagamentos"],
  }

  return permissoes[tipoAcesso]?.includes(rota) || false
}

export interface AuthContext {
  colaboradorId: string
  tipoAcesso: string
  // Carteira EFETIVA para fins de escopo de consulta: se um Super Admin
  // escolheu "ver como" uma carteira específica, isso já vem preenchido com
  // o id dela em vez de null — scopeToTenant()/scopeToTenantOrGlobal() nem
  // precisam saber que é um Super Admin nesse caso.
  tenantId: string | null
  // Permissão REAL da conta — nunca muda por causa de "ver como". Continua
  // valendo pra requireRole([]) (telas exclusivas de Super Admin) mesmo
  // enquanto o contexto de visualização está focado numa carteira.
  isSuperAdmin: boolean
  // null = Super Admin vendo todas as carteiras juntas (comportamento de
  // sempre). Preenchido = Super Admin focado numa carteira específica.
  // Sempre null para quem não é Super Admin.
  viewingAsTenantId: string | null
}

// Helper compartilhado para as actions em app/actions/*.ts validarem sessão e
// papel de forma consistente, em vez de cada arquivo reimplementar seu
// próprio checkPermission() ad-hoc.
export async function requireAuth(): Promise<AuthContext> {
  const session = await getSession()

  if (!session) {
    throw new Error("Não autenticado")
  }

  const viewingAsTenantId = session.isSuperAdmin ? session.viewingAsTenantId ?? null : null

  return {
    colaboradorId: session.colaboradorId,
    tipoAcesso: session.tipoAcesso,
    tenantId: viewingAsTenantId ?? session.tenantId,
    isSuperAdmin: session.isSuperAdmin,
    viewingAsTenantId,
  }
}

export async function requireRole(roles: string[]): Promise<AuthContext> {
  const ctx = await requireAuth()

  // Super Admin nunca perde acesso às telas exclusivas dele por causa de
  // "ver como" — é a permissão real da conta, não o contexto de visualização.
  if (ctx.isSuperAdmin) return ctx

  if (!roles.includes(ctx.tipoAcesso)) {
    throw new Error("Sem permissão para esta ação")
  }

  return ctx
}

// Aplica o filtro de carteira em uma query do Supabase. Super Admin sem
// "ver como" definido não tem tenant_id (é null) e o filtro é pulado — ele
// consulta todas as carteiras. Com "ver como" definido, ctx.tenantId já é a
// carteira escolhida e o filtro se aplica normalmente, como se fosse um
// Adm comum daquela carteira.
//
// Q fica deliberadamente sem constraint estrutural (em vez de
// `Q extends { eq: ... }`): com os tipos de query builder do Supabase, uma
// constraint recursiva faz o TypeScript estourar profundidade de
// instanciação ("Type instantiation is excessively deep"). O cast para `any`
// aqui dentro é seguro porque toda chamada real passa um builder que tem
// `.eq()`; o tipo de retorno da função continua sendo Q para quem chama.
export function scopeToTenant<Q>(
  query: Q,
  ctx: Pick<AuthContext, "tenantId" | "isSuperAdmin" | "viewingAsTenantId">,
): Q {
  if (ctx.isSuperAdmin && !ctx.viewingAsTenantId) return query
  return (query as any).eq("tenant_id", ctx.tenantId)
}

// Para tabelas de conteúdo institucional (ex.: atualizacoes), onde
// tenant_id NULL significa o OPOSTO de scopeToTenant(): "visível em todas
// as carteiras", não "sem carteira". Por isso não reaproveita scopeToTenant
// — aqui o usuário sempre vê tanto o conteúdo global (tenant_id null)
// quanto o da própria carteira; Super Admin sem "ver como" continua vendo tudo.
export function scopeToTenantOrGlobal<Q>(
  query: Q,
  ctx: Pick<AuthContext, "tenantId" | "isSuperAdmin" | "viewingAsTenantId">,
): Q {
  if (ctx.isSuperAdmin && !ctx.viewingAsTenantId) return query
  return (query as any).or(`tenant_id.is.null,tenant_id.eq.${ctx.tenantId}`)
}
