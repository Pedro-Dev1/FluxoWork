"use server"

import { createAdminClient } from "@/lib/supabase-server"
import { createSession, destroySession, getSession } from "@/lib/session"
import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"
import bcrypt from "bcryptjs"
import crypto from "crypto"
import { enviarEmailRedefinicaoSenha } from "@/lib/email"

function validarForcaSenha(senha: string): string | null {
  if (senha.length < 8) return "A nova senha deve ter no mínimo 8 caracteres"
  if (!/[A-Z]/.test(senha) || !/[a-z]/.test(senha) || !/[0-9]/.test(senha)) {
    return "A senha deve conter letras maiúsculas, minúsculas e números"
  }
  return null
}

const loginAttempts = new Map<string, { count: number; lastAttempt: number }>()

function checkRateLimit(email: string): boolean {
  const now = Date.now()
  const attempt = loginAttempts.get(email)

  if (attempt) {
    // Reset after 15 minutes
    if (now - attempt.lastAttempt > 15 * 60 * 1000) {
      loginAttempts.delete(email)
      return true
    }

    // Block after 5 attempts
    if (attempt.count >= 5) {
      return false
    }

    attempt.count++
    attempt.lastAttempt = now
  } else {
    loginAttempts.set(email, { count: 1, lastAttempt: now })
  }

  return true
}

export async function login(email: string, password: string) {
  if (!email || !password) {
    return { error: "Email e senha são obrigatórios." }
  }

  const sanitizedEmail = email.trim().toLowerCase()

  if (!checkRateLimit(sanitizedEmail)) {
    return {
      error: "Muitas tentativas de login. Tente novamente em 15 minutos.",
    }
  }

  const supabaseAdmin = await createAdminClient()

  const { data: colaborador, error: dbError } = await supabaseAdmin
    .from("colaboradores")
    .select("*")
    .eq("email", sanitizedEmail)
    .maybeSingle()

  if (dbError) {
    console.error("[v0] Database error during login:", dbError)
    return { error: "Erro ao processar login. Tente novamente." }
  }

  if (!colaborador) {
    return { error: "Email ou senha incorretos." }
  }

  let senhaValida = false
  const isBcryptHash = colaborador.senha_hash.startsWith("$2a$") || colaborador.senha_hash.startsWith("$2b$")

  if (isBcryptHash) {
    // Password is already hashed with bcrypt
    senhaValida = await bcrypt.compare(password, colaborador.senha_hash)
  } else {
    // Password is in plain text - compare directly and migrate
    senhaValida = colaborador.senha_hash === password

    if (senhaValida) {
      // Migrate to bcrypt hash
      const hashedPassword = await bcrypt.hash(password, 10)
      await supabaseAdmin.from("colaboradores").update({ senha_hash: hashedPassword }).eq("id", colaborador.id)

      console.log("[v0] Migrated password to bcrypt for user:", sanitizedEmail)
    }
  }

  if (!senhaValida) {
    return { error: "Email ou senha incorretos." }
  }

  if (colaborador.ativo === false) {
    return { error: "Esta conta foi desativada. Entre em contato com o administrador do sistema." }
  }

  // Clear rate limiting on successful login
  loginAttempts.delete(sanitizedEmail)

  await createSession({
    colaboradorId: colaborador.id,
    email: colaborador.email,
    nomeCompleto: colaborador.nome_completo,
    tipoAcesso: colaborador.tipo_acesso,
    cnpj: colaborador.cnpj,
    salario: colaborador.salario,
  })

  revalidatePath("/", "layout")

  if (colaborador.tipo_acesso === "Colaborador") {
    redirect("/meus-pagamentos")
  } else {
    redirect("/")
  }
}

export async function logout() {
  await destroySession()
  revalidatePath("/", "layout")
  redirect("/login")
}

export async function getUsuarioLogado() {
  return await getSession()
}

export async function redefinirSenha(senhaAtual: string, novaSenha: string) {
  const session = await getSession()

  if (!session?.colaboradorId) {
    return {
      success: false,
      error: "Usuário não autenticado",
    }
  }

  if (novaSenha.length < 8) {
    return {
      success: false,
      error: "A nova senha deve ter no mínimo 8 caracteres",
    }
  }

  if (!/[A-Z]/.test(novaSenha) || !/[a-z]/.test(novaSenha) || !/[0-9]/.test(novaSenha)) {
    return {
      success: false,
      error: "A senha deve conter letras maiúsculas, minúsculas e números",
    }
  }

  const supabaseAdmin = await createAdminClient()

  // Verificar senha atual
  const { data: colaborador, error: dbError } = await supabaseAdmin
    .from("colaboradores")
    .select("senha_hash")
    .eq("id", session.colaboradorId)
    .single()

  if (dbError || !colaborador) {
    return {
      success: false,
      error: "Colaborador não encontrado",
    }
  }

  let senhaAtualValida = false
  const isBcryptHash = colaborador.senha_hash.startsWith("$2a$") || colaborador.senha_hash.startsWith("$2b$")

  if (isBcryptHash) {
    senhaAtualValida = await bcrypt.compare(senhaAtual, colaborador.senha_hash)
  } else {
    // Legacy plain text password
    senhaAtualValida = colaborador.senha_hash === senhaAtual
  }

  if (!senhaAtualValida) {
    return {
      success: false,
      error: "Senha atual incorreta",
    }
  }

  // Hash the new password
  const hashedPassword = await bcrypt.hash(novaSenha, 10)

  // Atualizar senha
  const { error } = await supabaseAdmin
    .from("colaboradores")
    .update({ senha_hash: hashedPassword })
    .eq("id", session.colaboradorId)

  if (error) {
    return {
      success: false,
      error: "Erro ao atualizar senha: " + error.message,
    }
  }

  return {
    success: true,
    message: "Senha atualizada com sucesso!",
  }
}

