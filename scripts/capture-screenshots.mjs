// Script reutilizável de captura de tela — rode de novo a cada iteração de design.
// Uso: node scripts/capture-screenshots.mjs
// Requer o dev server já rodando (padrão: http://localhost:3010) e as env vars
// SCREENSHOT_EMAIL / SCREENSHOT_SENHA apontando pra uma conta de teste.

import { chromium } from "playwright"
import { mkdir } from "node:fs/promises"
import path from "node:path"

const BASE_URL = process.env.SCREENSHOT_BASE_URL || "http://localhost:3010"
const EMAIL = process.env.SCREENSHOT_EMAIL
const SENHA = process.env.SCREENSHOT_SENHA
const OUT_DIR = path.resolve("screenshots")

const VIEWPORTS = [
  { name: "desktop", width: 1440, height: 900 },
  { name: "mobile", width: 375, height: 812 },
]

const ROUTES = [
  { path: "/", name: "dashboard" },
  { path: "/aprovacoes", name: "aprovacoes" },
  { path: "/pedidos", name: "pedidos" },
  { path: "/financeiro", name: "financeiro" },
  { path: "/financeiro/colaboradores", name: "financeiro-colaboradores" },
  { path: "/historico", name: "historico" },
  { path: "/historico-completo", name: "historico-completo" },
  { path: "/gestao", name: "gestao" },
  { path: "/gestao/notas", name: "gestao-notas" },
  { path: "/gestao/reajustes", name: "gestao-reajustes" },
  { path: "/gestao/aceites", name: "gestao-aceites" },
  { path: "/cadastros", name: "cadastros" },
  { path: "/cadastros/colaboradores", name: "cadastros-colaboradores" },
  { path: "/cadastros/equipes", name: "cadastros-equipes" },
  { path: "/cadastros/centros-custo", name: "cadastros-centros-custo" },
  { path: "/faturas", name: "faturas" },
  { path: "/acompanhamento", name: "acompanhamento" },
  { path: "/fiscal", name: "fiscal" },
]

async function login(page) {
  if (!EMAIL || !SENHA) {
    throw new Error("Defina SCREENSHOT_EMAIL e SCREENSHOT_SENHA antes de rodar.")
  }
  await page.goto(`${BASE_URL}/login`, { waitUntil: "load", timeout: 30000 })
  await page.waitForSelector('input[type="email"]', { timeout: 15000 })
  // Espera a hidratacao do React terminar antes de interagir, senao o clique
  // vira submit HTML nativo (sem handler JS anexado ainda).
  await page.waitForTimeout(2000)
  await page.fill('input[type="email"]', EMAIL)
  await page.fill('input[type="password"]', SENHA)
  await page.click('button[type="submit"]')
  await page.waitForTimeout(10000)
  const url = page.url()
  console.log("URL apos submit:", url)
  if (url.includes("/login")) {
    const bodyText = await page.textContent("body")
    console.log("Conteudo da pagina de login apos submit (procurando erro):", bodyText?.slice(0, 800))
    throw new Error("Login nao navegou para fora de /login")
  }
}

async function main() {
  await mkdir(OUT_DIR, { recursive: true })

  const browser = await chromium.launch()
  const context = await browser.newContext({ viewport: VIEWPORTS[0] })
  const page = await context.newPage()
  page.on("console", (msg) => console.log("[browser console]", msg.type(), msg.text()))
  page.on("pageerror", (err) => console.log("[browser pageerror]", err.message))
  page.on("requestfailed", (req) => console.log("[request failed]", req.url(), req.failure()?.errorText))

  await login(page)

  for (const viewport of VIEWPORTS) {
    await page.setViewportSize({ width: viewport.width, height: viewport.height })
    for (const route of ROUTES) {
      try {
        await page.goto(`${BASE_URL}${route.path}`, { waitUntil: "domcontentloaded", timeout: 20000 })
        await page.waitForTimeout(1200)
        const filename = path.join(OUT_DIR, `${route.name}-${viewport.name}.png`)
        await page.screenshot({ path: filename, fullPage: process.env.SCREENSHOT_FULLPAGE === "1" })
        console.log(`OK   ${viewport.name.padEnd(8)} ${route.path} -> ${filename}`)
      } catch (err) {
        console.error(`FAIL ${viewport.name.padEnd(8)} ${route.path}: ${err.message}`)
      }
    }
  }

  await browser.close()
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
