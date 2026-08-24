"use server"

import { createAdminClient } from "@/lib/supabase-server"
import { revalidatePath } from "next/cache"
import { requireAuth, requireRole, scopeToTenantOrGlobal } from "@/lib/auth-utils"
import { enviarEmailAtualizacao as enviarEmailAtualizacaoResend } from "@/lib/email"
import type { NovaAtualizacao } from "@/types/atualizacao"

function visivelParaPapel(roles: string[] | null, tipoAcesso: string): boolean {
  return !roles || roles.length === 0 || roles.includes(tipoAcesso)
}

export async function listarAtualizacoesParaUsuario() {
  const ctx = await requireAuth()
  const supabase = await createAdminClient()
  const agora = new Date().toISOString()

  let query = scopeToTenantOrGlobal(
    supabase.from("atualizacoes").select("*").eq("status", "PUBLISHED").eq("exibir_na_plataforma", true),
    ctx,
  )
  query = query.or(`publish_at.is.null,publish_at.lte.${agora}`)
  query = query.or(`expires_at.is.null,expires_at.gt.${agora}`)
  query = query.order("created_at", { ascending: false })

  const { data, error } = await query

  if (error) {
    console.error("[v0] Erro ao listar atualizações:", error)
    return []
  }

  if (ctx.isSuperAdmin) return data || []

  return (data || []).filter((row) => visivelParaPapel(row.roles, ctx.tipoAcesso))
}

export async function obterBannerDestaque() {
  const ctx = await requireAuth()
  const supabase = await createAdminClient()
  const agora = new Date().toISOString()

  let query = scopeToTenantOrGlobal(
    supabase
      .from("atualizacoes")
      .select("*")
      .eq("status", "PUBLISHED")
      .eq("exibir_na_plataforma", true)
      .eq("destaque", true),
    ctx,
  )
  query = query.or(`publish_at.is.null,publish_at.lte.${agora}`)
  query = query.or(`expires_at.is.null,expires_at.gt.${agora}`)
  query = query.order("created_at", { ascending: false })

  const { data, error } = await query

  if (error) {
    console.error("[v0] Erro ao buscar banner de destaque:", error)
    return null
  }

  const candidatas = ctx.isSuperAdmin
    ? data || []
    : (data || []).filter((row) => visivelParaPapel(row.roles, ctx.tipoAcesso))

  if (candidatas.length === 0) return null

  const { data: dispensadas } = await supabase
    .from("atualizacao_interacoes")
    .select("atualizacao_id")
    .eq("colaborador_id", ctx.colaboradorId)
    .not("dispensado_em", "is", null)

  const dispensadasIds = new Set((dispensadas || []).map((d) => d.atualizacao_id))

  return candidatas.find((row) => !dispensadasIds.has(row.id)) || null
}

async function upsertInteracao(
  atualizacaoId: string,
  colaboradorId: string,
  campo: "visualizado_em" | "dispensado_em",
) {
  const supabase = await createAdminClient()

  const { data: existente } = await supabase
    .from("atualizacao_interacoes")
    .select("id")
    .eq("atualizacao_id", atualizacaoId)
    .eq("colaborador_id", colaboradorId)
    .maybeSingle()

  if (existente) {
    await supabase
      .from("atualizacao_interacoes")
      .update({ [campo]: new Date().toISOString() })
      .eq("id", existente.id)
    return
  }

  await supabase.from("atualizacao_interacoes").insert({
    atualizacao_id: atualizacaoId,
    colaborador_id: colaboradorId,
    [campo]: new Date().toISOString(),
  })
}

export async function marcarAtualizacaoVisualizada(atualizacaoId: string) {
  const ctx = await requireAuth()
  await upsertInteracao(atualizacaoId, ctx.colaboradorId, "visualizado_em")
}

export async function dispensarAtualizacao(atualizacaoId: string) {
  const ctx = await requireAuth()
  await upsertInteracao(atualizacaoId, ctx.colaboradorId, "dispensado_em")
  revalidatePath("/", "layout")
}

// ===== Super Admin =====

