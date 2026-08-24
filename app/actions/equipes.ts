"use server"

import { createAdminClient } from "@/lib/supabase-server"
import { revalidatePath } from "next/cache"
import type { Equipe, NovaEquipe } from "@/types/equipe"
import { requireAuth, requireRole, scopeToTenant, type AuthContext } from "@/lib/auth-utils"

export async function listarEquipes(): Promise<Equipe[]> {
  const ctx = await requireAuth()
  const supabase = await createAdminClient()

  const { data, error } = await scopeToTenant(
    supabase.from("equipes").select(`
      *,
      supervisor:colaboradores!supervisor_id(
        id,
        nome_completo
      )
    `),
    ctx,
  ).order("nome", { ascending: true })

  if (error) {
    console.error("[v0] Erro ao listar equipes:", error)
    throw new Error("Erro ao listar equipes")
  }

  // Busca todos os vínculos gerente/equipe de uma vez (sem tenant_id próprio,
  // é uma tabela de junção — o isolamento vem do fato de só usarmos abaixo os
  // equipe.id que já passaram pelo scopeToTenant acima).
  const { data: todasGerentesData } = await supabase.from("gerentes_equipes").select(`
      equipe_id,
      colaboradores!gerentes_equipes_gerente_id_fkey(
        id,
        nome_completo
      )
    `)

  const gerentesPorEquipe = new Map<string, any[]>()
  todasGerentesData?.forEach((item: any) => {
    if (!gerentesPorEquipe.has(item.equipe_id)) {
      gerentesPorEquipe.set(item.equipe_id, [])
    }
    if (item.colaboradores) {
      gerentesPorEquipe.get(item.equipe_id)!.push(item.colaboradores)
    }
  })

  const equipesComGerentes = (data || []).map((equipe: any) => ({
    ...equipe,
    gerentes: gerentesPorEquipe.get(equipe.id) || [],
  }))

  return equipesComGerentes
}

export async function criarEquipe(equipe: NovaEquipe): Promise<void> {
  const ctx = await requireRole(["Adm", "Financeiro"])
  const supabase = await createAdminClient()

  const { error } = await supabase.from("equipes").insert({
    nome: equipe.nome,
    supervisor_id: equipe.supervisor_id,
    tenant_id: ctx.tenantId,
  })

  if (error) {
    console.error("[v0] Erro ao criar equipe:", error)
    throw new Error("Erro ao criar equipe")
  }

  revalidatePath("/cadastros/equipes")
}

export async function atualizarEquipe(id: string, equipe: Partial<NovaEquipe>): Promise<void> {
  const ctx = await requireRole(["Adm", "Financeiro"])
  const supabase = await createAdminClient()

  const { data, error } = await scopeToTenant(supabase.from("equipes").update(equipe).eq("id", id), ctx)
    .select("id")
    .maybeSingle()

  if (error) {
    console.error("[v0] Erro ao atualizar equipe:", error)
    throw new Error("Erro ao atualizar equipe")
  }

  if (!data) {
    throw new Error("Equipe não encontrada")
  }

  revalidatePath("/cadastros/equipes")
}

export async function deletarEquipe(id: string): Promise<void> {
  const ctx = await requireRole(["Adm", "Financeiro"])
  const supabase = await createAdminClient()

  const { data, error } = await scopeToTenant(supabase.from("equipes").delete().eq("id", id), ctx)
    .select("id")
    .maybeSingle()

  if (error) {
    console.error("[v0] Erro ao deletar equipe:", error)
    throw new Error("Erro ao deletar equipe")
  }

  if (!data) {
    throw new Error("Equipe não encontrada")
  }

  revalidatePath("/cadastros/equipes")
}

export async function listarSupervisores(): Promise<Array<{ id: string; nome_completo: string }>> {
  const ctx = await requireAuth()
  const supabase = await createAdminClient()

  const { data, error } = await scopeToTenant(
    supabase.from("colaboradores").select("id, nome_completo").eq("tipo_acesso", "Supervisor"),
    ctx,
  ).order("nome_completo", { ascending: true })

  if (error) {
    console.error("[v0] Erro ao listar supervisores:", error)
    throw new Error("Erro ao listar supervisores")
  }

  return data || []
}