const resetRequestAttempts = new Map<string, { count: number; lastAttempt: number }>()

function checkResetRateLimit(email: string): boolean {
  const now = Date.now()
  const attempt = resetRequestAttempts.get(email)

  if (attempt) {
    if (now - attempt.lastAttempt > 15 * 60 * 1000) {
      resetRequestAttempts.delete(email)
      return true
    }
    if (attempt.count >= 3) {
      return false
    }
    attempt.count++
    attempt.lastAttempt = now
  } else {
    resetRequestAttempts.set(email, { count: 1, lastAttempt: now })
  }

  return true
}

const MENSAGEM_GENERICA = "Se esse e-mail estiver cadastrado, enviaremos um link para redefinir a senha."

export async function solicitarRedefinicaoSenha(email: string) {
  const sanitizedEmail = email.trim().toLowerCase()

  if (!sanitizedEmail) {
    return { success: false, error: "Informe um e-mail" }
  }

  if (!checkResetRateLimit(sanitizedEmail)) {
    return { success: false, error: "Muitas solicitações. Tente novamente em 15 minutos." }
  }

  const supabaseAdmin = await createAdminClient()

  const { data: colaborador } = await supabaseAdmin
    .from("colaboradores")
    .select("id, nome_completo, email, ativo")
    .eq("email", sanitizedEmail)
    .maybeSingle()

  // Não revela se o e-mail existe ou não — mesma resposta em ambos os casos.
  if (!colaborador || colaborador.ativo === false) {
    return { success: true, message: MENSAGEM_GENERICA }
  }

  const token = crypto.randomBytes(32).toString("hex")
  const expiresAt = new Date(Date.now() + 60 * 60 * 1000).toISOString()

  const { error } = await supabaseAdmin
    .from("colaboradores")
    .update({ reset_token: token, reset_token_expires_at: expiresAt })
    .eq("id", colaborador.id)

  if (error) {
    console.error("[v0] Erro ao gerar token de redefinição:", error)
    return { success: true, message: MENSAGEM_GENERICA }
  }

  await enviarEmailRedefinicaoSenha({
    destinatario: colaborador.email,
    nomeColaborador: colaborador.nome_completo,
    token,
  })

  return { success: true, message: MENSAGEM_GENERICA }
}

export async function verificarTokenRedefinicao(token: string) {
  if (!token) return { valido: false }

  const supabaseAdmin = await createAdminClient()

  const { data: colaborador } = await supabaseAdmin
    .from("colaboradores")
    .select("id, reset_token_expires_at")
    .eq("reset_token", token)
    .maybeSingle()

  if (!colaborador || !colaborador.reset_token_expires_at) {
    return { valido: false }
  }

  if (new Date(colaborador.reset_token_expires_at).getTime() < Date.now()) {
    return { valido: false }
  }

  return { valido: true }
}

export async function redefinirSenhaComToken(token: string, novaSenha: string) {
  if (!token) {
    return { success: false, error: "Link inválido" }
  }

  const erroForca = validarForcaSenha(novaSenha)
  if (erroForca) {
    return { success: false, error: erroForca }
  }

  const supabaseAdmin = await createAdminClient()

  const { data: colaborador } = await supabaseAdmin
    .from("colaboradores")
    .select("id, reset_token_expires_at")
    .eq("reset_token", token)
    .maybeSingle()

  if (!colaborador || !colaborador.reset_token_expires_at) {
    return { success: false, error: "Link inválido ou expirado" }
  }

  if (new Date(colaborador.reset_token_expires_at).getTime() < Date.now()) {
    return { success: false, error: "Link inválido ou expirado" }
  }

  const hashedPassword = await bcrypt.hash(novaSenha, 10)

  const { error } = await supabaseAdmin
    .from("colaboradores")
    .update({ senha_hash: hashedPassword, reset_token: null, reset_token_expires_at: null })
    .eq("id", colaborador.id)

  if (error) {
    console.error("[v0] Erro ao redefinir senha:", error)
    return { success: false, error: "Erro ao redefinir senha. Tente novamente." }
  }

  return { success: true, message: "Senha redefinida com sucesso!" }
}
