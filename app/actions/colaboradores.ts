"use server"

import { getSupabaseServerClient } from "@/lib/supabase-server"
import type { NovoColaborador } from "@/types/colaborador"
import { revalidatePath } from "next/cache"
import { requireAuth, requireRole, scopeToTenant } from "@/lib/auth-utils"
import bcrypt from "bcryptjs"

export async function criarColaborador(data: NovoColaborador) {
  const ctx = await requireRole(["Adm", "Financeiro"])

  const supabase = await getSupabaseServerClient()

  const sanitizedEmail = data.email?.trim().toLowerCase()
  if (!sanitizedEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(sanitizedEmail)) {
    throw new Error("Email inválido")
  }

  // Email é único globalmente (login não tem seletor de carteira), então essa
  // checagem não é escopada por tenant de propósito.
  const { data: emailExistente } = await supabase
    .from("colaboradores")
    .select("email")
    .eq("email", sanitizedEmail)
    .maybeSingle()

  if (emailExistente) {
    throw new Error("Este email já está cadastrado no sistema")
  }

  if (data.tipo_acesso === "Supervisor" && data.equipe_id) {
    const { data: supervisorExistente } = await scopeToTenant(
      supabase
        .from("colaboradores")
        .select("nome_completo, equipe_id")
        .eq("equipe_id", data.equipe_id)
        .eq("tipo_acesso", "Supervisor"),
      ctx,
    ).maybeSingle()

    if (supervisorExistente) {
      const { data: equipe } = await supabase.from("equipes").select("nome").eq("id", data.equipe_id).single()

      throw new Error(
        `Já existe um supervisor (${supervisorExistente.nome_completo}) nesta equipe (${equipe?.nome}). Cada equipe pode ter apenas um supervisor.`,
      )
    }
  }

  const hashedPassword = await bcrypt.hash(data.senha, 10)

  const { data: colaborador, error } = await supabase
    .from("colaboradores")
    .insert({
      nome_completo: data.nome_completo,
      salario: data.salario,
      cnpj: data.cnpj,
      data_nascimento: data.data_nascimento,
      data_aniversario_contrato: data.data_aniversario_contrato || null,
      email: sanitizedEmail,
      tipo_acesso: data.tipo_acesso,
      equipe_id: data.equipe_id,
      dia_pagamento: data.dia_pagamento,
      chave_pix: data.chave_pix || null,
      tipo_chave_pix: data.tipo_chave_pix || null,
      centro_custo_id: data.centro_custo_id || null,
      senha_hash: hashedPassword,
      user_id: null,
      tenant_id: ctx.tenantId,
    })
    .select()
    .single()

  if (error) {
    console.error("[v0] Erro ao criar colaborador:", error)
    throw new Error("Erro ao salvar dados do colaborador. Por favor, tente novamente.")
  }

  console.log("[v0] Colaborador criado com sucesso:", colaborador.id)

  revalidatePath("/colaboradores")
  revalidatePath("/cadastros/colaboradores")
  revalidatePath("/gestao")
  return colaborador
}

async function buscarColaboradoresComBloqueio(
  supabase: Awaited<ReturnType<typeof getSupabaseServerClient>>,
  data: any[],
) {
  const tresDiasAtras = new Date()
  tresDiasAtras.setDate(tresDiasAtras.getDate() - 3)
  const dataLimite = tresDiasAtras.toISOString()

  return Promise.all(
    data.map(async (colaborador) => {
      const { data: pedidoRecente } = await supabase
        .from("pedidos_pagamento")
        .select("created_at")
        .eq("colaborador_id", colaborador.id)
        .gte("created_at", dataLimite)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle()

      return {
        ...colaborador,
        bloqueado: !!pedidoRecente,
        data_ultimo_pedido: pedidoRecente?.created_at,
      }
    }),
  )
}

