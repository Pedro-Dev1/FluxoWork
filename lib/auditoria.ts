import { createAdminClient } from "./supabase-server"

// Sem "use server" de propósito, mesmo motivo de lib/notificacoes.ts: uma
// função de auditoria exportada de um arquivo "use server" viraria uma RPC
// pública que qualquer cliente autenticado poderia chamar pra forjar
// entradas de log arbitrárias. Só código já autorizado (dentro de
// app/actions/*.ts, depois de requireRole([])) deve importar daqui.

export async function registrarAuditoria(params: {
  colaboradorId: string
  tenantId: string | null
  acao: string
  tabela?: string
  registroId?: string
  detalhes?: Record<string, unknown>
}): Promise<void> {
  try {
    const supabase = await createAdminClient()

    await supabase.from("audit_log").insert({
      colaborador_id: params.colaboradorId,
      tenant_id: params.tenantId,
      acao: params.acao,
      tabela: params.tabela || null,
      registro_id: params.registroId || null,
      detalhes: params.detalhes || null,
    })
  } catch (error) {
    // Uma falha ao registrar auditoria nunca pode quebrar a ação real que a
    // disparou.
    console.error("[v0] Erro ao registrar auditoria:", error)
  }
}
