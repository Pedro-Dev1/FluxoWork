import { createAdminClient } from "./supabase-server"
import { criarPedidoBoleto, cancelarCobranca } from "./pagarme"
import { enviarEmailFaturaPlataforma } from "./email"
import { registrarAuditoria } from "./auditoria"
import { criarNotificacaoTransacional } from "./notificacoes"
import type { CarteiraFaturamento, FaturaPlataforma } from "@/types/fatura-plataforma"

// Sem "use server" de propósito, mesmo motivo de lib/notificacoes.ts e
// lib/auditoria.ts: gerarFaturaParaTenant() não valida permissão sozinha —
// ela é chamada tanto por app/actions/faturamento.ts (depois de
// requireRole([])) quanto pelo cron (depois de validar o CRON_SECRET). Se
// este arquivo tivesse "use server", cada export viraria uma RPC pública
// chamável por qualquer cliente autenticado, contornando os dois guardas.

const DIAS_PARA_VENCIMENTO = 5

function formatarMoeda(valor: number): string {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(valor)
}

function formatarDataBr(dataIso: string): string {
  const [ano, mes, dia] = dataIso.split("-")
  return `${dia}/${mes}/${ano}`
}

type ResultadoFatura =
  | { success: true; fatura: FaturaPlataforma; jaExistia: boolean }
  | { success: false; error: string }

// Compartilhado entre a emissão (aqui embaixo) e o reenvio manual de e-mail
// (app/actions/faturamento.ts) — os dois precisam do mesmo fallback pro
// e-mail do Adm da carteira quando não há e-mail de cobrança configurado.
export async function resolverEmailCobranca(tenantId: string, emailFaturamento: string | null): Promise<string | null> {
  if (emailFaturamento) return emailFaturamento

  const supabase = await createAdminClient()
  const { data: admin } = await supabase
    .from("colaboradores")
    .select("email")
    .eq("tenant_id", tenantId)
    .eq("tipo_acesso", "Adm")
    .eq("ativo", true)
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle()

  return admin?.email || null
}

export type DadosFaturamento = {
  valorPorUsuarioAtivo: number
  diaFaturamento: number
  documento: string
  emailFaturamento?: string | null
  telefoneFaturamento?: string | null
  enderecoLogradouro: string
  enderecoComplemento?: string | null
  enderecoCep: string
  enderecoCidade: string
  enderecoUf: string
}

// Núcleo compartilhado entre o Server Action (app/actions/faturamento.ts,
// depois de requireRole([])) e a API de faturamento (app/api/admin/faturamento,
// depois de validar a API key) — mesma validação e mesma escrita nos dois
// casos, só muda quem valida a permissão antes de chegar aqui.
export async function atualizarFaturamentoTenant(
  identificador: { tenantId?: string; slug?: string },
  dados: DadosFaturamento,
  acionadoPor: string | null,
): Promise<{ success: true; tenantId: string; nome: string } | { success: false; error: string }> {
  if (dados.valorPorUsuarioAtivo <= 0) {
    return { success: false, error: "O valor por usuário ativo deve ser maior que zero" }
  }

  if (dados.diaFaturamento < 1 || dados.diaFaturamento > 28) {
    return { success: false, error: "O dia de faturamento deve estar entre 1 e 28" }
  }

  const documento = dados.documento.replace(/\D/g, "")
  if (documento.length !== 14) {
    return { success: false, error: "CNPJ inválido" }
  }

  if (!dados.enderecoLogradouro.trim() || !dados.enderecoCidade.trim() || !dados.enderecoUf.trim()) {
    return {
      success: false,
      error: "Endereço (logradouro, cidade e UF) é obrigatório — exigido pela Pagar.me para emitir boleto",
    }
  }

  const cep = dados.enderecoCep.replace(/\D/g, "")
  if (cep.length !== 8) {
    return { success: false, error: "CEP inválido" }
  }

  if (dados.enderecoUf.trim().length !== 2) {
    return { success: false, error: "UF inválida — use a sigla de 2 letras" }
  }

  if (!identificador.tenantId && !identificador.slug) {
    return { success: false, error: "Informe tenantId ou slug da carteira" }
  }

  const supabase = await createAdminClient()

  let query = supabase.from("tenants").update({
    valor_por_usuario_ativo: dados.valorPorUsuarioAtivo,
    dia_faturamento: dados.diaFaturamento,
    documento,
    email_faturamento: dados.emailFaturamento?.trim() || null,
    telefone_faturamento: dados.telefoneFaturamento?.trim() || null,
    endereco_logradouro: dados.enderecoLogradouro.trim(),
    endereco_complemento: dados.enderecoComplemento?.trim() || null,
    endereco_cep: cep,
    endereco_cidade: dados.enderecoCidade.trim(),
    endereco_uf: dados.enderecoUf.trim().toUpperCase(),
  })

  query = identificador.tenantId ? query.eq("id", identificador.tenantId) : query.eq("slug", identificador.slug!)

  const { data: tenant, error } = await query.select("id, nome").maybeSingle()

  if (error) {
    console.error("[v0] Erro ao atualizar configuração de faturamento:", error)
    return { success: false, error: "Erro ao atualizar configuração de faturamento" }
  }

  if (!tenant) {
    return { success: false, error: "Carteira não encontrada" }
  }

  await registrarAuditoria({
    colaboradorId: acionadoPor,
    tenantId: tenant.id,
    acao: "faturamento_configurado",
    tabela: "tenants",
    registroId: tenant.id,
    detalhes: {
      carteira: tenant.nome,
      valor_por_usuario_ativo: dados.valorPorUsuarioAtivo,
      dia_faturamento: dados.diaFaturamento,
      origem: acionadoPor ? "painel" : "api",
    },
  })

  return { success: true, tenantId: tenant.id, nome: tenant.nome }
}

