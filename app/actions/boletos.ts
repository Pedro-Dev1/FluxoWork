"use server"

import { getSupabaseServerClient } from "@/lib/supabase-server"
import { revalidatePath } from "next/cache"
import type { Boleto, CreateBoletoInput, UpdateBoletoInput } from "@/types/boleto"
import { requireAuth, requireRole, scopeToTenant } from "@/lib/auth-utils"

export async function listarBoletos() {
  const ctx = await requireAuth()
  const supabase = await getSupabaseServerClient()

  const { data, error } = await scopeToTenant(
    supabase
      .from("boletos")
      .select(`
      *,
      centro_custo:centros_custo(id, nome)
    `)
      .eq("ativo", true),
    ctx,
  ).order("banco", { ascending: true })

  if (error) {
    console.error("[v0] Erro ao listar boletos:", error)
    return []
  }

  return (data || []) as Boleto[]
}

export async function listarTodosBoletos() {
  const ctx = await requireAuth()
  const supabase = await getSupabaseServerClient()

  const { data, error } = await scopeToTenant(
    supabase.from("boletos").select(`
      *,
      centro_custo:centros_custo(id, nome)
    `),
    ctx,
  ).order("banco", { ascending: true })

  if (error) {
    console.error("[v0] Erro ao listar todos os boletos:", error)
    return []
  }

  return (data || []) as Boleto[]
}

export async function criarBoleto(input: CreateBoletoInput) {
  const ctx = await requireRole(["Adm", "Financeiro"])
  const supabase = await getSupabaseServerClient()

  if (!input.numero_boleto?.trim()) {
    return { success: false, error: "Número do boleto é obrigatório" }
  }

  if (!input.banco?.trim()) {
    return { success: false, error: "Banco é obrigatório" }
  }

  if (!input.agencia?.trim()) {
    return { success: false, error: "Agência é obrigatória" }
  }

  if (!input.conta?.trim()) {
    return { success: false, error: "Conta é obrigatória" }
  }

  if (input.centro_custo_id) {
    const { data: centroCusto } = await scopeToTenant(
      supabase.from("centros_custo").select("id").eq("id", input.centro_custo_id),
      ctx,
    ).maybeSingle()

    if (!centroCusto) {
      return { success: false, error: "Centro de custo não encontrado" }
    }
  }

  const { data: existente } = await scopeToTenant(
    supabase.from("boletos").select("id").eq("numero_boleto", input.numero_boleto),
    ctx,
  ).maybeSingle()

  if (existente) {
    return { success: false, error: "Este número de boleto já existe" }
  }

  const { data: boleto, error } = await supabase
    .from("boletos")
    .insert({
      numero_boleto: input.numero_boleto.trim(),
      banco: input.banco.trim(),
      agencia: input.agencia.trim(),
      conta: input.conta.trim(),
      tipo: input.tipo,
      centro_custo_id: input.centro_custo_id || null,
      ativo: true,
      tenant_id: ctx.tenantId,
    })
    .select(
      `
        *,
        centro_custo:centros_custo(id, nome)
      `,
    )
    .single()

  if (error) {
    console.error("[v0] Erro ao criar boleto:", error)
    return { success: false, error: error.message }
  }

  revalidatePath("/cadastros")
  return { success: true, boleto }
}

export async function atualizarBoleto(id: string, input: UpdateBoletoInput) {
  const ctx = await requireRole(["Adm", "Financeiro"])
  const supabase = await getSupabaseServerClient()

  if (input.centro_custo_id) {
    const { data: centroCusto } = await scopeToTenant(
      supabase.from("centros_custo").select("id").eq("id", input.centro_custo_id),
      ctx,
    ).maybeSingle()

    if (!centroCusto) {
      return { success: false, error: "Centro de custo não encontrado" }
    }
  }

  const { data: boleto, error } = await scopeToTenant(
    supabase
      .from("boletos")
      .update({
        ...(input.numero_boleto && { numero_boleto: input.numero_boleto.trim() }),
        ...(input.banco && { banco: input.banco.trim() }),
        ...(input.agencia && { agencia: input.agencia.trim() }),
        ...(input.conta && { conta: input.conta.trim() }),
        ...(input.tipo && { tipo: input.tipo }),
        ...(input.centro_custo_id !== undefined && { centro_custo_id: input.centro_custo_id }),
        ...(input.ativo !== undefined && { ativo: input.ativo }),
      })
      .eq("id", id),
    ctx,
  )
    .select(
      `
        *,
        centro_custo:centros_custo(id, nome)
      `,
    )
    .maybeSingle()

  if (error) {
    console.error("[v0] Erro ao atualizar boleto:", error)
    return { success: false, error: error.message }
  }

  if (!boleto) {
    return { success: false, error: "Boleto não encontrado" }
  }

  revalidatePath("/cadastros")
  return { success: true, boleto }
}

export async function deletarBoleto(id: string) {
  const ctx = await requireRole(["Adm", "Financeiro"])
  const supabase = await getSupabaseServerClient()

  const { data, error } = await scopeToTenant(supabase.from("boletos").delete().eq("id", id), ctx)
    .select("id")
    .maybeSingle()

  if (error) {
    console.error("[v0] Erro ao deletar boleto:", error)
    return { success: false, error: error.message }
  }

  if (!data) {
    return { success: false, error: "Boleto não encontrado" }
  }

  revalidatePath("/cadastros")
  return { success: true }
}