export async function criarAtualizacao(dados: NovaAtualizacao) {
  const ctx = await requireRole([])
  const supabase = await createAdminClient()

  const { data, error } = await supabase
    .from("atualizacoes")
    .insert({
      titulo: dados.titulo,
      subtitulo: dados.subtitulo || null,
      descricao: dados.descricao,
      categoria: dados.categoria,
      imagem_url: dados.imagem_url || null,
      cta_texto: dados.cta_texto || null,
      cta_url: dados.cta_url || null,
      destaque: dados.destaque || false,
      exibir_na_plataforma: dados.exibir_na_plataforma ?? true,
      enviar_email: dados.enviar_email || false,
      publish_at: dados.publish_at || null,
      expires_at: dados.expires_at || null,
      tenant_id: dados.tenant_id ?? null,
      roles: dados.roles && dados.roles.length > 0 ? dados.roles : null,
      status: "DRAFT",
      criado_por: ctx.colaboradorId,
    })
    .select()
    .single()

  if (error) {
    console.error("[v0] Erro ao criar atualização:", error)
    throw new Error("Erro ao criar atualização")
  }

  revalidatePath("/atualizacoes")
  revalidatePath("/atualizacoes/gerenciar")
  return data
}

export async function atualizarAtualizacao(id: string, dados: Partial<NovaAtualizacao>) {
  await requireRole([])
  const supabase = await createAdminClient()

  const updateData: Record<string, unknown> = { updated_at: new Date().toISOString() }
  if (dados.titulo !== undefined) updateData.titulo = dados.titulo
  if (dados.subtitulo !== undefined) updateData.subtitulo = dados.subtitulo || null
  if (dados.descricao !== undefined) updateData.descricao = dados.descricao
  if (dados.categoria !== undefined) updateData.categoria = dados.categoria
  if (dados.imagem_url !== undefined) updateData.imagem_url = dados.imagem_url || null
  if (dados.cta_texto !== undefined) updateData.cta_texto = dados.cta_texto || null
  if (dados.cta_url !== undefined) updateData.cta_url = dados.cta_url || null
  if (dados.destaque !== undefined) updateData.destaque = dados.destaque
  if (dados.exibir_na_plataforma !== undefined) updateData.exibir_na_plataforma = dados.exibir_na_plataforma
  if (dados.enviar_email !== undefined) updateData.enviar_email = dados.enviar_email
  if (dados.publish_at !== undefined) updateData.publish_at = dados.publish_at
  if (dados.expires_at !== undefined) updateData.expires_at = dados.expires_at
  if (dados.tenant_id !== undefined) updateData.tenant_id = dados.tenant_id
  if (dados.roles !== undefined) updateData.roles = dados.roles && dados.roles.length > 0 ? dados.roles : null

  const { error } = await supabase.from("atualizacoes").update(updateData).eq("id", id)

  if (error) {
    console.error("[v0] Erro ao atualizar atualização:", error)
    throw new Error("Erro ao atualizar atualização")
  }

  revalidatePath("/atualizacoes")
  revalidatePath("/atualizacoes/gerenciar")
}

export async function duplicarAtualizacao(id: string) {
  const ctx = await requireRole([])
  const supabase = await createAdminClient()

  const { data: original, error: fetchError } = await supabase.from("atualizacoes").select("*").eq("id", id).single()

  if (fetchError || !original) {
    throw new Error("Atualização não encontrada")
  }

  const { data, error } = await supabase
    .from("atualizacoes")
    .insert({
      titulo: `${original.titulo} (cópia)`,
      subtitulo: original.subtitulo,
      descricao: original.descricao,
      categoria: original.categoria,
      imagem_url: original.imagem_url,
      cta_texto: original.cta_texto,
      cta_url: original.cta_url,
      destaque: false,
      exibir_na_plataforma: original.exibir_na_plataforma,
      enviar_email: original.enviar_email,
      publish_at: null,
      expires_at: null,
      tenant_id: original.tenant_id,
      roles: original.roles,
      status: "DRAFT",
      criado_por: ctx.colaboradorId,
    })
    .select()
    .single()

  if (error) {
    console.error("[v0] Erro ao duplicar atualização:", error)
    throw new Error("Erro ao duplicar atualização")
  }

  revalidatePath("/atualizacoes/gerenciar")
  return data
}

export async function ativarAtualizacao(id: string) {
  await requireRole([])
  const supabase = await createAdminClient()

  const { error } = await supabase
    .from("atualizacoes")
    .update({ status: "PUBLISHED", updated_at: new Date().toISOString() })
    .eq("id", id)

  if (error) {
    console.error("[v0] Erro ao ativar atualização:", error)
    throw new Error("Erro ao ativar atualização")
  }

  revalidatePath("/atualizacoes")
  revalidatePath("/atualizacoes/gerenciar")
}

