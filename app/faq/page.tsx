"use client"

import { useState } from "react"
import { ChevronDown, Search, Mail, Phone, HelpCircle, Shield, CreditCard, Users, Key } from "lucide-react"
import { Input } from "@/components/ui/input"
import { LegalPageShell } from "@/components/legal-page-shell"
import { cn } from "@/lib/utils"

const faqCategories = [
  {
    id: "acesso",
    title: "Acesso e Autenticação",
    icon: Key,
    questions: [
      {
        question: "Como recebo meu acesso ao FluxoPay?",
        answer:
          "O acesso é provisionado pelo administrador da empresa contratante. Após o cadastro, você recebe um e-mail com credenciais temporárias e deve alterar a senha no primeiro login. Caso não receba, verifique o spam ou contate simpleqia.oficial@gmail.com.",
      },
      {
        question: "Como recupero minha senha?",
        answer:
          "Clique em 'Esqueci minha senha' na tela de login e informe seu e-mail cadastrado. Você receberá um link de redefinição válido por 30 minutos. Se não chegar, contate simpleqia.oficial@gmail.com ou (11) 91486-0806 via WhatsApp com seu nome e empresa.",
      },
      {
        question: "Por que minha conta foi bloqueada?",
        answer:
          "Por segurança, a conta é bloqueada após 5 tentativas incorretas consecutivas. O desbloqueio automático ocorre após 15 minutos. Para desbloqueio imediato, contate o suporte informando seu e-mail e empresa.",
      },
      {
        question: "Posso usar o FluxoPay no celular?",
        answer:
          "Sim. O FluxoPay é responsivo e funciona em qualquer navegador moderno (Chrome, Firefox, Safari). Recomendamos ativar a trava de tela no dispositivo e evitar redes Wi-Fi públicas sem VPN.",
      },
    ],
  },
  {
    id: "gestao",
    title: "Gestão de Prestadores e Pagamentos",
    icon: CreditCard,
    questions: [
      {
        question: "O que o FluxoPay gerencia exatamente?",
        answer:
          "O FluxoPay é uma plataforma SaaS de gestão de prestadores de serviço com foco em controle de fluxo de validação, registro de contratos, status de aprovação e controle de pagamentos. Ciclo completo: cadastro, validação documental, aprovação multinível, ordem de pagamento, quitação e arquivamento.",
      },
      {
        question: "Como funciona o fluxo de aprovação?",
        answer:
          "O fluxo é configurado pelo administrador da empresa: (1) Cadastro do prestador com dados e documentos; (2) Triagem e validação documental; (3) Aprovação gerencial conforme hierarquia; (4) Liberação da ordem de pagamento. Cada etapa registra responsável, data e justificativa.",
      },
      {
        question: "Os dados de pagamento ficam armazenados no FluxoPay?",
        answer:
          "O FluxoPay registra os dados necessários para controle e auditoria (valores, datas, responsáveis, comprovantes). Dados bancários sensíveis são trafegados via canais criptografados com acesso restrito. A empresa não acessa dados financeiros fora do escopo operacional contratado.",
      },
      {
        question: "Como exportar relatórios de pagamento?",
        answer:
          "Acesse 'Relatórios' no menu principal, selecione filtros (período, prestador, status) e clique em 'Exportar'. Formatos disponíveis: PDF e CSV. Os relatórios incluem trilha de auditoria completa com todas as etapas do fluxo.",
      },
    ],
  },
  {
    id: "seguranca",
    title: "Segurança e Privacidade",
    icon: Shield,
    questions: [
      {
        question: "Como meus dados são protegidos?",
        answer:
          "Toda comunicação usa TLS 1.3. Senhas armazenadas com hash bcrypt (fator >= 12). Dados em repouso com AES-256. Logs imutáveis de todas as ações. MFA obrigatório para administradores. Revisões de segurança periódicas realizadas.",
      },
      {
        question: "Como reportar uma suspeita de incidente de segurança?",
        answer:
          "Notifique imediatamente via simpleqia.oficial@gmail.com ou WhatsApp (11) 91486-0806. Descreva o ocorrido, horário e funcionalidade envolvida. Nunca compartilhe sua senha com ninguém, nem com o suporte. SLA de resposta de 4 horas para incidentes críticos.",
      },
      {
        question: "O sistema registra minhas ações?",
        answer:
          "Sim. Por razões de segurança e auditoria, o FluxoPay registra logs de acesso, ações realizadas, alterações de dados e tentativas de login. Esses registros são acessíveis apenas pelo time de TI e gestores autorizados, conforme a Política de Privacidade.",
      },
    ],
  },
  {
    id: "suporte",
    title: "Suporte Técnico",
    icon: HelpCircle,
    questions: [
      {
        question: "Quais são os canais de suporte?",
        answer:
          "E-mail: simpleqia.oficial@gmail.com (resposta em até 24h úteis). WhatsApp: (11) 91486-0806 (seg-sex 8h-18h). Para incidentes críticos de produção: SLA de 4 horas corridas, 7 dias por semana. Sempre informe empresa, e-mail de acesso e descrição detalhada do problema.",
      },
      {
        question: "Como solicitar criação ou remoção de usuários?",
        answer:
          "O administrador da empresa pode gerenciar usuários no painel de configurações. Para operações em lote, contate simpleqia.oficial@gmail.com com nome completo, e-mail e nível de acesso desejado. Prazo de até 1 dia útil.",
      },
    ],
  },
]

