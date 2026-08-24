import { createAdminClient } from "./supabase-server"

// Módulo sem "use server" de propósito: todo arquivo em app/actions/*.ts com
// "use server" torna cada função exportada uma RPC pública, chamável
// diretamente por qualquer cliente autenticado, contornando a UI. As
// funções aqui recebem tenantId e a lista de destinatários já resolvidos
// pelo chamador e não validam nada sozinhas — se vivessem num arquivo
// "use server", qualquer um poderia forjar uma notificação pra um tenant ou
// destinatário arbitrário. Só código já autorizado (dentro de
// app/actions/*.ts, depois de requireAuth()/requireRole()) deve importar
// daqui — mesmo motivo pelo qual lib/email.ts fica fora de app/actions/.

interface Destinatario {
  colaboradorId: string
  email: string | null
  nome: string
}

export async function criarNotificacaoTransacional(params: {
  tenantId: string | null
  tipo: string
  titulo: string
  mensagem: string
  entityType?: string
  entityId?: string
  ctaTexto?: string
  ctaUrl?: string
  destinatarios: Destinatario[]
  enviarEmail: boolean
  enviarEmailFn?: (params: { destinatario: string; nome: string }) => Promise<void>
}): Promise<void> {
  try {
    const supabase = await createAdminClient()

    const { data: notificacao, error: notificacaoError } = await supabase
      .from("notificacoes")
      .insert({
        tenant_id: params.tenantId,
        tipo: params.tipo,
        titulo: params.titulo,
        mensagem: params.mensagem,
        entity_type: params.entityType || null,
        entity_id: params.entityId || null,
        cta_texto: params.ctaTexto || null,
        cta_url: params.ctaUrl || null,
      })
      .select("id")
      .single()

    if (notificacaoError) {
      if (notificacaoError.code === "23505") {
        // Já existe uma notificação para esse evento exato — idempotência,
        // não é um erro real.
        return
      }
      console.error("[v0] Erro ao criar notificação:", notificacaoError)
      return
    }

    if (params.destinatarios.length === 0) return

    const { error: destinatariosError } = await supabase.from("notificacao_destinatarios").insert(
      params.destinatarios.map((d) => ({
        notificacao_id: notificacao.id,
        colaborador_id: d.colaboradorId,
      })),
    )

    if (destinatariosError) {
      console.error("[v0] Erro ao registrar destinatários da notificação:", destinatariosError)
    }

    if (!params.enviarEmail || !params.enviarEmailFn) return

    for (const destinatario of params.destinatarios) {
      if (!destinatario.email) {
        console.error(
          `[v0] Colaborador ${destinatario.colaboradorId} sem e-mail cadastrado — notificação "${params.tipo}" não enviada por e-mail.`,
        )
        continue
      }

      const { data: envio, error: envioError } = await supabase
        .from("email_envios")
        .insert({
          notificacao_id: notificacao.id,
          colaborador_id: destinatario.colaboradorId,
          email: destinatario.email,
          status: "pendente",
        })
        .select("id")
        .single()

      if (envioError) {
        // Índice único parcial barra reenvio pro mesmo destinatário — não é erro real.
        continue
      }

      try {
        await params.enviarEmailFn({ destinatario: destinatario.email, nome: destinatario.nome })
        await supabase.from("email_envios").update({ status: "enviado", enviado_em: new Date().toISOString() }).eq("id", envio.id)
      } catch (erroEnvio) {
        console.error("[v0] Erro ao enviar e-mail de notificação:", erroEnvio)
        await supabase
          .from("email_envios")
          .update({ status: "falhou", erro: erroEnvio instanceof Error ? erroEnvio.message : "Erro desconhecido" })
          .eq("id", envio.id)
      }
    }
  } catch (error) {
    // Uma falha aqui nunca pode quebrar a transação do evento real que
    // disparou a notificação (ex.: aprovação de pedido).
    console.error("[v0] Erro inesperado ao criar notificação transacional:", error)
  }
}

export async function resolverAprovadores(
  colaboradorId: string,
  tenantId: string | null,
  etapa: "gerente" | "financeiro",
): Promise<Destinatario[]> {
  const supabase = await createAdminClient()

  if (etapa === "gerente") {
    const { data: colaborador } = await supabase
      .from("colaboradores")
      .select("equipe_id")
      .eq("id", colaboradorId)
      .maybeSingle()

    if (!colaborador?.equipe_id) return []

    const { data: gerentesEquipes } = await supabase
      .from("gerentes_equipes")
      .select("gerente_id")
      .eq("equipe_id", colaborador.equipe_id)

    const gerenteIds = (gerentesEquipes || []).map((g) => g.gerente_id)
    if (gerenteIds.length === 0) return []

    const { data: gerentes } = await supabase
      .from("colaboradores")
      .select("id, nome_completo, email")
      .in("id", gerenteIds)
      .eq("ativo", true)

    return (gerentes || []).map((g) => ({ colaboradorId: g.id, nome: g.nome_completo, email: g.email }))
  }

  let query = supabase
    .from("colaboradores")
    .select("id, nome_completo, email")
    .in("tipo_acesso", ["Financeiro", "Adm"])
    .eq("ativo", true)

  query = tenantId ? query.eq("tenant_id", tenantId) : query.is("tenant_id", null)

  const { data: financeiro } = await query

  return (financeiro || []).map((f) => ({ colaboradorId: f.id, nome: f.nome_completo, email: f.email }))
}