export async function desativarAtualizacao(id: string) {
  await requireRole([])
  const supabase = await createAdminClient()

  const { error } = await supabase
    .from("atualizacoes")
    .update({ status: "INACTIVE", updated_at: new Date().toISOString() })
    .eq("id", id)

  if (error) {
    console.error("[v0] Erro ao desativar atualização:", error)
    throw new Error("Erro ao desativar atualização")
  }

  revalidatePath("/atualizacoes")
  revalidatePath("/atualizacoes/gerenciar")
}

export async function excluirAtualizacao(id: string) {
  await requireRole([])
  const supabase = await createAdminClient()

  const { data: atual } = await supabase.from("atualizacoes").select("status").eq("id", id).maybeSingle()

  if (!atual) {
    throw new Error("Atualização não encontrada")
  }

  // Só apaga de verdade rascunhos nunca publicados — qualquer coisa que já
  // foi ao ar mantém histórico, mesmo "excluída" pela UI.
  if (atual.status === "DRAFT") {
    const { error } = await supabase.from("atualizacoes").delete().eq("id", id)
    if (error) {
      console.error("[v0] Erro ao excluir atualização:", error)
      throw new Error("Erro ao excluir atualização")
    }
  } else {
    const { error } = await supabase
      .from("atualizacoes")
      .update({ status: "INACTIVE", updated_at: new Date().toISOString() })
      .eq("id", id)
    if (error) {
      console.error("[v0] Erro ao desativar atualização:", error)
      throw new Error("Erro ao desativar atualização")
    }
  }

  revalidatePath("/atualizacoes")
  revalidatePath("/atualizacoes/gerenciar")
}

// Só o suficiente para popular o seletor de carteira no formulário de
// atualizações — não é gestão de tenants (isso continua na Fase 4, em espera).
export async function listarTenantsParaSelecao() {
  await requireRole([])
  const supabase = await createAdminClient()

  const { data } = await supabase.from("tenants").select("id, nome").order("nome", { ascending: true })
  return data || []
}

export type FiltroAtualizacaoAdmin = "publicadas" | "rascunhos" | "agendadas" | "desativadas" | "todas"

function calcularStatusExibicao(row: { status: string; publish_at: string | null; expires_at: string | null }) {
  if (row.status === "DRAFT") return "Rascunho"
  if (row.status === "INACTIVE") return "Desativada"
  const agora = new Date()
  if (row.publish_at && new Date(row.publish_at) > agora) return "Agendada"
  if (row.expires_at && new Date(row.expires_at) < agora) return "Expirada"
  return "Ativa"
}

export async function listarAtualizacoesAdmin(filtro: FiltroAtualizacaoAdmin = "todas") {
  await requireRole([])
  const supabase = await createAdminClient()

  const { data, error } = await supabase.from("atualizacoes").select("*").order("created_at", { ascending: false })

  if (error) {
    console.error("[v0] Erro ao listar atualizações:", error)
    throw new Error("Erro ao listar atualizações")
  }

  const comStatus = (data || []).map((row) => ({ ...row, status_exibicao: calcularStatusExibicao(row) }))

  if (filtro === "todas") return comStatus

  // "Desativadas" agrupa tanto o que o Super Admin desligou manualmente
  // quanto o que expirou sozinho — os 4 painéis da UI cobrem os 5 estados.
  const mapa: Record<Exclude<FiltroAtualizacaoAdmin, "todas">, string[]> = {
    publicadas: ["Ativa"],
    rascunhos: ["Rascunho"],
    agendadas: ["Agendada"],
    desativadas: ["Desativada", "Expirada"],
  }

  return comStatus.filter((row) => mapa[filtro].includes(row.status_exibicao))
}

export async function contarDestinatariosAtualizacao(targeting: { tenantId?: string | null; roles?: string[] | null }) {
  await requireRole([])
  const supabase = await createAdminClient()

  let query = supabase
    .from("colaboradores")
    .select("id, tipo_acesso")
    .eq("ativo", true)
    .eq("is_super_admin", false)

  if (targeting.tenantId) {
    query = query.eq("tenant_id", targeting.tenantId)
  }

  const { data, error } = await query

  if (error) {
    console.error("[v0] Erro ao contar destinatários:", error)
    return 0
  }

  if (!targeting.roles || targeting.roles.length === 0) {
    return data?.length || 0
  }

  return (data || []).filter((c) => targeting.roles!.includes(c.tipo_acesso)).length
}

