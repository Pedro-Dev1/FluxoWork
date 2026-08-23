"use server"

import { createClient, createAdminClient } from "@/lib/supabase-server"
import { revalidatePath } from "next/cache"
import type { Fatura, StatusFatura, FaturaFormData } from "@/types/fatura"
import { requireAuth, requireRole, scopeToTenant } from "@/lib/auth-utils"

export async function getFaturas(colaboradorId?: string, isAdmin?: boolean) {
  const ctx = await requireAuth()
  const supabase = await createClient()

  if (isAdmin) {
    const { data, error } = await scopeToTenant(
      supabase.from("faturas").select(`
        *,
        colaboradores_permitidos:faturas_colaboradores(
          colaborador_id,
          colaborador:colaboradores(id, nome_completo, email)
        )
      `),
      ctx,
    ).order("created_at", { ascending: false })

    if (error) {
      console.error("[v0] Erro ao buscar faturas:", error)
      return []
    }

    return (data || []).map((f) => ({
      ...f,
      colaboradores_permitidos: f.colaboradores_permitidos?.map(
        (cp: { colaborador_id: string; colaborador: { id: string; nome_completo: string; email: string } }) => ({
          colaborador_id: cp.colaborador_id,
          colaborador: cp.colaborador
            ? {
                id: cp.colaborador.id,
                nome: cp.colaborador.nome_completo,
                email: cp.colaborador.email,
              }
            : undefined,
        }),
      ),
    })) as Fatura[]
  } else if (colaboradorId) {
    const { data: faturaIds, error: permError } = await supabase
      .from("faturas_colaboradores")
      .select("fatura_id")
      .eq("colaborador_id", colaboradorId)

    if (permError) {
      console.error("Erro ao buscar permissões:", permError)
      return []
    }

    if (!faturaIds || faturaIds.length === 0) {
      return []
    }

    const ids = faturaIds.map((f) => f.fatura_id)

    const { data, error } = await scopeToTenant(supabase.from("faturas").select("*").in("id", ids), ctx).order(
      "created_at",
      { ascending: false },
    )

    if (error) {
      console.error("[v0] Erro ao buscar faturas colaborador:", error)
      return []
    }

    return (data || []) as Fatura[]
  }

  return []
}

export async function getFaturaById(id: string) {
  const ctx = await requireAuth()
  const supabase = await createClient()

  const { data, error } = await scopeToTenant(
    supabase
      .from("faturas")
      .select(`
      *,
      colaboradores_permitidos:faturas_colaboradores(
        colaborador_id,
        colaborador:colaboradores(id, nome_completo, email)
      )
    `)
      .eq("id", id),
    ctx,
  ).single()

  if (error) {
    console.error("[v0] Erro ao buscar fatura:", error)
    return null
  }

  return {
    ...data,
    colaboradores_permitidos: data.colaboradores_permitidos?.map(
      (cp: { colaborador_id: string; colaborador: { id: string; nome_completo: string; email: string } }) => ({
        colaborador_id: cp.colaborador_id,
        colaborador: cp.colaborador
          ? {
              id: cp.colaborador.id,
              nome: cp.colaborador.nome_completo,
              email: cp.colaborador.email,
            }
          : undefined,
      }),
    ),
  } as Fatura
}

export async function createFatura(formData: FaturaFormData, pdfUrl: string, criadorId: string) {
  // Só Adm cria/edita/deleta fatura — mesma regra já aplicada hoje na UI
  // (app/faturas/page.tsx: canManageFaturas = isAdm).
  const ctx = await requireRole(["Adm"])
  const supabase = await createAdminClient()

  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
  const criadorIdFinal = uuidRegex.test(criadorId) ? criadorId : null

  const { data: fatura, error: faturaError } = await supabase
    .from("faturas")
    .insert({
      titulo: formData.titulo,
      descricao: formData.descricao,
      valor: formData.valor,
      data_vencimento: formData.data_vencimento,
      arquivo_pdf_url: pdfUrl,
      criado_por: criadorIdFinal,
      status: "pendente",
      tenant_id: ctx.tenantId,
    })
    .select()
    .single()

  if (faturaError) {
    console.error("[v0] Erro ao criar fatura:", {
      message: faturaError.message,
      details: faturaError.details,
      hint: faturaError.hint,
    })
    return { success: false, error: faturaError.message }
  }

  if (!fatura) {
    console.error("[v0] Nenhuma fatura retornada após insert")
    return { success: false, error: "Nenhuma fatura retornada" }
  }

  if (formData.colaboradores_ids.length > 0) {
    // Garante que só colaboradores da mesma carteira ganhem acesso à fatura.
    const { data: colaboradoresValidos } = await scopeToTenant(
      supabase.from("colaboradores").select("id").in("id", formData.colaboradores_ids),
      ctx,
    )
    const idsValidos = colaboradoresValidos?.map((c: { id: string }) => c.id) || []

    const colaboradoresData = idsValidos.map((colabId) => ({
      fatura_id: fatura.id,
      colaborador_id: colabId,
    }))

    if (colaboradoresData.length > 0) {
      const { error: permError } = await supabase.from("faturas_colaboradores").insert(colaboradoresData)

      if (permError) {
        console.error("[v0] Erro ao adicionar colaboradores:", {
          message: permError.message,
          details: permError.details,
        })
      }
    }
  }

  revalidatePath("/faturas")
  return { success: true, fatura }
}