export default function FAQPage() {
  const [searchTerm, setSearchTerm] = useState("")
  const [expandedQuestions, setExpandedQuestions] = useState<string[]>([])
  const [activeCategory, setActiveCategory] = useState<string | null>(null)

  const toggleQuestion = (id: string) => {
    setExpandedQuestions((prev) => (prev.includes(id) ? prev.filter((q) => q !== id) : [...prev, id]))
  }

  const filteredCategories = faqCategories
    .map((category) => ({
      ...category,
      questions: category.questions.filter(
        (q) =>
          q.question.toLowerCase().includes(searchTerm.toLowerCase()) ||
          q.answer.toLowerCase().includes(searchTerm.toLowerCase()),
      ),
    }))
    .filter((category) => category.questions.length > 0)

  const displayCategories = activeCategory ? filteredCategories.filter((c) => c.id === activeCategory) : filteredCategories

  return (
    <LegalPageShell
      activeHref="/faq"
      title="Central de Ajuda"
      subtitle="Encontre respostas para suas dúvidas sobre o FluxoPay"
    >
      <div className="relative max-w-lg mx-auto mb-6">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-text-tertiary" />
        <Input
          type="text"
          placeholder="Buscar perguntas..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10 h-11"
        />
      </div>

      <div className="flex flex-wrap gap-2 justify-center mb-8">
        <button
          onClick={() => setActiveCategory(null)}
          className={cn(
            "px-3 py-1.5 rounded-control text-sm font-medium transition-colors border",
            activeCategory === null
              ? "bg-primary text-primary-foreground border-primary"
              : "bg-card text-text-secondary hover:text-foreground border-border",
          )}
        >
          Todas
        </button>
        {faqCategories.map((category) => (
          <button
            key={category.id}
            onClick={() => setActiveCategory(category.id)}
            className={cn(
              "px-3 py-1.5 rounded-control text-sm font-medium transition-colors flex items-center gap-1.5 border",
              activeCategory === category.id
                ? "bg-primary text-primary-foreground border-primary"
                : "bg-card text-text-secondary hover:text-foreground border-border",
            )}
          >
            <category.icon className="h-3.5 w-3.5" />
            {category.title}
          </button>
        ))}
      </div>

      {displayCategories.map((category) => (
        <div key={category.id} className="mb-6">
          <div className="flex items-center gap-2.5 mb-3">
            <div className="p-1.5 bg-accent rounded-control">
              <category.icon className="h-4 w-4 text-primary" />
            </div>
            <h2 className="text-base font-semibold text-foreground">{category.title}</h2>
          </div>

          <div className="space-y-2">
            {category.questions.map((item, idx) => {
              const questionId = `${category.id}-${idx}`
              const isExpanded = expandedQuestions.includes(questionId)

              return (
                <div key={questionId} className="bg-card border border-border rounded-lg overflow-hidden">
                  <button
                    onClick={() => toggleQuestion(questionId)}
                    className="w-full flex items-center justify-between p-4 text-left hover:bg-surface transition-colors"
                  >
                    <span className="text-foreground text-sm font-medium pr-4">{item.question}</span>
                    <ChevronDown
                      className={cn(
                        "h-4 w-4 text-text-tertiary transition-transform shrink-0",
                        isExpanded && "rotate-180",
                      )}
                    />
                  </button>
                  {isExpanded && (
                    <div className="px-4 pb-4 text-text-secondary text-sm leading-relaxed border-t border-border pt-3">
                      {item.answer}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      ))}

      {displayCategories.length === 0 && (
        <div className="text-center py-12">
          <HelpCircle className="h-10 w-10 text-text-tertiary mx-auto mb-3" />
          <p className="text-text-secondary text-sm">Nenhuma pergunta encontrada para "{searchTerm}"</p>
        </div>
      )}

      <div className="mt-10 bg-card border border-border rounded-lg p-6 text-center">
        <h3 className="text-base font-semibold text-foreground mb-1">Ainda precisa de ajuda?</h3>
        <p className="text-text-secondary text-sm mb-5">Nossa equipe está pronta para ajudar você</p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          <a
            href="mailto:simpleqia.oficial@gmail.com"
            className="flex items-center gap-2 px-5 py-2.5 bg-primary text-primary-foreground rounded-control text-sm font-medium hover:bg-primary-hover transition-colors"
          >
            <Mail className="h-4 w-4" />
            simpleqia.oficial@gmail.com
          </a>
          <a
            href="https://wa.me/5511914860806"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 px-5 py-2.5 bg-card text-foreground rounded-control text-sm font-medium hover:bg-surface transition-colors border border-border"
          >
            <Phone className="h-4 w-4" />
            (11) 91486-0806
          </a>
        </div>
      </div>
    </LegalPageShell>
  )
}
