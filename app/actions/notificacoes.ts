"use server"

import { createAdminClient } from "@/lib/supabase-server"
import { revalidatePath } from "next/cache"
import { requireAuth } from "@/lib/auth-utils"

export async function listarMinhasNotificacoes() {
  const ctx = await requireAuth()
  const supabase = await createAdminClient()

  const { data, error } = await supabase
    .from("notificacao_destinatarios")
    .select(
      `
      id,
      lido_em,
      created_at,
      notificacao:notificacoes (
        id,
        tipo,
        titulo,
        mensagem,
        cta_texto,
        cta_url,
        created_at
      )
    `,
    )
    .eq("colaborador_id", ctx.colaboradorId)
    .order("created_at", { ascending: false })
    .limit(50)

  if (error) {
    console.error("[v0] Erro ao listar notificações:", error)
    return []
  }

  return data || []
}

export async function contarNotificacoesNaoLidas() {
  const ctx = await requireAuth()
  const supabase = await createAdminClient()

  const { count, error } = await supabase
    .from("notificacao_destinatarios")
    .select("*", { count: "exact", head: true })
    .eq("colaborador_id", ctx.colaboradorId)
    .is("lido_em", null)

  if (error) {
    console.error("[v0] Erro ao contar notificações não lidas:", error)
    return 0
  }

  return count || 0
}

export async function marcarNotificacaoLida(id: string) {
  const ctx = await requireAuth()
  const supabase = await createAdminClient()

  const { error } = await supabase
    .from("notificacao_destinatarios")
    .update({ lido_em: new Date().toISOString() })
    .eq("id", id)
    .eq("colaborador_id", ctx.colaboradorId)

  if (error) {
    console.error("[v0] Erro ao marcar notificação como lida:", error)
    return { success: false }
  }

  revalidatePath("/", "layout")
  return { success: true }
}

export async function marcarTodasNotificacoesLidas() {
  const ctx = await requireAuth()
  const supabase = await createAdminClient()

  const { error } = await supabase
    .from("notificacao_destinatarios")
    .update({ lido_em: new Date().toISOString() })
    .eq("colaborador_id", ctx.colaboradorId)
    .is("lido_em", null)

  if (error) {
    console.error("[v0] Erro ao marcar todas as notificações como lidas:", error)
    return { success: false }
  }

  revalidatePath("/", "layout")
  return { success: true }
}