export async function listarColaboradores() {
  const ctx = await requireAuth()
  const supabase = await getSupabaseServerClient()

  if (ctx.tipoAcesso === "Supervisor") {
    const { data: equipes, error: equipesError } = await supabase
      .from("equipes")
      .select("id")
      .eq("supervisor_id", ctx.colaboradorId)

    if (equipesError) {
      console.error("[v0] Erro ao buscar equipes do supervisor:", equipesError)
      throw new Error("Erro ao buscar equipes")
    }

    const equipeIds = equipes.map((e) => e.id)
    if (equipeIds.length === 0) return []

    const { data, error } = await scopeToTenant(
      supabase
        .from("colaboradores")
        .select("*, equipe:equipes!equipe_id(nome)")
        .in("equipe_id", equipeIds)
        .in("tipo_acesso", ["Colaborador"]),
      ctx,
    ).order("created_at", { ascending: false })

    if (error) {
      console.error("[v0] Erro ao listar colaboradores:", error)
      throw new Error("Erro ao listar colaboradores")
    }

    return buscarColaboradoresComBloqueio(supabase, data)
  }

  if (ctx.tipoAcesso === "Gerente") {
    const { data: gerenteEquipes, error: gerenteEquipesError } = await supabase
      .from("gerentes_equipes")
      .select("equipe_id")
      .eq("gerente_id", ctx.colaboradorId)

    if (gerenteEquipesError) {
      console.error("[v0] Erro ao buscar equipes do gerente:", gerenteEquipesError)
      throw new Error("Erro ao buscar equipes do gerente")
    }

    const equipeIds = gerenteEquipes.map((e) => e.equipe_id)
    if (equipeIds.length === 0) return []

    const { data, error } = await scopeToTenant(
      supabase
        .from("colaboradores")
        .select("*, equipe:equipes!equipe_id(nome)")
        .in("equipe_id", equipeIds)
        .in("tipo_acesso", ["Colaborador", "Supervisor"]),
      ctx,
    ).order("created_at", { ascending: false })

    if (error) {
      console.error("[v0] Erro ao listar colaboradores:", error)
      throw new Error("Erro ao listar colaboradores")
    }

    return buscarColaboradoresComBloqueio(supabase, data)
  }

  const { data, error } = await scopeToTenant(
    supabase.from("colaboradores").select("*, equipe:equipes!equipe_id(nome)").eq("is_super_admin", false),
    ctx,
  ).order("created_at", { ascending: false })

  if (error) {
    console.error("[v0] Erro ao listar colaboradores:", error)
    throw new Error("Erro ao listar colaboradores")
  }

  return buscarColaboradoresComBloqueio(supabase, data)
}

export async function getColaboradores() {
  const ctx = await requireAuth()
  const supabase = await getSupabaseServerClient()

  const { data, error } = await scopeToTenant(
    supabase.from("colaboradores").select("id, nome_completo, email").eq("is_super_admin", false),
    ctx,
  ).order("nome_completo", { ascending: true })

  if (error) {
    console.error("[v0] Erro ao listar colaboradores para faturas:", error)
    return []
  }

  if (!data || data.length === 0) {
    return []
  }

  return data.map((col) => ({
    id: col.id,
    nome: col.nome_completo,
    email: col.email,
  }))
}

export async function deletarColaborador(id: string) {
  const ctx = await requireRole(["Adm", "Financeiro"])
  const supabase = await getSupabaseServerClient()

  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
  if (!uuidRegex.test(id)) {
    throw new Error("ID inválido")
  }

  const { data: colaborador } = await scopeToTenant(
    supabase.from("colaboradores").select("user_id").eq("id", id),
    ctx,
  ).maybeSingle()

  if (!colaborador) {
    throw new Error("Colaborador não encontrado")
  }

  const { data: pedidos, error: pedidosError } = await supabase
    .from("pedidos_pagamento")
    .select("id")
    .eq("criado_por_colaborador_id", id)
    .limit(1)

  if (pedidosError) {
    console.error("[v0] Erro ao verificar pedidos do colaborador:", pedidosError)
    throw new Error("Erro ao verificar pedidos do colaborador")
  }

  if (pedidos && pedidos.length > 0) {
    throw new Error(
      "Não é possível deletar este colaborador porque ele possui pedidos associados. Para manter o histórico, o colaborador será mantido no sistema.",
    )
  }

  const { error } = await supabase.from("colaboradores").delete().eq("id", id)

  if (error) {
    console.error("[v0] Erro ao deletar colaborador:", error)
    throw new Error("Erro ao deletar colaborador")
  }

  revalidatePath("/cadastros/colaboradores")
}

export async function alterarStatusAtivoColaborador(id: string, ativo: boolean) {
  const ctx = await requireRole(["Adm", "Financeiro"])
  const supabase = await getSupabaseServerClient()

  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
  if (!uuidRegex.test(id)) {
    throw new Error("ID inválido")
  }

  if (id === ctx.colaboradorId && !ativo) {
    throw new Error("Você não pode desativar sua própria conta")
  }

  const { data, error } = await scopeToTenant(supabase.from("colaboradores").update({ ativo }).eq("id", id), ctx)
    .select("id")
    .maybeSingle()

  if (error) {
    console.error("[v0] Erro ao alterar status do colaborador:", error)
    throw new Error(`Erro ao ${ativo ? "reativar" : "desativar"} colaborador`)
  }

  if (!data) {
    throw new Error("Colaborador não encontrado")
  }

  revalidatePath("/cadastros/colaboradores")
}