export async function listarColaboradoresPorEquipe(equipeId: string) {
  const ctx = await requireAuth()
  const supabase = await createAdminClient()

  const { data, error } = await scopeToTenant(
    supabase.from("colaboradores").select("id, nome_completo, tipo_acesso, email").eq("equipe_id", equipeId),
    ctx,
  ).order("nome_completo", { ascending: true })

  if (error) {
    console.error("[v0] Erro ao listar colaboradores da equipe:", error)
    throw new Error("Erro ao listar colaboradores da equipe")
  }

  return data || []
}

async function verificarEquipeNoTenant(
  equipeId: string,
  ctx: Pick<AuthContext, "tenantId" | "isSuperAdmin" | "viewingAsTenantId">,
) {
  const supabase = await createAdminClient()
  const { data } = await scopeToTenant(supabase.from("equipes").select("id").eq("id", equipeId), ctx).maybeSingle()
  return !!data
}

export async function vincularGerenteEquipe(gerenteId: string, equipeId: string): Promise<void> {
  const ctx = await requireRole(["Adm", "Financeiro"])
  const supabase = await createAdminClient()

  const [equipeOk, gerente] = await Promise.all([
    verificarEquipeNoTenant(equipeId, ctx),
    scopeToTenant(supabase.from("colaboradores").select("id").eq("id", gerenteId), ctx).maybeSingle(),
  ])

  if (!equipeOk || !gerente.data) {
    throw new Error("Equipe ou gerente não encontrado")
  }

  const { data: existing } = await supabase
    .from("gerentes_equipes")
    .select("*")
    .eq("gerente_id", gerenteId)
    .eq("equipe_id", equipeId)
    .single()

  if (existing) {
    return // Already linked
  }

  const { error } = await supabase.from("gerentes_equipes").insert({
    gerente_id: gerenteId,
    equipe_id: equipeId,
  })

  if (error) {
    console.error("[v0] Erro ao vincular gerente à equipe:", error)
    throw new Error("Erro ao vincular gerente à equipe")
  }

  revalidatePath("/cadastros/equipes")
}

export async function desvincularGerenteEquipe(gerenteId: string, equipeId: string): Promise<void> {
  const ctx = await requireRole(["Adm", "Financeiro"])

  if (!(await verificarEquipeNoTenant(equipeId, ctx))) {
    throw new Error("Equipe não encontrada")
  }

  const supabase = await createAdminClient()

  const { error } = await supabase
    .from("gerentes_equipes")
    .delete()
    .eq("gerente_id", gerenteId)
    .eq("equipe_id", equipeId)

  if (error) {
    console.error("[v0] Erro ao desvincular gerente da equipe:", error)
    throw new Error("Erro ao desvincular gerente da equipe")
  }

  revalidatePath("/cadastros/equipes")
}

export async function listarEquipesPorGerente(gerenteId: string): Promise<Equipe[]> {
  const ctx = await requireAuth()
  const supabase = await createAdminClient()

  const { data, error } = await supabase
    .from("gerentes_equipes")
    .select(`
      equipe:equipes(
        *,
        supervisor:colaboradores!supervisor_id(
          id,
          nome_completo
        )
      )
    `)
    .eq("gerente_id", gerenteId)

  if (error) {
    console.error("[v0] Erro ao listar equipes do gerente:", error)
    throw new Error("Erro ao listar equipes do gerente")
  }

  const equipes = data?.map((item: any) => item.equipe).filter(Boolean) || []

  if (ctx.isSuperAdmin) return equipes
  return equipes.filter((equipe: any) => equipe.tenant_id === ctx.tenantId)
}

export async function listarGerentes(): Promise<Array<{ id: string; nome_completo: string }>> {
  const ctx = await requireAuth()
  const supabase = await createAdminClient()

  const { data, error } = await scopeToTenant(
    supabase.from("colaboradores").select("id, nome_completo").eq("tipo_acesso", "Gerente"),
    ctx,
  ).order("nome_completo", { ascending: true })

  if (error) {
    console.error("[v0] Erro ao listar gerentes:", error)
    throw new Error("Erro ao listar gerentes")
  }

  return data || []
}

export async function listarColaboradoresSemEquipe(): Promise<
  Array<{ id: string; nome_completo: string; tipo_acesso: string; email: string }>
