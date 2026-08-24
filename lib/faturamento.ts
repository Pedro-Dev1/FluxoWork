import { createAdminClient } from "./supabase-server"
import { criarPedidoBoleto } from "./pagarme"
import { enviarEmailFaturaPlataforma } from "./email"
import { registrarAuditoria } from "./auditoria"
import { criarNotificacaoTransacional } from "./notificacoes"
import type { FaturaPlataforma } from "@/types/fatura-plataforma"

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
      "id, nome, ativo, valor_por_usuario_ativo, dia_faturamento, documento, email_faturamento, telefone_faturamento",
    )
    .eq("id", tenantId)
    .maybeSingle()

  if (tenantError || !tenant) {
    return { success: false, error: "Carteira não encontrada." }
  }

  if (!tenant.ativo) {
    return { success: false, error: "Carteira inativa — faturamento não gerado." }
  }

  if (!tenant.valor_por_usuario_ativo || !tenant.dia_faturamento || !tenant.documento) {
    return { success: false, error: "Configuração de faturamento incompleta (valor, dia ou CNPJ ausente)." }
  }

  const { data: existente } = await supabase
    .from("faturas_plataforma")
    .select("*")
    .eq("tenant_id", tenantId)
    .eq("referencia_ano", referenciaAno)
    .eq("referencia_mes", referenciaMes)
    .maybeSingle()

  if (existente) {
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

  const { data: faturaInserida, error: insertError } = await supabase
    .from("faturas_plataforma")
    .insert({
      tenant_id: tenantId,
      referencia_ano: referenciaAno,
      referencia_mes: referenciaMes,
      quantidade_usuarios_ativos: quantidade,
      valor_unitario: valorUnitario,
      valor_total: valorTotal,
      status: "pendente",
    })
    .select()
    .single()

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

  let emailDestino = tenant.email_faturamento
  if (!emailDestino) {
    const { data: admin } = await supabase
      .from("colaboradores")
      .select("email")
      .eq("tenant_id", tenantId)
      .eq("tipo_acesso", "Adm")
      .eq("ativo", true)
      .order("created_at", { ascending: true })
      .limit(1)
      .maybeSingle()
    emailDestino = admin?.email || null
  }

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
