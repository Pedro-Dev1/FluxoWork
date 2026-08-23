"use server"

import { createAdminClient } from "@/lib/supabase-server"
import { headers } from "next/headers"
import { CURRENT_TERMS_VERSION } from "@/types/terms"
import type { TermsAcceptanceWithUser } from "@/types/terms"
import { requireAuth, requireRole, scopeToTenant } from "@/lib/auth-utils"

/**
 * Verifica se o usuário aceitou a versão atual dos termos
 */
export async function checkTermsAcceptance(userId?: string): Promise<{
  accepted: boolean
  version: string
  acceptedAt: string | null
}> {
  const ctx = await requireAuth()

  if (userId && userId !== ctx.colaboradorId && !ctx.isSuperAdmin) {
    return { accepted: false, version: CURRENT_TERMS_VERSION, acceptedAt: null }
  }

  const targetUserId = userId || ctx.colaboradorId

  const supabase = await createAdminClient()

  const { data, error } = await supabase
    .from("user_terms_acceptance")
    .select("*")
    .eq("user_id", targetUserId)
    .eq("version", CURRENT_TERMS_VERSION)
    .eq("accepted", true)
    .maybeSingle()

  if (error) {
    console.error("[v0] Error checking terms acceptance:", error)
    return { accepted: false, version: CURRENT_TERMS_VERSION, acceptedAt: null }
  }

  return {
    accepted: !!data,
    version: CURRENT_TERMS_VERSION,
    acceptedAt: data?.accepted_at || null,
  }
}

/**
 * Registra o aceite dos termos pelo usuário
 */
export async function acceptTerms(userId: string): Promise<{
  success: boolean
  error?: string
}> {
  const ctx = await requireAuth()

  if (userId !== ctx.colaboradorId && !ctx.isSuperAdmin) {
    return { success: false, error: "Usuário não identificado" }
  }

  const supabase = await createAdminClient()
  const headersList = await headers()

  const userAgent = headersList.get("user-agent") || null
  const forwardedFor = headersList.get("x-forwarded-for")
  const realIp = headersList.get("x-real-ip")
  const ipAddress = forwardedFor?.split(",")[0].trim() || realIp || null

  let deviceInfo = null
  if (userAgent) {
    const isMobile = /mobile|android|iphone|ipad|tablet/i.test(userAgent)
    const isWindows = /windows/i.test(userAgent)
    const isMac = /macintosh|mac os/i.test(userAgent)
    const isLinux = /linux/i.test(userAgent)

    let os = "Unknown"
    if (isWindows) os = "Windows"
    else if (isMac) os = "macOS"
    else if (isLinux) os = "Linux"
    else if (/android/i.test(userAgent)) os = "Android"
    else if (/iphone|ipad/i.test(userAgent)) os = "iOS"

    deviceInfo = JSON.stringify({
      type: isMobile ? "mobile" : "desktop",
      os,
    })
  }

  const { data: existing } = await supabase
    .from("user_terms_acceptance")
    .select("id")
    .eq("user_id", userId)
    .eq("version", CURRENT_TERMS_VERSION)
    .maybeSingle()

  if (existing) {
    const { error } = await supabase
      .from("user_terms_acceptance")
      .update({
        accepted: true,
        accepted_at: new Date().toISOString(),
        ip_address: ipAddress,
        device_info: deviceInfo,
        user_agent: userAgent,
      })
      .eq("id", existing.id)

    if (error) {
      console.error("[v0] Error updating terms acceptance:", error)
      return { success: false, error: "Erro ao registrar aceite dos termos" }
    }
  } else {
    const { error } = await supabase.from("user_terms_acceptance").insert({
      user_id: userId,
      version: CURRENT_TERMS_VERSION,
      accepted: true,
      accepted_at: new Date().toISOString(),
      ip_address: ipAddress,
      device_info: deviceInfo,
      user_agent: userAgent,
      tenant_id: ctx.tenantId,
    })

    if (error) {
      console.error("[v0] Error inserting terms acceptance:", error)
      return { success: false, error: "Erro ao registrar aceite dos termos" }
    }
  }

  return { success: true }
}

/**
 * Recusa os termos (para fins de auditoria)
 */
export async function declineTerms(userId: string): Promise<{
  success: boolean
  error?: string
}> {
  const ctx = await requireAuth()

  if (userId !== ctx.colaboradorId && !ctx.isSuperAdmin) {
    return { success: false, error: "Usuário não identificado" }
  }

  const supabase = await createAdminClient()
  const headersList = await headers()

  const userAgent = headersList.get("user-agent") || null
  const forwardedFor = headersList.get("x-forwarded-for")
  const realIp = headersList.get("x-real-ip")
  const ipAddress = forwardedFor?.split(",")[0].trim() || realIp || null

  const { error } = await supabase.from("user_terms_acceptance").insert({
    user_id: userId,
    version: CURRENT_TERMS_VERSION,
    accepted: false,
    accepted_at: null,
    ip_address: ipAddress,
    device_info: null,
    user_agent: userAgent,
    tenant_id: ctx.tenantId,
  })

  if (error && error.code !== "23505") {
    console.error("[v0] Error recording terms decline:", error)
  }

  return { success: true }
}