export async function atualizarColaborador(id: string, data: Partial<NovoColaborador>) {
  const ctx = await requireRole(["Adm", "Financeiro"])
  const supabase = await getSupabaseServerClient()

  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
  if (!uuidRegex.test(id)) {
    throw new Error("ID inválido")
  }

  const { data: colaboradorNoTenant } = await scopeToTenant(
    supabase.from("colaboradores").select("id").eq("id", id),
    ctx,
  ).maybeSingle()

  if (!colaboradorNoTenant) {
    throw new Error("Colaborador não encontrado")
  }

  if (data.email) {
    const sanitizedEmail = data.email.trim().toLowerCase()
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(sanitizedEmail)) {
      throw new Error("Email inválido")
    }
    data.email = sanitizedEmail

    // Global de propósito — ver comentário em criarColaborador.
    const { data: emailExistente } = await supabase
      .from("colaboradores")
      .select("email, id")
      .eq("email", sanitizedEmail)
      .neq("id", id)
      .maybeSingle()

    if (emailExistente) {
      throw new Error("Este email já está cadastrado em outro colaborador")
    }
  }

  if (data.tipo_acesso === "Supervisor" && data.equipe_id) {
    const { data: supervisorExistente } = await scopeToTenant(
      supabase
        .from("colaboradores")
        .select("nome_completo, equipe_id, id")
        .eq("equipe_id", data.equipe_id)
        .eq("tipo_acesso", "Supervisor")
        .neq("id", id),
      ctx,
    ).maybeSingle()

    if (supervisorExistente) {
      const { data: equipe } = await supabase.from("equipes").select("nome").eq("id", data.equipe_id).single()

      throw new Error(
        `Já existe um supervisor (${supervisorExistente.nome_completo}) nesta equipe (${equipe?.nome}). Cada equipe pode ter apenas um supervisor.`,
      )
    }
  }

  const updateData: any = {}
  if (data.nome_completo) updateData.nome_completo = data.nome_completo
  if (data.email) updateData.email = data.email
  if (data.cnpj) updateData.cnpj = data.cnpj
  if (data.data_nascimento) updateData.data_nascimento = data.data_nascimento
  if (data.data_aniversario_contrato !== undefined)
    updateData.data_aniversario_contrato = data.data_aniversario_contrato || null
  if (data.tipo_acesso) updateData.tipo_acesso = data.tipo_acesso
  if (data.salario !== undefined) updateData.salario = data.salario
  if ("equipe_id" in data) updateData.equipe_id = data.equipe_id ?? null
  if (data.dia_pagamento !== undefined) updateData.dia_pagamento = data.dia_pagamento
  if (data.chave_pix !== undefined) updateData.chave_pix = data.chave_pix || null
  if (data.tipo_chave_pix !== undefined) updateData.tipo_chave_pix = data.tipo_chave_pix || null
  if (data.centro_custo_id !== undefined) updateData.centro_custo_id = data.centro_custo_id || null

  if (data.salario !== undefined) {
    // Registra em historico_reajustes mesmo quando o salário é alterado pela edição
    // direta do cadastro (fora do fluxo "Aplicar Reajuste"). Sem isso, essa mudança
    // não fica rastreável e pedidos antigos não podem ser reconstruídos com o
    // salário correto de cada época — foi exatamente essa lacuna que corrompeu o
    // salario_base de pedidos passados.
    const { data: colaboradorAtual, error: colaboradorAtualError } = await supabase
      .from("colaboradores")
      .select("salario")
      .eq("id", id)
      .single()

    if (!colaboradorAtualError && colaboradorAtual && colaboradorAtual.salario !== data.salario) {
      const { error: historicoError } = await supabase.from("historico_reajustes").insert({
        colaborador_id: id,
        salario_anterior: colaboradorAtual.salario,
        salario_novo: data.salario,
        tipo_reajuste: "valor",
        valor_reajuste: data.salario - colaboradorAtual.salario,
        motivo: "Alteração direta no cadastro do colaborador",
        aplicado_por: ctx.colaboradorId,
        tenant_id: ctx.tenantId,
      })

      if (historicoError) {
        console.error("[v0] Erro ao registrar histórico de alteração direta de salário:", historicoError)
      }
    }
  }

  console.log("[v0] atualizarColaborador updateData:", JSON.stringify(updateData))

  if (data.senha) {
    updateData.senha_hash = await bcrypt.hash(data.senha, 10)
  }

  const { error } = await supabase.from("colaboradores").update(updateData).eq("id", id)

  if (error) {
    console.error("[v0] Erro ao atualizar colaborador:", error)
    throw new Error("Erro ao atualizar colaborador. Por favor, tente novamente.")
  }

  revalidatePath("/colaboradores")
  revalidatePath("/cadastros/colaboradores")
  revalidatePath("/gestao")
  revalidatePath("/cadastros/equipes")
  revalidatePath("/", "layout")
}

