"use client"

import { useState } from "react"
import Link from "next/link"
import { ChevronDown, Search, ArrowLeft, Mail, Phone, HelpCircle, Shield, CreditCard, Users, Key } from "lucide-react"
import { Input } from "@/components/ui/input"

const faqCategories = [
  {
    id: "acesso",
    title: "Acesso e Autenticação",
    icon: Key,
    questions: [
      {
        question: "Como recebo meu acesso ao FluxoPay?",
        answer: "O acesso é provisionado pelo administrador da empresa contratante. Após o cadastro, você recebe um e-mail com credenciais temporárias e deve alterar a senha no primeiro login. Caso não receba, verifique o spam ou contate simpleqia.oficial@gmail.com."
      },
      {
        question: "Como recupero minha senha?",
        answer: "Clique em 'Esqueci minha senha' na tela de login e informe seu e-mail cadastrado. Você receberá um link de redefinição válido por 30 minutos. Se não chegar, contate simpleqia.oficial@gmail.com ou (11) 91486-0806 via WhatsApp com seu nome e empresa."
      },
      {
        question: "Por que minha conta foi bloqueada?",
        answer: "Por segurança, a conta é bloqueada após 5 tentativas incorretas consecutivas. O desbloqueio automático ocorre após 15 minutos. Para desbloqueio imediato, contate o suporte informando seu e-mail e empresa."
      },
      {
        question: "Posso usar o FluxoPay no celular?",
        answer: "Sim. O FluxoPay é responsivo e funciona em qualquer navegador moderno (Chrome, Firefox, Safari). Recomendamos ativar a trava de tela no dispositivo e evitar redes Wi-Fi públicas sem VPN."
      }
    ]
  },
  {
    id: "gestao",
    title: "Gestão de Prestadores e Pagamentos",
    icon: CreditCard,
    questions: [
      {
        question: "O que o FluxoPay gerencia exatamente?",
        answer: "O FluxoPay é uma plataforma SaaS de gestão de prestadores de serviço com foco em controle de fluxo de validação, registro de contratos, status de aprovação e controle de pagamentos. Ciclo completo: cadastro, validação documental, aprovação multinível, ordem de pagamento, quitação e arquivamento."
      },
      {
        question: "Como funciona o fluxo de aprovação?",
        answer: "O fluxo é configurado pelo administrador da empresa: (1) Cadastro do prestador com dados e documentos; (2) Triagem e validação documental; (3) Aprovação gerencial conforme hierarquia; (4) Liberação da ordem de pagamento. Cada etapa registra responsável, data e justificativa."
      },
      {
        question: "Os dados de pagamento ficam armazenados no FluxoPay?",
        answer: "O FluxoPay registra os dados necessários para controle e auditoria (valores, datas, responsáveis, comprovantes). Dados bancários sensíveis são trafegados via canais criptografados com acesso restrito. A empresa não acessa dados financeiros fora do escopo operacional contratado."
      },
      {
        question: "Como exportar relatórios de pagamento?",
        answer: "Acesse 'Relatórios' no menu principal, selecione filtros (período, prestador, status) e clique em 'Exportar'. Formatos disponíveis: PDF e CSV. Os relatórios incluem trilha de auditoria completa com todas as etapas do fluxo."
      }
    ]
  },
  {
    id: "seguranca",
    title: "Segurança e Privacidade",
    icon: Shield,
    questions: [
      {
        question: "Como meus dados são protegidos?",
        answer: "Toda comunicação usa TLS 1.3. Senhas armazenadas com hash bcrypt (fator >= 12). Dados em repouso com AES-256. Logs imutáveis de todas as ações. MFA obrigatório para administradores. Revisões de segurança periódicas realizadas."
      },
      {
        question: "Como reportar uma suspeita de incidente de segurança?",
        answer: "Notifique imediatamente via simpleqia.oficial@gmail.com ou WhatsApp (11) 91486-0806. Descreva o ocorrido, horário e funcionalidade envolvida. Nunca compartilhe sua senha com ninguém, nem com o suporte. SLA de resposta de 4 horas para incidentes críticos."
      },
      {
        question: "O sistema registra minhas ações?",
        answer: "Sim. Por razões de segurança e auditoria, o FluxoPay registra logs de acesso, ações realizadas, alterações de dados e tentativas de login. Esses registros são acessíveis apenas pelo time de TI e gestores autorizados, conforme a Política de Privacidade."
      }
    ]
  },
  {
    id: "suporte",
    title: "Suporte Técnico",
    icon: HelpCircle,
    questions: [
      {
        question: "Quais são os canais de suporte?",
        answer: "E-mail: simpleqia.oficial@gmail.com (resposta em até 24h úteis). WhatsApp: (11) 91486-0806 (seg-sex 8h-18h). Para incidentes críticos de produção: SLA de 4 horas corridas, 7 dias por semana. Sempre informe empresa, e-mail de acesso e descrição detalhada do problema."
      },
      {
        question: "Como solicitar criação ou remoção de usuários?",
        answer: "O administrador da empresa pode gerenciar usuários no painel de configurações. Para operações em lote, contate simpleqia.oficial@gmail.com com nome completo, e-mail e nível de acesso desejado. Prazo de até 1 dia útil."
      }
    ]
  }
]