/**
 * Lista todos os aceites de termos (para admin)
 */
export async function listTermsAcceptances(filters?: {
  version?: string
  accepted?: boolean
  search?: string
}): Promise<{
  data: TermsAcceptanceWithUser[]
  error?: string
}> {
  // Nomes de papel corrigidos: o enum real é Adm/Gerente, não Admin/Gestor —
  // do jeito que estava, essa checagem nunca batia com ninguém.
  let ctx
  try {
    ctx = await requireRole(["Adm", "Financeiro", "Gerente"])
  } catch {
    return { data: [], error: "Sem permissão para visualizar aceites" }
  }

  const supabase = await createAdminClient()

  // user_terms_acceptance referencia colaboradores por user_id — escopamos
  // via essa lista de ids em vez de scopeToTenant direto na query.
  const { data: colaboradoresDoTenant } = await scopeToTenant(supabase.from("colaboradores").select("id"), ctx)
  const idsDoTenant = colaboradoresDoTenant?.map((c: { id: string }) => c.id) || []

  if (idsDoTenant.length === 0) {
    return { data: [] }
  }

  let query = supabase
    .from("user_terms_acceptance")
    .select("*")
    .in("user_id", idsDoTenant)
    .order("created_at", { ascending: false })

  if (filters?.version) {
    query = query.eq("version", filters.version)
  }

  if (filters?.accepted !== undefined) {
    query = query.eq("accepted", filters.accepted)
  }

  const { data: acceptances, error } = await query

  if (error) {
    console.error("[v0] Error listing terms acceptances:", error)
    return { data: [], error: "Erro ao listar aceites" }
  }

  const userIds = [...new Set(acceptances?.map((a) => a.user_id) || [])]

  const { data: colaboradores } = await supabase.from("colaboradores").select("id, nome_completo, email").in("id", userIds)

  const colaboradoresMap = new Map(
    colaboradores?.map((c) => [c.id, { nome_completo: c.nome_completo, email: c.email }]) || [],
  )

  const result: TermsAcceptanceWithUser[] = (acceptances || []).map((acceptance) => ({
    ...acceptance,
    colaborador: colaboradoresMap.get(acceptance.user_id),
  }))

  if (filters?.search) {
    const searchLower = filters.search.toLowerCase()
    return {
      data: result.filter(
        (item) =>
          item.colaborador?.nome_completo.toLowerCase().includes(searchLower) ||
          item.colaborador?.email.toLowerCase().includes(searchLower),
      ),
    }
  }

  return { data: result }
}

/**
 * Obtém estatísticas de aceite de termos
 */
export async function getTermsAcceptanceStats(): Promise<{
  totalUsers: number
  acceptedCurrentVersion: number
  pendingAcceptance: number
  declinedCurrentVersion: number
}> {
  let ctx
  try {
    ctx = await requireRole(["Adm", "Financeiro", "Gerente"])
  } catch {
    return {
      totalUsers: 0,
      acceptedCurrentVersion: 0,
      pendingAcceptance: 0,
      declinedCurrentVersion: 0,
    }
  }

  const supabase = await createAdminClient()

  const { count: totalUsers } = await scopeToTenant(
    supabase.from("colaboradores").select("*", { count: "exact", head: true }).eq("ativo", true),
    ctx,
  )

  const { data: colaboradoresDoTenant } = await scopeToTenant(supabase.from("colaboradores").select("id"), ctx)
  const idsDoTenant = colaboradoresDoTenant?.map((c: { id: string }) => c.id) || []

  if (idsDoTenant.length === 0) {
    return { totalUsers: totalUsers || 0, acceptedCurrentVersion: 0, pendingAcceptance: totalUsers || 0, declinedCurrentVersion: 0 }
  }

  const { count: acceptedCurrentVersion } = await supabase
    .from("user_terms_acceptance")
    .select("*", { count: "exact", head: true })
    .in("user_id", idsDoTenant)
    .eq("version", CURRENT_TERMS_VERSION)
    .eq("accepted", true)

  const { count: declinedCurrentVersion } = await supabase
    .from("user_terms_acceptance")
    .select("*", { count: "exact", head: true })
    .in("user_id", idsDoTenant)
    .eq("version", CURRENT_TERMS_VERSION)
    .eq("accepted", false)

  return {
    totalUsers: totalUsers || 0,
    acceptedCurrentVersion: acceptedCurrentVersion || 0,
    pendingAcceptance: (totalUsers || 0) - (acceptedCurrentVersion || 0),
    declinedCurrentVersion: declinedCurrentVersion || 0,
  }
}