export async function enviarEmailDaAtualizacao(id: string) {
  await requireRole([])
  const supabase = await createAdminClient()

  const { data: atualizacao, error: fetchError } = await supabase
    .from("atualizacoes")
    .select("*")
    .eq("id", id)
    .maybeSingle()

  if (fetchError || !atualizacao) {
    throw new Error("Atualização não encontrada")
  }

  let query = supabase
    .from("colaboradores")
    .select("id, nome_completo, email, tipo_acesso")
    .eq("ativo", true)
    .eq("is_super_admin", false)

  if (atualizacao.tenant_id) {
    query = query.eq("tenant_id", atualizacao.tenant_id)
  }

  const { data: candidatos, error: candidatosError } = await query

  if (candidatosError) {
    console.error("[v0] Erro ao buscar destinatários:", candidatosError)
    throw new Error("Erro ao buscar destinatários")
  }

  const destinatarios = (candidatos || []).filter((c) => visivelParaPapel(atualizacao.roles, c.tipo_acesso))

  const { data: jaEnviados } = await supabase.from("email_envios").select("colaborador_id").eq("atualizacao_id", id)
  const jaEnviadosIds = new Set((jaEnviados || []).map((e) => e.colaborador_id))

  let enviados = 0
  let pulados = 0
  let falhados = 0

  for (const destinatario of destinatarios) {
    if (jaEnviadosIds.has(destinatario.id) || !destinatario.email) {
      pulados++
      continue
    }

    const { data: envio, error: envioError } = await supabase
      .from("email_envios")
      .insert({
        atualizacao_id: id,
        colaborador_id: destinatario.id,
        email: destinatario.email,
        status: "pendente",
      })
      .select("id")
      .single()

    if (envioError || !envio) {
      pulados++
      continue
    }

    try {
      await enviarEmailAtualizacaoResend({
        destinatario: destinatario.email,
        nome: destinatario.nome_completo,
        titulo: atualizacao.titulo,
        subtitulo: atualizacao.subtitulo,
        descricao: atualizacao.descricao,
        imagemUrl: atualizacao.imagem_url,
        cta: atualizacao.cta_texto && atualizacao.cta_url ? { label: atualizacao.cta_texto, url: atualizacao.cta_url } : null,
      })
      await supabase
        .from("email_envios")
        .update({ status: "enviado", enviado_em: new Date().toISOString() })
        .eq("id", envio.id)
      enviados++
    } catch (erro) {
      console.error("[v0] Erro ao enviar e-mail de atualização:", erro)
      await supabase
        .from("email_envios")
        .update({ status: "falhou", erro: erro instanceof Error ? erro.message : "Erro desconhecido" })
        .eq("id", envio.id)
      falhados++
    }
  }

  revalidatePath("/atualizacoes/gerenciar")
  return { enviados, pulados, falhados }
}

export async function obterEstatisticasAtualizacao(id: string) {
  await requireRole([])
  const supabase = await createAdminClient()

  const [enviados, falhados, pendentes, visualizados, dispensados] = await Promise.all([
    supabase.from("email_envios").select("*", { count: "exact", head: true }).eq("atualizacao_id", id).eq("status", "enviado"),
    supabase.from("email_envios").select("*", { count: "exact", head: true }).eq("atualizacao_id", id).eq("status", "falhou"),
    supabase.from("email_envios").select("*", { count: "exact", head: true }).eq("atualizacao_id", id).eq("status", "pendente"),
    supabase
      .from("atualizacao_interacoes")
      .select("*", { count: "exact", head: true })
      .eq("atualizacao_id", id)
      .not("visualizado_em", "is", null),
    supabase
      .from("atualizacao_interacoes")
      .select("*", { count: "exact", head: true })
      .eq("atualizacao_id", id)
      .not("dispensado_em", "is", null),
  ])

  return {
    emailsEnviados: enviados.count || 0,
    emailsFalhados: falhados.count || 0,
    emailsPendentes: pendentes.count || 0,
    visualizacoes: visualizados.count || 0,
    dispensas: dispensados.count || 0,
  }
}