export default function FAQPage() {
  const [searchTerm, setSearchTerm] = useState("")
  const [expandedQuestions, setExpandedQuestions] = useState<string[]>([])
  const [activeCategory, setActiveCategory] = useState<string | null>(null)

  const toggleQuestion = (id: string) => {
    setExpandedQuestions(prev =>
      prev.includes(id) ? prev.filter(q => q !== id) : [...prev, id]
    )
  }

  const filteredCategories = faqCategories.map(category => ({
    ...category,
    questions: category.questions.filter(q =>
      q.question.toLowerCase().includes(searchTerm.toLowerCase()) ||
      q.answer.toLowerCase().includes(searchTerm.toLowerCase())
    )
  })).filter(category => category.questions.length > 0)

  const displayCategories = activeCategory
    ? filteredCategories.filter(c => c.id === activeCategory)
    : filteredCategories

  return (
    <div className="min-h-screen bg-[#0a0f1a]">
      {/* Header */}
      <header className="w-full py-4 px-6 border-b border-gray-800">
        <nav className="max-w-7xl mx-auto flex items-center justify-between">
          <Link href="/login" className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors">
            <ArrowLeft className="h-4 w-4" />
            <span className="text-sm">Voltar ao Login</span>
          </Link>
          <div className="flex items-center gap-2">
            <Link href="/login" className="px-4 py-2 text-gray-400 hover:text-white transition-colors text-sm font-medium">Login</Link>
            <Link href="/faq" className="px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium">FAQ</Link>
            <Link href="/termos" className="px-4 py-2 text-gray-400 hover:text-white transition-colors text-sm font-medium">Termos</Link>
            <Link href="/privacidade" className="px-4 py-2 text-gray-400 hover:text-white transition-colors text-sm font-medium">Privacidade</Link>
          </div>
        </nav>
      </header>

      {/* Hero */}
      <div className="bg-gradient-to-b from-primary/10 to-transparent py-16 px-4">
        <div className="max-w-3xl mx-auto text-center">
          <h1 className="text-4xl font-bold text-white mb-4">Central de Ajuda</h1>
          <p className="text-gray-400 mb-8">Encontre respostas para suas dúvidas sobre o FluxoPay</p>

          {/* Search */}
          <div className="relative max-w-xl mx-auto">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-500" />
            <Input
              type="text"
              placeholder="Buscar perguntas..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-12 h-14 bg-[#111827] border-gray-700 text-white placeholder:text-gray-500 text-lg rounded-xl"
            />
          </div>
        </div>
      </div>

      {/* Category Pills */}
      <div className="max-w-5xl mx-auto px-4 py-6">
        <div className="flex flex-wrap gap-3 justify-center">
          <button
            onClick={() => setActiveCategory(null)}
            className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
              activeCategory === null
                ? 'bg-primary text-white'
                : 'bg-[#111827] text-gray-400 hover:text-white border border-gray-700'
            }`}
          >
            Todas
          </button>
          {faqCategories.map(category => (
            <button
              key={category.id}
              onClick={() => setActiveCategory(category.id)}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-colors flex items-center gap-2 ${
                activeCategory === category.id
                  ? 'bg-primary text-white'
                  : 'bg-[#111827] text-gray-400 hover:text-white border border-gray-700'
              }`}
            >
              <category.icon className="h-4 w-4" />
              {category.title}
            </button>
          ))}
        </div>
      </div>

      {/* FAQ Content */}
      <div className="max-w-4xl mx-auto px-4 pb-16">
        {displayCategories.map(category => (
          <div key={category.id} className="mb-8">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-primary/10 rounded-lg">
                <category.icon className="h-5 w-5 text-primary" />
              </div>
              <h2 className="text-xl font-semibold text-white">{category.title}</h2>
            </div>

            <div className="space-y-3">
              {category.questions.map((item, idx) => {
                const questionId = `${category.id}-${idx}`
                const isExpanded = expandedQuestions.includes(questionId)

                return (
                  <div
                    key={questionId}
                    className="bg-[#111827] border border-gray-800 rounded-xl overflow-hidden"
                  >
                    <button
                      onClick={() => toggleQuestion(questionId)}
                      className="w-full flex items-center justify-between p-4 text-left hover:bg-gray-800/50 transition-colors"
                    >
                      <span className="text-white font-medium pr-4">{item.question}</span>
                      <ChevronDown className={`h-5 w-5 text-gray-400 transition-transform flex-shrink-0 ${isExpanded ? 'rotate-180' : ''}`} />
                    </button>
                    {isExpanded && (
                      <div className="px-4 pb-4 text-gray-400 text-sm leading-relaxed border-t border-gray-800 pt-4">
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
            <HelpCircle className="h-12 w-12 text-gray-600 mx-auto mb-4" />
            <p className="text-gray-400">Nenhuma pergunta encontrada para "{searchTerm}"</p>
          </div>
        )}

        {/* Contact Box */}
        <div className="mt-12 bg-[#111827] border border-gray-800 rounded-2xl p-8 text-center">
          <h3 className="text-xl font-semibold text-white mb-2">Ainda precisa de ajuda?</h3>
          <p className="text-gray-400 mb-6">Nossa equipe está pronta para ajudar você</p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <a
              href="mailto:simpleqia.oficial@gmail.com"
              className="flex items-center gap-2 px-6 py-3 bg-primary text-white rounded-xl hover:bg-primary/90 transition-colors"
            >
              <Mail className="h-5 w-5" />
              simpleqia.oficial@gmail.com
            </a>
            <a
              href="https://wa.me/5511914860806"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 px-6 py-3 bg-[#1a2332] text-white rounded-xl hover:bg-gray-700 transition-colors border border-gray-700"
            >
              <Phone className="h-5 w-5" />
              (11) 91486-0806
            </a>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="py-6 px-4 border-t border-gray-800">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-gray-500">
          <p>2025 FluxoPay - Simpleqia. Todos os direitos reservados.</p>
          <div className="flex items-center gap-4">
            <Link href="/termos" className="hover:text-white transition-colors">Termos</Link>
<Link href="/privacidade" className="hover:text-white transition-colors">Privacidade</Link>
          </div>
        </div>
      </footer>
    </div>
  )
}