// Mesma lógica de contagem de usuários ativos usada em
// app/actions/tenants.ts::listarTenants(), mas com o filtro adicional de
// "ativo" (aqui interessa quem realmente entra na conta da próxima fatura,
// não o total histórico de colaboradores).
export async function listarCarteirasFaturamento(): Promise<CarteiraFaturamento[]> {
  const supabase = await createAdminClient()

  const { data: tenants, error } = await supabase
    .from("tenants")
    .select(
      "id, nome, ativo, valor_por_usuario_ativo, dia_faturamento, documento, email_faturamento, telefone_faturamento, endereco_logradouro, endereco_complemento, endereco_cep, endereco_cidade, endereco_uf",
    )
    .order("nome", { ascending: true })

  if (error) {
    console.error("[v0] Erro ao listar configuração de faturamento:", error)
    throw new Error("Erro ao listar configuração de faturamento")
  }

  const { data: colaboradores } = await supabase
    .from("colaboradores")
    .select("tenant_id")
    .eq("ativo", true)
    .eq("is_super_admin", false)
    .not("tenant_id", "is", null)

  const contagemPorTenant = new Map<string, number>()
  for (const c of colaboradores || []) {
    contagemPorTenant.set(c.tenant_id, (contagemPorTenant.get(c.tenant_id) || 0) + 1)
  }

  return (tenants || []).map((t) => ({ ...t, usuarios_ativos: contagemPorTenant.get(t.id) || 0 })) as CarteiraFaturamento[]
}

// Cancela uma fatura ainda não paga (boleto emitido, aguardando pagamento,
// ou já vencido sem pagamento). Faturas pagas não podem ser canceladas por
// aqui — desfazer uma cobrança já paga é estorno, exige dados bancários e é
// um fluxo manual, fora do escopo de um clique único.
export async function cancelarFatura(
  faturaId: string,
  acionadoPor: string | null,
): Promise<{ success: true } | { success: false; error: string }> {
  const supabase = await createAdminClient()

  const { data: fatura, error } = await supabase
    .from("faturas_plataforma")
    .select("id, tenant_id, status, pagarme_charge_id")
    .eq("id", faturaId)
    .maybeSingle()

  if (error || !fatura) {
    return { success: false, error: "Fatura não encontrada." }
  }

  if (!["emitida", "vencida"].includes(fatura.status)) {
    return { success: false, error: "Só é possível cancelar uma fatura emitida (aguardando pagamento) ou vencida." }
  }

  if (!fatura.pagarme_charge_id) {
    return { success: false, error: "Esta fatura não tem uma cobrança associada na Pagar.me." }
  }

  const resultado = await cancelarCobranca(fatura.pagarme_charge_id)
  if (!resultado.success) {
    return { success: false, error: resultado.error }
  }

  const { error: updateError } = await supabase
    .from("faturas_plataforma")
    .update({ status: "cancelada", updated_at: new Date().toISOString() })
    .eq("id", faturaId)

  if (updateError) {
    // A cobrança já foi cancelada de verdade na Pagar.me nesse ponto — não dá
    // pra desfazer isso. Reportar como falha pra alguém saber que o status
    // aqui ficou desatualizado, em vez de devolver sucesso silenciosamente.
    console.error("[v0] Cobrança cancelada na Pagar.me mas falhou ao salvar no banco:", updateError)
    return { success: false, error: "Cobrança cancelada na Pagar.me, mas houve erro ao atualizar o status aqui. Atualize a página." }
  }

  await registrarAuditoria({
    colaboradorId: acionadoPor,
    tenantId: fatura.tenant_id,
    acao: "fatura_plataforma_cancelada",
    tabela: "faturas_plataforma",
    registroId: faturaId,
    detalhes: { origem: "manual" },
  })

  return { success: true }
}

