import { Resend } from "resend"

// Instanciado sob demanda, nunca no carregamento do módulo: o construtor do
// Resend lança exceção se a chave estiver ausente, e isso derrubaria o build
// (ou qualquer rota que importe este arquivo) em qualquer ambiente sem a
// variável configurada — inclusive antes da primeira configuração na Vercel.
function getResendClient(): Resend | null {
  if (!process.env.RESEND_API_KEY) {
    console.error("[v0] RESEND_API_KEY não configurada — e-mail não enviado.")
    return null
  }
  return new Resend(process.env.RESEND_API_KEY)
}

const FROM = process.env.RESEND_FROM_EMAIL || "FluxoPay <notificacoes@simpleqia.com>"
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "https://fluxopay.connectvending.simpleqia.com"

function emailShell(opts: {
  preheader: string
  heading: string
  bodyHtml: string
  imagemUrl?: string
  cta?: { label: string; url: string } | null
}) {
  const imagemHtml = opts.imagemUrl
    ? `<img src="${opts.imagemUrl}" alt="" style="display:block; width:100%; max-width:416px; border-radius:8px; margin:0 0 20px 0;" />`
    : ""

  const ctaHtml = opts.cta
    ? `<table role="presentation" cellpadding="0" cellspacing="0" style="margin-top:28px;">
                <tr>
                  <td style="border-radius:6px; background-color:#0066E5;">
                    <a href="${opts.cta.url}" target="_blank" style="display:inline-block; padding:12px 24px; font-size:14px; font-weight:600; color:#FFFFFF; text-decoration:none; border-radius:6px;">${opts.cta.label}</a>
                  </td>
                </tr>
              </table>
              <p style="margin:20px 0 0 0; font-size:12px; line-height:18px; color:#8792A2;">Se o botão não funcionar, copie e cole este link no navegador:<br />
                <a href="${opts.cta.url}" style="color:#0066E5; word-break:break-all;">${opts.cta.url}</a>
              </p>`
    : ""

  return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>${opts.heading}</title>
</head>
<body style="margin:0; padding:0; background-color:#F6F8FA; font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
  <div style="display:none; max-height:0; overflow:hidden; opacity:0;">${opts.preheader}</div>
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#F6F8FA; padding:32px 16px;">
    <tr>
      <td align="center">
        <table role="presentation" width="480" cellpadding="0" cellspacing="0" style="max-width:480px; width:100%; background-color:#FFFFFF; border-radius:12px; overflow:hidden; border:1px solid #E3E8EE;">
          <tr>
            <td style="padding:28px 32px 20px 32px; border-bottom:1px solid #E3E8EE;">
              <span style="font-size:20px; font-weight:700; color:#0066E5; letter-spacing:-0.02em;">FluxoPay</span>
            </td>
          </tr>
          <tr>
            <td style="padding:32px;">
              ${imagemHtml}
              <h1 style="margin:0 0 16px 0; font-size:20px; line-height:28px; font-weight:600; color:#1A1F36;">${opts.heading}</h1>
              <div style="font-size:14px; line-height:22px; color:#545C6B;">${opts.bodyHtml}</div>
              ${ctaHtml}
            </td>
          </tr>
          <tr>
            <td style="padding:20px 32px; background-color:#F6F8FA; border-top:1px solid #E3E8EE;">
              <p style="margin:0; font-size:12px; line-height:18px; color:#8792A2;">FluxoPay · Sistema de gestão de pagamentos<br />Este é um e-mail automático, não é necessário responder.</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`
}

export async function enviarEmailNotaFiscalPendente(params: {
  destinatario: string
  nomeColaborador: string
  prazoDias: number
}) {
  const heading = "Seu pedido foi aprovado — falta anexar a nota fiscal"
  const bodyHtml = `
    <p style="margin:0 0 12px 0;">Olá, ${params.nomeColaborador}.</p>
    <p style="margin:0 0 12px 0;">Seu pedido de pagamento foi aprovado pelo financeiro. Para que o pagamento seja processado, você precisa anexar a nota fiscal em até ${params.prazoDias} dias.</p>
    <p style="margin:0;">Acesse o sistema e anexe sua nota fiscal o quanto antes.</p>
  `
  const resend = getResendClient()
  if (!resend) return

  const textoAlternativo = `Olá, ${params.nomeColaborador}.\n\nSeu pedido de pagamento foi aprovado pelo financeiro. Para que o pagamento seja processado, você precisa anexar a nota fiscal em até ${params.prazoDias} dias.\n\nAcesse: ${APP_URL}`

  try {
    await resend.emails.send({
      from: FROM,
      to: params.destinatario,
      subject: "Pedido aprovado — anexe sua nota fiscal",
      html: emailShell({
        preheader: "Seu pedido foi aprovado. Anexe a nota fiscal para receber o pagamento.",
        heading,
        bodyHtml,
        cta: { label: "Acessar e anexar nota", url: APP_URL },
      }),
      text: textoAlternativo,
    })
  } catch (error) {
    console.error("[v0] Erro ao enviar e-mail de nota fiscal pendente:", error)
  }
}

export async function enviarEmailRedefinicaoSenha(params: { destinatario: string; nomeColaborador: string; token: string }) {
  const resetUrl = `${APP_URL}/redefinir-senha/${params.token}`
  const heading = "Redefinição de senha"
  const bodyHtml = `
    <p style="margin:0 0 12px 0;">Olá, ${params.nomeColaborador}.</p>
    <p style="margin:0 0 12px 0;">Recebemos uma solicitação para redefinir a senha da sua conta no FluxoPay. Clique no botão abaixo para criar uma nova senha.</p>
    <p style="margin:0;">Se você não solicitou essa alteração, pode ignorar este e-mail — sua senha atual continua válida. Este link expira em 1 hora.</p>
  `
  const resend = getResendClient()
  if (!resend) return

  const textoAlternativo = `Olá, ${params.nomeColaborador}.\n\nRecebemos uma solicitação para redefinir a senha da sua conta no FluxoPay. Acesse o link abaixo para criar uma nova senha (expira em 1 hora):\n${resetUrl}\n\nSe você não solicitou essa alteração, pode ignorar este e-mail — sua senha atual continua válida.`

  try {
    await resend.emails.send({
      from: FROM,
      to: params.destinatario,
      subject: "Redefinição de senha — FluxoPay",
      html: emailShell({
        preheader: "Clique para criar uma nova senha da sua conta FluxoPay.",
        heading,
        bodyHtml,
        cta: { label: "Redefinir minha senha", url: resetUrl },
      }),
      text: textoAlternativo,
    })
  } catch (error) {
    console.error("[v0] Erro ao enviar e-mail de redefinição de senha:", error)
  }
}

function escapeHtml(texto: string): string {
  return texto.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
}

function paragrafosHtml(texto: string): string {
  return texto
    .split("\n")
    .filter((linha) => linha.trim().length > 0)
    .map((linha) => `<p style="margin:0 0 12px 0;">${escapeHtml(linha)}</p>`)
    .join("")
}

export async function enviarEmailAtualizacao(params: {
  destinatario: string
  nome: string
  titulo: string
  subtitulo?: string | null
  descricao: string
  imagemUrl?: string | null
  cta?: { label: string; url: string } | null
}) {
  const bodyHtml = `
    <p style="margin:0 0 12px 0;">Olá, ${escapeHtml(params.nome)}.</p>
    ${params.subtitulo ? `<p style="margin:0 0 12px 0; font-weight:600; color:#1A1F36;">${escapeHtml(params.subtitulo)}</p>` : ""}
    ${paragrafosHtml(params.descricao)}
  `
  const resend = getResendClient()
  if (!resend) return

  const textoAlternativo = `Olá, ${params.nome}.\n\n${params.subtitulo ? params.subtitulo + "\n\n" : ""}${params.descricao}${params.cta ? `\n\n${params.cta.label}: ${params.cta.url}` : ""}`

  try {
    await resend.emails.send({
      from: FROM,
      to: params.destinatario,
      subject: params.titulo,
      html: emailShell({
        preheader: params.subtitulo || params.titulo,
        heading: params.titulo,
        bodyHtml,
        imagemUrl: params.imagemUrl || undefined,
        cta: params.cta,
      }),
      text: textoAlternativo,
    })
  } catch (error) {
    console.error("[v0] Erro ao enviar e-mail de atualização:", error)
  }
}

export async function enviarEmailPedidoAguardandoAprovacao(params: {
  destinatario: string
  nomeAprovador: string
  nomeColaborador: string
}) {
  const heading = "Pedido aguardando sua aprovação"
  const bodyHtml = `
    <p style="margin:0 0 12px 0;">Olá, ${escapeHtml(params.nomeAprovador)}.</p>
    <p style="margin:0 0 12px 0;">${escapeHtml(params.nomeColaborador)} enviou um pedido de pagamento que está aguardando a sua aprovação.</p>
    <p style="margin:0;">Acesse o FluxoPay para revisar e aprovar.</p>
  `
  const resend = getResendClient()
  if (!resend) return

  const textoAlternativo = `Olá, ${params.nomeAprovador}.\n\n${params.nomeColaborador} enviou um pedido de pagamento que está aguardando a sua aprovação.\n\nAcesse: ${APP_URL}`

  try {
    await resend.emails.send({
      from: FROM,
      to: params.destinatario,
      subject: "Pedido aguardando aprovação — FluxoPay",
      html: emailShell({
        preheader: `${params.nomeColaborador} enviou um pedido aguardando sua aprovação.`,
        heading,
        bodyHtml,
        cta: { label: "Aprovar pedido", url: APP_URL },
      }),
      text: textoAlternativo,
    })
  } catch (error) {
    console.error("[v0] Erro ao enviar e-mail de pedido aguardando aprovação:", error)
  }
}
