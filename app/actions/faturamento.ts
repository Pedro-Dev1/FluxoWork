"use server"

import { createAdminClient } from "@/lib/supabase-server"
import { revalidatePath } from "next/cache"
import { requireRole } from "@/lib/auth-utils"
import {
  gerarFaturaParaTenant,
  cancelarFatura,
  resolverEmailCobranca,
  atualizarFaturamentoTenant,
  listarCarteirasFaturamento,
  type DadosFaturamento,
} from "@/lib/faturamento"
import { enviarEmailFaturaPlataforma } from "@/lib/email"
import type { CarteiraFaturamento, FaturaPlataforma } from "@/types/fatura-plataforma"

export async function listarConfiguracaoFaturamento(): Promise<CarteiraFaturamento[]> {
  await requireRole([])
  return listarCarteirasFaturamento()
}

export async function atualizarConfiguracaoFaturamento(tenantId: string, dados: DadosFaturamento) {
  const ctx = await requireRole([])

  const resultado = await atualizarFaturamentoTenant({ tenantId }, dados, ctx.colaboradorId)

  revalidatePath("/admin/faturamento")

  if (!resultado.success) {
    throw new Error(resultado.error)
  }
}

export async function gerarFaturaManual(tenantId: string) {
  const ctx = await requireRole([])

  const agora = new Date()
  const resultado = await gerarFaturaParaTenant(tenantId, agora.getFullYear(), agora.getMonth() + 1, ctx.colaboradorId)

  revalidatePath("/admin/faturamento")

  if (!resultado.success) {
    throw new Error(resultado.error)
  }

  if (resultado.jaExistia) {
    throw new Error("Já existe uma fatura para esta carteira no mês corrente.")
  }

  return resultado.fatura
}

export async function listarFaturasPlataforma(tenantId?: string): Promise<
  (FaturaPlataforma & { tenant: { nome: string } | null })[]
> {
  await requireRole([])
  const supabase = await createAdminClient()

  let query = supabase
    .from("faturas_plataforma")
    .select("*, tenant:tenants(nome)")
    .order("created_at", { ascending: false })

  if (tenantId) {
    query = query.eq("tenant_id", tenantId)
  }

  const { data, error } = await query

  if (error) {
    console.error("[v0] Erro ao listar faturas da plataforma:", error)
    throw new Error("Erro ao listar faturas")
  }

  return (data || []) as (FaturaPlataforma & { tenant: { nome: string } | null })[]
}

export async function reenviarEmailFatura(faturaId: string) {
  await requireRole([])
  const supabase = await createAdminClient()

  const { data: fatura, error } = await supabase
    .from("faturas_plataforma")
    .select("*, tenant:tenants(nome, email_faturamento)")
    .eq("id", faturaId)
    .maybeSingle()

  if (error || !fatura) {
    throw new Error("Fatura não encontrada")
  }

  if (!fatura.boleto_url || !fatura.boleto_linha_digitavel) {
    throw new Error("Esta fatura ainda não tem um boleto emitido")
  }

  const emailDestino = await resolverEmailCobranca(fatura.tenant_id, fatura.tenant?.email_faturamento || null)
  if (!emailDestino) {
    throw new Error("Esta carteira não tem e-mail de cobrança configurado nem um Adm ativo com e-mail")
  }

  await enviarEmailFaturaPlataforma({
    destinatario: emailDestino,
    nomeCarteira: fatura.tenant.nome,
    referenciaMes: fatura.referencia_mes,
    referenciaAno: fatura.referencia_ano,
    valorFormatado: new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(fatura.valor_total),
    dataVencimentoFormatada: fatura.data_vencimento
      ? new Date(`${fatura.data_vencimento}T00:00:00`).toLocaleDateString("pt-BR")
      : "—",
    boletoUrl: fatura.boleto_url,
    boletoLinha: fatura.boleto_linha_digitavel,
  })
}

export async function cancelarFaturaPlataforma(faturaId: string) {
  const ctx = await requireRole([])

  const resultado = await cancelarFatura(faturaId, ctx.colaboradorId)

  revalidatePath("/admin/faturamento")

  if (!resultado.success) {
    throw new Error(resultado.error)
  }
}