export async function gerarFaturaParaTenant(
  tenantId: string,
  referenciaAno: number,
  referenciaMes: number,
  // null (padrão) = disparo automático pelo cron, sem colaborador humano por
  // trás. Preenchido quando um Super Admin aciona "Gerar fatura agora".
  acionadoPor: string | null = null,
): Promise<ResultadoFatura> {
  const supabase = await createAdminClient()

  const { data: tenant, error: tenantError } = await supabase
    .from("tenants")
    .select(
      "id, nome, ativo, valor_por_usuario_ativo, dia_faturamento, documento, email_faturamento, telefone_faturamento, endereco_logradouro, endereco_complemento, endereco_cep, endereco_cidade, endereco_uf",
    )
    .eq("id", tenantId)
    .maybeSingle()

  if (tenantError || !tenant) {
    return { success: false, error: "Carteira não encontrada." }
  }

  if (!tenant.ativo) {
    return { success: false, error: "Carteira inativa — faturamento não gerado." }
  }

  if (
    !tenant.valor_por_usuario_ativo ||
    !tenant.dia_faturamento ||
    !tenant.documento ||
    !tenant.endereco_logradouro ||
    !tenant.endereco_cep ||
    !tenant.endereco_cidade ||
    !tenant.endereco_uf
  ) {
    return {
      success: false,
      error: "Configuração de faturamento incompleta (valor, dia, CNPJ ou endereço ausente).",
    }
  }

  // A Pagar.me exige endereço do cliente pra emitir boleto com registro —
  // sem isso, o pedido é criado mas nenhuma cobrança de boleto é gerada.
  const enderecoCliente = {
    line_1: tenant.endereco_logradouro,
    line_2: tenant.endereco_complemento || undefined,
    zip_code: tenant.endereco_cep,
    city: tenant.endereco_cidade,
    state: tenant.endereco_uf,
  }

  const { data: existente } = await supabase
    .from("faturas_plataforma")
    .select("*")
    .eq("tenant_id", tenantId)
    .eq("referencia_ano", referenciaAno)
    .eq("referencia_mes", referenciaMes)
    .maybeSingle()

  // Uma fatura que falhou antes não conta como "já existe" pra fins de
  // idempotência — sem isso, uma falha de configuração travaria a carteira
  // pro mês inteiro, sem jeito de tentar de novo depois de corrigir.
  if (existente && existente.status !== "falhou") {
    return { success: true, fatura: existente as FaturaPlataforma, jaExistia: true }
  }

  async function registrarFalha(faturaId: string, mensagem: string): Promise<void> {
    await supabase
      .from("faturas_plataforma")
      .update({ status: "falhou", erro_mensagem: mensagem, updated_at: new Date().toISOString() })
      .eq("id", faturaId)

    await registrarAuditoria({
      colaboradorId: acionadoPor,
      tenantId,
      acao: "fatura_plataforma_falhou",
      tabela: "faturas_plataforma",
      registroId: faturaId,
      detalhes: { carteira: tenant!.nome, referencia: `${referenciaMes}/${referenciaAno}`, erro: mensagem },
    })

    // Dinheiro real que deixou de ser cobrado — precisa chegar em alguém,
    // não só ficar registrado no log.
    const { data: superAdmins } = await supabase
      .from("colaboradores")
      .select("id, nome_completo, email")
      .eq("is_super_admin", true)

    await criarNotificacaoTransacional({
      tenantId: null,
      tipo: "PLATFORM_INVOICE_FAILED",
      titulo: "Falha ao emitir fatura da plataforma",
      mensagem: `Não foi possível emitir a fatura de ${tenant!.nome} (${String(referenciaMes).padStart(2, "0")}/${referenciaAno}): ${mensagem}`,
      entityType: "faturas_plataforma",
      entityId: faturaId,
      destinatarios: (superAdmins || []).map((s) => ({ colaboradorId: s.id, email: s.email, nome: s.nome_completo })),
      enviarEmail: false,
    })
  }

  const { count } = await supabase
    .from("colaboradores")
    .select("*", { count: "exact", head: true })
    .eq("tenant_id", tenantId)
    .eq("ativo", true)
    .eq("is_super_admin", false)

  const quantidade = count || 0
  const valorUnitario = tenant.valor_por_usuario_ativo
  const valorTotal = Number((quantidade * valorUnitario).toFixed(2))

  const dadosFatura = {
    tenant_id: tenantId,
    referencia_ano: referenciaAno,
    referencia_mes: referenciaMes,
    quantidade_usuarios_ativos: quantidade,
    valor_unitario: valorUnitario,
    valor_total: valorTotal,
    status: "pendente",
    erro_mensagem: null,
  }

  // Reaproveita a linha de uma tentativa anterior que falhou (mesmo
  // tenant/mês) em vez de inserir outra — o unique(tenant_id, ano, mes)
  // barraria um insert novo de qualquer forma.
  const { data: faturaInserida, error: insertError } = existente
    ? await supabase.from("faturas_plataforma").update(dadosFatura).eq("id", existente.id).select().single()
    : await supabase.from("faturas_plataforma").insert(dadosFatura).select().single()

  if (insertError || !faturaInserida) {
    console.error("[v0] Erro ao registrar fatura da plataforma:", insertError)
    return { success: false, error: "Erro ao registrar fatura." }
  }

  if (valorTotal <= 0) {
    const { data: faturaCancelada } = await supabase
      .from("faturas_plataforma")
      .update({
        status: "cancelada",
        erro_mensagem: "Nenhum usuário ativo no período — fatura não emitida.",
        updated_at: new Date().toISOString(),
      })
      .eq("id", faturaInserida.id)
      .select()
      .single()

    return { success: true, fatura: (faturaCancelada || faturaInserida) as FaturaPlataforma, jaExistia: false }
  }

  const emailDestino = await resolverEmailCobranca(tenantId, tenant.email_faturamento)

  if (!emailDestino) {
    const mensagem = "Nenhum e-mail de cobrança configurado e a carteira não tem um Adm ativo com e-mail."
    await registrarFalha(faturaInserida.id, mensagem)
    return { success: false, error: mensagem }
  }

  const dataVencimento = new Date(Date.now() + DIAS_PARA_VENCIMENTO * 24 * 60 * 60 * 1000).toISOString().slice(0, 10)

  const resultadoBoleto = await criarPedidoBoleto({
    customerName: tenant.nome,
    customerDocument: tenant.documento,
    customerEmail: emailDestino,
    customerPhone: tenant.telefone_faturamento,
    customerAddress: enderecoCliente,
    valorCentavos: Math.round(valorTotal * 100),
    descricaoItem: `FluxoPay — ${String(referenciaMes).padStart(2, "0")}/${referenciaAno} (${quantidade} usuário${quantidade === 1 ? "" : "s"} ativo${quantidade === 1 ? "" : "s"})`,
    dataVencimento,
    instructions: `Fatura FluxoPay referente a ${String(referenciaMes).padStart(2, "0")}/${referenciaAno}.`,
  })

  if (!resultadoBoleto.success) {
    await registrarFalha(faturaInserida.id, resultadoBoleto.error)
    return { success: false, error: resultadoBoleto.error }
  }

  const { data: faturaEmitida, error: updateError } = await supabase
    .from("faturas_plataforma")
    .update({
      status: "emitida",
      pagarme_order_id: resultadoBoleto.orderId,
      pagarme_charge_id: resultadoBoleto.chargeId,
      boleto_url: resultadoBoleto.boletoUrl,
      boleto_linha_digitavel: resultadoBoleto.boletoLinha,
      boleto_codigo_barras: resultadoBoleto.boletoCodigoBarras,
      data_vencimento: dataVencimento,
      updated_at: new Date().toISOString(),
    })
    .eq("id", faturaInserida.id)
    .select()
    .single()

  if (updateError) {
    console.error("[v0] Boleto emitido na Pagar.me mas falhou ao salvar no banco:", updateError)
  }

  await registrarAuditoria({
    colaboradorId: acionadoPor,
    tenantId,
    acao: "fatura_plataforma_emitida",
    tabela: "faturas_plataforma",
    registroId: faturaInserida.id,
    detalhes: {
      carteira: tenant.nome,
      referencia: `${referenciaMes}/${referenciaAno}`,
      valor_total: valorTotal,
      quantidade_usuarios_ativos: quantidade,
    },
  })

  await enviarEmailFaturaPlataforma({
    destinatario: emailDestino,
    nomeCarteira: tenant.nome,
    referenciaMes,
    referenciaAno,
    valorFormatado: formatarMoeda(valorTotal),
    dataVencimentoFormatada: formatarDataBr(dataVencimento),
    boletoUrl: resultadoBoleto.boletoUrl,
    boletoLinha: resultadoBoleto.boletoLinha,
  })

  return {
    success: true,
    fatura: (faturaEmitida || { ...faturaInserida, status: "emitida" }) as FaturaPlataforma,
    jaExistia: false,
  }
}
