"use server"

import { createAdminClient } from "@/lib/supabase-server"
import { revalidatePath } from "next/cache"
import type { CentroCusto } from "@/types/colaborador"
import { requireAuth, requireRole, scopeToTenant } from "@/lib/auth-utils"

export async function listarCentrosCusto(): Promise<CentroCusto[]> {
  const ctx = await requireAuth()
  const supabase = await createAdminClient()

  const { data, error } = await scopeToTenant(supabase.from("centros_custo").select("*"), ctx).order("numero", {
    ascending: true,
  })

  if (error) {
    console.error("[v0] Erro ao listar centros de custo:", error)
    throw new Error("Erro ao listar centros de custo")
  }

  return data || []
}

export async function criarCentroCusto(dados: { numero: string; nome: string }): Promise<void> {
  const ctx = await requireRole(["Adm", "Financeiro"])

  const supabase = await createAdminClient()

  const { error } = await supabase.from("centros_custo").insert({
    numero: dados.numero.trim(),
    nome: dados.nome.trim(),
    tenant_id: ctx.tenantId,
  })

  if (error) {
    if (error.code === "23505") {
      throw new Error("Já existe um centro de custo com esse número")
    }
    console.error("[v0] Erro ao criar centro de custo:", error)
    throw new Error("Erro ao criar centro de custo")
  }

  revalidatePath("/centros-custo")
  revalidatePath("/colaboradores")
}

export async function editarCentroCusto(id: string, dados: { numero: string; nome: string }): Promise<void> {
  const ctx = await requireRole(["Adm", "Financeiro"])

  const supabase = await createAdminClient()

  const { data, error } = await scopeToTenant(
    supabase
      .from("centros_custo")
      .update({
        numero: dados.numero.trim(),
        nome: dados.nome.trim(),
      })
      .eq("id", id),
    ctx,
  )
    .select("id")
    .maybeSingle()

  if (error) {
    if (error.code === "23505") {
      throw new Error("Já existe um centro de custo com esse número")
    }
    console.error("[v0] Erro ao editar centro de custo:", error)
    throw new Error("Erro ao editar centro de custo")
  }

  if (!data) {
    throw new Error("Centro de custo não encontrado")
  }

  revalidatePath("/centros-custo")
  revalidatePath("/colaboradores")
}

export async function excluirCentroCusto(id: string): Promise<void> {
  const ctx = await requireRole(["Adm", "Financeiro"])

  const supabase = await createAdminClient()

  const { data: centroNoTenant } = await scopeToTenant(
    supabase.from("centros_custo").select("id").eq("id", id),
    ctx,
  ).maybeSingle()

  if (!centroNoTenant) {
    throw new Error("Centro de custo não encontrado")
  }

  const { data: colaboradores } = await supabase.from("colaboradores").select("id").eq("centro_custo_id", id).limit(1)

  if (colaboradores && colaboradores.length > 0) {
    throw new Error("Não é possível excluir: existem colaboradores vinculados a este centro de custo")
  }

  const { error } = await supabase.from("centros_custo").delete().eq("id", id)

  if (error) {
    console.error("[v0] Erro ao excluir centro de custo:", error)
    throw new Error("Erro ao excluir centro de custo")
  }

  revalidatePath("/centros-custo")
}