export async function listarColaboradoresGerente(gerenteId: string) {
  const ctx = await requireAuth()
  const supabase = await getSupabaseServerClient()

  const { data: gerenteEquipes, error: gerenteEquipesError } = await supabase
    .from("gerentes_equipes")
    .select("equipe_id")
    .eq("gerente_id", gerenteId)

  if (gerenteEquipesError) {
    console.error("[v0] Erro ao buscar equipes do gerente:", gerenteEquipesError)
    throw new Error("Erro ao buscar equipes do gerente")
  }

  const equipeIds = gerenteEquipes.map((e) => e.equipe_id)
  if (equipeIds.length === 0) return []

  const { data, error } = await scopeToTenant(
    supabase.from("colaboradores").select("*, equipe:equipes!equipe_id(nome)").in("equipe_id", equipeIds),
    ctx,
  ).order("created_at", { ascending: false })

  if (error) {
    console.error("[v0] Erro ao listar colaboradores:", error)
    throw new Error("Erro ao listar colaboradores")
  }

  return data
}

export async function listarColaboradoresComGerente() {
  const ctx = await requireAuth()
  const supabase = await getSupabaseServerClient()

  if (ctx.tipoAcesso === "Supervisor") {
    const { data: supervisorData } = await supabase
      .from("colaboradores")
      .select("equipe_id")
      .eq("id", ctx.colaboradorId)
      .single()

    if (!supervisorData?.equipe_id) return []

    const { data, error } = await scopeToTenant(
      supabase
        .from("colaboradores")
        .select("*, equipe:equipes!equipe_id(nome)")
        .eq("equipe_id", supervisorData.equipe_id)
        .in("tipo_acesso", ["Supervisor", "Colaborador"]),
      ctx,
    ).order("created_at", { ascending: false })

    if (error) {
      console.error("[v0] Erro ao listar colaboradores:", error)
      throw new Error("Erro ao listar colaboradores")
    }

    return buscarColaboradoresComBloqueio(supabase, data)
  }

  if (ctx.tipoAcesso === "Gerente") {
    const { data: gerenteEquipes, error: gerenteEquipesError } = await supabase
      .from("gerentes_equipes")
      .select("equipe_id")
      .eq("gerente_id", ctx.colaboradorId)

    if (gerenteEquipesError) {
      console.error("[v0] Erro ao buscar equipes do gerente:", gerenteEquipesError)
      throw new Error("Erro ao buscar equipes do gerente")
    }

    const equipeIds = gerenteEquipes.map((e) => e.equipe_id)
    if (equipeIds.length === 0) return []

    const { data, error } = await scopeToTenant(
      supabase
        .from("colaboradores")
        .select("*, equipe:equipes!equipe_id(nome)")
        .or(`equipe_id.in.(${equipeIds.join(",")}),id.eq.${ctx.colaboradorId}`)
        .in("tipo_acesso", ["Colaborador", "Supervisor", "Gerente"]),
      ctx,
    ).order("created_at", { ascending: false })

    if (error) {
      console.error("[v0] Erro ao listar colaboradores:", error)
      throw new Error("Erro ao listar colaboradores")
    }

    return buscarColaboradoresComBloqueio(supabase, data)
  }

  const { data, error } = await scopeToTenant(
    supabase.from("colaboradores").select("*, equipe:equipes!equipe_id(nome)").eq("is_super_admin", false),
    ctx,
  ).order("created_at", { ascending: false })

  if (error) {
    console.error("[v0] Erro ao listar colaboradores:", error)
    throw new Error("Erro ao listar colaboradores")
  }

  return buscarColaboradoresComBloqueio(supabase, data)
}

export async function exportarColaboradoresExcel() {
  const ctx = await requireAuth()
  const supabase = await getSupabaseServerClient()

  const { data, error } = await scopeToTenant(
    supabase.from("colaboradores").select("*, equipe:equipes!equipe_id(nome)").eq("is_super_admin", false),
    ctx,
  ).order("nome_completo", { ascending: true })

  if (error) {
    console.error("[v0] Erro ao exportar colaboradores:", error)
    throw new Error("Erro ao exportar colaboradores")
  }

  const dadosFormatados = data.map((colaborador) => ({
    Nome: colaborador.nome_completo,
    Email: colaborador.email,
    CNPJ: colaborador.cnpj || "",
    "Data de Nascimento": colaborador.data_nascimento
      ? new Date(colaborador.data_nascimento).toLocaleDateString("pt-BR")
      : "",
    Salário: colaborador.salario
      ? new Intl.NumberFormat("pt-BR", {
          style: "currency",
          currency: "BRL",
        }).format(colaborador.salario)
      : "R$ 0,00",
    "Tipo de Acesso": colaborador.tipo_acesso,
    Equipe: colaborador.equipe?.nome || "Sem equipe",
    "Dia de Pagamento": colaborador.dia_pagamento || "",
    "Data de Cadastro": new Date(colaborador.created_at).toLocaleDateString("pt-BR"),
  }))

  return dadosFormatados
}
