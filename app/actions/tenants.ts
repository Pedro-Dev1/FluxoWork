"use server"

import { createAdminClient } from "@/lib/supabase-server"
import { revalidatePath } from "next/cache"
import { requireRole } from "@/lib/auth-utils"
import { registrarAuditoria } from "@/lib/auditoria"

export async function obterEstatisticasAdmin() {
  await requireRole([])
  const supabase = await createAdminClient()

  const [totalCarteiras, totalColaboradores, totalSuperAdmins] = await Promise.all([
    supabase.from("tenants").select("*", { count: "exact", head: true }),
    supabase.from("colaboradores").select("*", { count: "exact", head: true }).eq("is_super_admin", false),
    supabase.from("colaboradores").select("*", { count: "exact", head: true }).eq("is_super_admin", true),
  ])

  return {
    totalCarteiras: totalCarteiras.count || 0,
    totalColaboradores: totalColaboradores.count || 0,
    totalSuperAdmins: totalSuperAdmins.count || 0,
  }
}

export async function listarTenants() {
  await requireRole([])
  const supabase = await createAdminClient()

  const { data: tenants, error } = await supabase.from("tenants").select("*").order("nome", { ascending: true })

  if (error) {
    console.error("[v0] Erro ao listar carteiras:", error)
    throw new Error("Erro ao listar carteiras")
  }

  const { data: colaboradores } = await supabase
    .from("colaboradores")
    .select("tenant_id")
    .eq("is_super_admin", false)
    .not("tenant_id", "is", null)

  const contagemPorTenant = new Map<string, number>()
  for (const c of colaboradores || []) {
    contagemPorTenant.set(c.tenant_id, (contagemPorTenant.get(c.tenant_id) || 0) + 1)
  }

  return (tenants || []).map((t) => ({ ...t, total_colaboradores: contagemPorTenant.get(t.id) || 0 }))
}

export async function criarTenant(dados: { nome: string; slug: string }) {
  const ctx = await requireRole([])
  const supabase = await createAdminClient()

  const nome = dados.nome.trim()
  const slug = dados.slug.trim().toLowerCase()

  if (!nome || !slug) {
    throw new Error("Nome e identificador são obrigatórios")
  }

  const { data: existente } = await supabase.from("tenants").select("id").ilike("slug", slug).maybeSingle()

  if (existente) {
    throw new Error("Já existe uma carteira com esse identificador")
  }

  const { data, error } = await supabase
    .from("tenants")
    .insert({ nome, slug, created_by: ctx.colaboradorId })
    .select()
    .single()

  if (error) {
    console.error("[v0] Erro ao criar carteira:", error)
    throw new Error("Erro ao criar carteira")
  }

  await registrarAuditoria({
    colaboradorId: ctx.colaboradorId,
    tenantId: data.id,
    acao: "carteira_criada",
    tabela: "tenants",
    registroId: data.id,
    detalhes: { nome: data.nome, slug: data.slug },
  })

  revalidatePath("/admin/carteiras")
  return data
}

export async function ativarTenant(id: string) {
  const ctx = await requireRole([])
  const supabase = await createAdminClient()

  const { error } = await supabase.from("tenants").update({ ativo: true }).eq("id", id)

  if (error) {
    console.error("[v0] Erro ao ativar carteira:", error)
    throw new Error("Erro ao ativar carteira")
  }

  await registrarAuditoria({
    colaboradorId: ctx.colaboradorId,
    tenantId: id,
    acao: "carteira_ativada",
    tabela: "tenants",
    registroId: id,
  })

  revalidatePath("/admin/carteiras")
}

export async function desativarTenant(id: string) {
  const ctx = await requireRole([])
  const supabase = await createAdminClient()

  const { error } = await supabase.from("tenants").update({ ativo: false }).eq("id", id)

  if (error) {
    console.error("[v0] Erro ao desativar carteira:", error)
    throw new Error("Erro ao desativar carteira")
  }

  await registrarAuditoria({
    colaboradorId: ctx.colaboradorId,
    tenantId: id,
    acao: "carteira_desativada",
    tabela: "tenants",
    registroId: id,
  })

  revalidatePath("/admin/carteiras")
}