> {
  const ctx = await requireAuth()
  const supabase = await createAdminClient()

  const { data, error } = await scopeToTenant(
    supabase.from("colaboradores").select("id, nome_completo, tipo_acesso, email").is("equipe_id", null),
    ctx,
  ).order("nome_completo", { ascending: true })

  if (error) {
    console.error("[v0] Erro ao listar colaboradores sem equipe:", error)
    throw new Error("Erro ao listar colaboradores sem equipe")
  }

  return data || []
}

export async function vincularColaboradorEquipe(colaboradorId: string, equipeId: string): Promise<void> {
  const ctx = await requireRole(["Adm", "Financeiro"])

  if (!(await verificarEquipeNoTenant(equipeId, ctx))) {
    throw new Error("Equipe não encontrada")
  }

  const supabase = await createAdminClient()

  const { data, error } = await scopeToTenant(
    supabase.from("colaboradores").update({ equipe_id: equipeId }).eq("id", colaboradorId),
    ctx,
  )
    .select("id")
    .maybeSingle()

  if (error) {
    console.error("[v0] Erro ao vincular colaborador:", error)
    throw new Error("Erro ao vincular colaborador a equipe")
  }

  if (!data) {
    throw new Error("Colaborador não encontrado")
  }

  revalidatePath("/cadastros/equipes")
  revalidatePath(`/cadastros/equipes/${equipeId}`)
}

export async function removerColaboradorEquipe(colaboradorId: string): Promise<void> {
  const ctx = await requireRole(["Adm", "Financeiro"])
  const supabase = await createAdminClient()

  const { data, error } = await scopeToTenant(
    supabase.from("colaboradores").update({ equipe_id: null }).eq("id", colaboradorId),
    ctx,
  )
    .select("id")
    .maybeSingle()

  if (error) {
    console.error("[v0] Erro ao remover colaborador da equipe:", error)
    throw new Error("Erro ao remover colaborador da equipe")
  }

  if (!data) {
    throw new Error("Colaborador não encontrado")
  }

  revalidatePath("/cadastros/equipes")
  revalidatePath("/colaboradores")
}

export async function buscarEquipe(equipeId: string): Promise<Equipe | null> {
  const ctx = await requireAuth()
  const supabase = await createAdminClient()

  const { data, error } = await scopeToTenant(
    supabase.from("equipes").select(`
      *,
      supervisor:colaboradores!supervisor_id(
        id,
        nome_completo
      )
    `).eq("id", equipeId),
    ctx,
  ).single()

  if (error) {
    console.error("[v0] Erro ao buscar equipe:", error)
    return null
  }

  const { data: gerentesData } = await supabase
    .from("gerentes_equipes")
    .select(`
      colaboradores!gerentes_equipes_gerente_id_fkey(
        id,
        nome_completo
      )
    `)
    .eq("equipe_id", equipeId)

  const gerentes = gerentesData?.map((item: any) => item.colaboradores).filter(Boolean) || []

  return { ...data, gerentes }
}

export async function sincronizarGerentesEquipe(equipeId: string, gerentesIds: string[]): Promise<void> {
  const ctx = await requireRole(["Adm", "Financeiro"])

  if (!(await verificarEquipeNoTenant(equipeId, ctx))) {
    throw new Error("Equipe não encontrada")
  }

  const supabase = await createAdminClient()

  // Restringe aos gerentes que de fato pertencem à mesma carteira da equipe,
  // ignorando qualquer id fora do tenant que por acaso venha no array.
  const gerentesValidosIds = new Set<string>()
  if (gerentesIds.length > 0) {
    const { data: gerentesValidos } = await scopeToTenant(
      supabase.from("colaboradores").select("id").in("id", gerentesIds),
      ctx,
    )
    gerentesValidos?.forEach((g: { id: string }) => gerentesValidosIds.add(g.id))
  }

  await supabase.from("gerentes_equipes").delete().eq("equipe_id", equipeId)

  if (gerentesValidosIds.size > 0) {
    const inserts = Array.from(gerentesValidosIds).map((gerenteId) => ({
      gerente_id: gerenteId,
      equipe_id: equipeId,
    }))

    const { error } = await supabase.from("gerentes_equipes").insert(inserts)

    if (error) {
      console.error("[v0] Erro ao sincronizar gerentes da equipe:", error)
      throw new Error("Erro ao sincronizar gerentes da equipe")
    }
  }

  revalidatePath("/cadastros/equipes")
}
