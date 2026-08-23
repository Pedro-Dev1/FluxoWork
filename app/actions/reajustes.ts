"use server"

import { getSupabaseServerClient } from "@/lib/supabase-server"
import { revalidatePath } from "next/cache"
import type { NovoReajuste, HistoricoReajuste } from "@/types/reajuste"
import { requireAuth, requireRole, scopeToTenant } from "@/lib/auth-utils"

export async function aplicarReajuste(data: NovoReajuste) {
  // Apenas Financeiro e Adm podem aplicar reajustes
  const ctx = await requireRole(["Financeiro", "Adm"])
  const supabase = await getSupabaseServerClient()

  if (!data.motivo || data.motivo.trim() === "") {
    throw new Error("O motivo do reajuste é obrigatório")
  }

  const { data: colaborador, error: colaboradorError } = await scopeToTenant(
    supabase.from("colaboradores").select("salario, nome_completo").eq("id", data.colaborador_id),
    ctx,
  ).single()

  if (colaboradorError || !colaborador) {
    throw new Error("Colaborador não encontrado")
  }

  const salarioAnterior = colaborador.salario

  let salarioNovo: number
  if (data.tipo_reajuste === "porcentagem") {
    salarioNovo = salarioAnterior + salarioAnterior * (data.valor_reajuste / 100)
  } else {
    salarioNovo = salarioAnterior + data.valor_reajuste
  }

  salarioNovo = Math.round(salarioNovo * 100) / 100

  const { error: historicoError } = await supabase.from("historico_reajustes").insert({
    colaborador_id: data.colaborador_id,
    salario_anterior: salarioAnterior,
    salario_novo: salarioNovo,
    tipo_reajuste: data.tipo_reajuste,
    valor_reajuste: data.valor_reajuste,
    motivo: data.motivo,
    aplicado_por: ctx.colaboradorId,
    tenant_id: ctx.tenantId,
  })

  if (historicoError) {
    console.error("[v0] Erro ao registrar histórico:", historicoError)
    throw new Error("Erro ao registrar histórico de reajuste")
  }

  // Atualizar salário do colaborador e avançar a data de aniversário de contrato em 1 ano
  const novaDataAniversario = new Date()
  novaDataAniversario.setFullYear(novaDataAniversario.getFullYear() + 1)

  const { error: updateError } = await scopeToTenant(
    supabase
      .from("colaboradores")
      .update({
        salario: salarioNovo,
        data_aniversario_contrato: novaDataAniversario.toISOString().split("T")[0],
      })
      .eq("id", data.colaborador_id),
    ctx,
  )

  if (updateError) {
    console.error("[v0] Erro ao atualizar colaborador:", updateError)
    throw new Error("Erro ao aplicar reajuste")
  }

  revalidatePath("/financeiro/colaboradores")
  revalidatePath("/colaboradores")
  revalidatePath("/cadastros/colaboradores")
  revalidatePath("/meus-pagamentos")
  revalidatePath("/gestao/reajustes")
  revalidatePath("/gestao")
  revalidatePath("/")

  return {
    colaborador: colaborador.nome_completo,
    salarioAnterior,
    salarioNovo,
    tipo: data.tipo_reajuste,
    valor: data.valor_reajuste,
  }
}

export async function listarHistoricoReajustes(colaboradorId?: string): Promise<HistoricoReajuste[]> {
  try {
    const ctx = await requireAuth()
    const supabase = await getSupabaseServerClient()

    let query = scopeToTenant(
      supabase.from("historico_reajustes").select(
        `
        *,
        colaborador:colaboradores!historico_reajustes_colaborador_id_fkey(nome_completo),
        aplicador:colaboradores!historico_reajustes_aplicado_por_fkey(nome_completo)
      `,
      ),
      ctx,
    ).order("created_at", { ascending: false })

    if (colaboradorId) {
      query = query.eq("colaborador_id", colaboradorId)
    } else {
      if (ctx.tipoAcesso === "Supervisor") {
        const { data: equipes } = await supabase.from("equipes").select("id").eq("supervisor_id", ctx.colaboradorId)

        if (equipes && equipes.length > 0) {
          const equipeIds = equipes.map((e) => e.id)
          const { data: colaboradores } = await supabase.from("colaboradores").select("id").in("equipe_id", equipeIds)

          if (colaboradores && colaboradores.length > 0) {
            const colaboradorIds = colaboradores.map((c) => c.id)
            query = query.in("colaborador_id", colaboradorIds)
          } else {
            return []
          }
        } else {
          return []
        }
      } else if (ctx.tipoAcesso === "Colaborador") {
        query = query.eq("colaborador_id", ctx.colaboradorId)
      }
      // Gerente, Financeiro e Adm veem todos (dentro da própria carteira)
    }

    const { data, error } = await query

    if (error) {
      console.error("[v0] Erro ao listar histórico de reajustes:", error)
      return []
    }

    return data || []
  } catch (error) {
    console.error("[v0] Erro ao listar histórico de reajustes:", error)
    return []
  }
}