export async function listarColaboradoresGlobal() {
  await requireRole([])
  const supabase = await createAdminClient()

  const { data, error } = await supabase
    .from("colaboradores")
    .select("id, nome_completo, email, tipo_acesso, ativo, tenant:tenants(id, nome)")
    .eq("is_super_admin", false)
    .order("nome_completo", { ascending: true })

  if (error) {
    console.error("[v0] Erro ao listar colaboradores:", error)
    throw new Error("Erro ao listar colaboradores")
  }

  return data || []
}

export async function listarSuperAdmins() {
  await requireRole([])
  const supabase = await createAdminClient()

  const { data, error } = await supabase
    .from("colaboradores")
    .select("id, nome_completo, email")
    .eq("is_super_admin", true)
    .order("nome_completo", { ascending: true })

  if (error) {
    console.error("[v0] Erro ao listar Super Admins:", error)
    throw new Error("Erro ao listar Super Admins")
  }

  return data || []
}

export async function promoverSuperAdmin(colaboradorId: string) {
  const ctx = await requireRole([])
  const supabase = await createAdminClient()

  const { data: alvo, error: fetchError } = await supabase
    .from("colaboradores")
    .select("id, nome_completo, email, tenant_id, is_super_admin")
    .eq("id", colaboradorId)
    .maybeSingle()

  if (fetchError || !alvo) {
    throw new Error("Colaborador não encontrado")
  }

  if (alvo.is_super_admin) return

  const { error } = await supabase
    .from("colaboradores")
    .update({ is_super_admin: true, tenant_id: null })
    .eq("id", colaboradorId)

  if (error) {
    console.error("[v0] Erro ao promover Super Admin:", error)
    throw new Error("Erro ao promover a Super Admin")
  }

  await registrarAuditoria({
    colaboradorId: ctx.colaboradorId,
    tenantId: null,
    acao: "super_admin_promovido",
    tabela: "colaboradores",
    registroId: colaboradorId,
    detalhes: { nome: alvo.nome_completo, email: alvo.email, tenant_anterior: alvo.tenant_id },
  })

  revalidatePath("/admin/usuarios")
}

export async function revogarSuperAdmin(colaboradorId: string, novoTenantId: string) {
  const ctx = await requireRole([])
  const supabase = await createAdminClient()

  const { count } = await supabase
    .from("colaboradores")
    .select("*", { count: "exact", head: true })
    .eq("is_super_admin", true)

  if ((count || 0) <= 1) {
    throw new Error("Não é possível revogar o último Super Admin do sistema")
  }

  const { data: alvo, error: fetchError } = await supabase
    .from("colaboradores")
    .select("id, nome_completo, email")
    .eq("id", colaboradorId)
    .eq("is_super_admin", true)
    .maybeSingle()

  if (fetchError || !alvo) {
    throw new Error("Colaborador não encontrado")
  }

  const { data: tenantDestino } = await supabase.from("tenants").select("id").eq("id", novoTenantId).maybeSingle()

  if (!tenantDestino) {
    throw new Error("Carteira de destino não encontrada")
  }

  const { error } = await supabase
    .from("colaboradores")
    .update({ is_super_admin: false, tenant_id: novoTenantId })
    .eq("id", colaboradorId)

  if (error) {
    console.error("[v0] Erro ao revogar Super Admin:", error)
    throw new Error("Erro ao revogar Super Admin")
  }

  await registrarAuditoria({
    colaboradorId: ctx.colaboradorId,
    tenantId: novoTenantId,
    acao: "super_admin_revogado",
    tabela: "colaboradores",
    registroId: colaboradorId,
    detalhes: { nome: alvo.nome_completo, email: alvo.email, novo_tenant: novoTenantId },
  })

  revalidatePath("/admin/usuarios")
}

export async function listarAuditoria(limite = 100) {
  await requireRole([])
  const supabase = await createAdminClient()

  const { data, error } = await supabase
    .from("audit_log")
    .select(
      `
      id, acao, tabela, registro_id, detalhes, created_at,
      colaborador:colaboradores!colaborador_id (nome_completo, email),
      tenant:tenants (nome)
    `,
    )
    .order("created_at", { ascending: false })
    .limit(limite)

  if (error) {
    console.error("[v0] Erro ao listar auditoria:", error)
    throw new Error("Erro ao listar auditoria")
  }

  return data || []
}