export async function updateFaturaStatus(id: string, status: StatusFatura) {
  const ctx = await requireRole(["Adm"])
  const supabase = await createClient()

  const { data, error } = await scopeToTenant(
    supabase.from("faturas").update({ status, updated_at: new Date().toISOString() }).eq("id", id),
    ctx,
  )
    .select("id")
    .maybeSingle()

  if (error) {
    console.error("Erro ao atualizar status:", error)
    return { success: false, error: error.message }
  }

  if (!data) {
    return { success: false, error: "Fatura não encontrada" }
  }

  revalidatePath("/faturas")
  return { success: true }
}

export async function updateFatura(id: string, formData: Partial<FaturaFormData>) {
  const ctx = await requireRole(["Adm"])
  const supabase = await createClient()

  const updateData: Record<string, unknown> = {
    updated_at: new Date().toISOString(),
  }

  if (formData.titulo) updateData.titulo = formData.titulo
  if (formData.descricao !== undefined) updateData.descricao = formData.descricao
  if (formData.valor) updateData.valor = formData.valor
  if (formData.data_vencimento) updateData.data_vencimento = formData.data_vencimento

  const { data: faturaAtualizada, error } = await scopeToTenant(
    supabase.from("faturas").update(updateData).eq("id", id),
    ctx,
  )
    .select("id")
    .maybeSingle()

  if (error) {
    console.error("Erro ao atualizar fatura:", error)
    return { success: false, error: error.message }
  }

  if (!faturaAtualizada) {
    return { success: false, error: "Fatura não encontrada" }
  }

  if (formData.colaboradores_ids) {
    await supabase.from("faturas_colaboradores").delete().eq("fatura_id", id)

    if (formData.colaboradores_ids.length > 0) {
      const { data: colaboradoresValidos } = await scopeToTenant(
        supabase.from("colaboradores").select("id").in("id", formData.colaboradores_ids),
        ctx,
      )
      const idsValidos = colaboradoresValidos?.map((c: { id: string }) => c.id) || []

      const colaboradoresData = idsValidos.map((colabId) => ({
        fatura_id: id,
        colaborador_id: colabId,
      }))

      if (colaboradoresData.length > 0) {
        await supabase.from("faturas_colaboradores").insert(colaboradoresData)
      }
    }
  }

  revalidatePath("/faturas")
  return { success: true }
}

export async function deleteFatura(id: string) {
  const ctx = await requireRole(["Adm"])
  const supabase = await createClient()

  await supabase.from("faturas_colaboradores").delete().eq("fatura_id", id)

  const { data, error } = await scopeToTenant(supabase.from("faturas").delete().eq("id", id), ctx)
    .select("id")
    .maybeSingle()

  if (error) {
    console.error("Erro ao deletar fatura:", error)
    return { success: false, error: error.message }
  }

  if (!data) {
    return { success: false, error: "Fatura não encontrada" }
  }

  revalidatePath("/faturas")
  return { success: true }
}

export async function updateFaturaPdf(id: string, pdfUrl: string) {
  const ctx = await requireRole(["Adm"])
  const supabase = await createClient()

  const { data, error } = await scopeToTenant(
    supabase.from("faturas").update({ arquivo_pdf_url: pdfUrl, updated_at: new Date().toISOString() }).eq("id", id),
    ctx,
  )
    .select("id")
    .maybeSingle()

  if (error) {
    console.error("Erro ao atualizar PDF:", error)
    return { success: false, error: error.message }
  }

  if (!data) {
    return { success: false, error: "Fatura não encontrada" }
  }

  revalidatePath("/faturas")
  return { success: true }
}
