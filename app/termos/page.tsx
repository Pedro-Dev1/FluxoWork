import Link from "next/link"
import { ArrowLeft, FileText, Calendar, Mail, Phone, AlertTriangle, Info } from "lucide-react"

export default function TermosPage() {
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
            <Link href="/faq" className="px-4 py-2 text-gray-400 hover:text-white transition-colors text-sm font-medium">FAQ</Link>
            <Link href="/termos" className="px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium">Termos</Link>
            <Link href="/privacidade" className="px-4 py-2 text-gray-400 hover:text-white transition-colors text-sm font-medium">Privacidade</Link>
          </div>
        </nav>
      </header>

      {/* Hero */}
      <div className="bg-gradient-to-b from-primary/10 to-transparent py-16 px-4">
        <div className="max-w-3xl mx-auto text-center">
          <div className="inline-flex items-center justify-center p-3 bg-primary/10 rounded-2xl mb-6">
            <FileText className="h-8 w-8 text-primary" />
          </div>
          <h1 className="text-4xl font-bold text-white mb-4">Termos de Uso</h1>
          <p className="text-gray-300 mb-4">FluxoPay - Plataforma de Gestão de Prestadores de Serviço</p>
          <div className="flex items-center justify-center gap-2 text-gray-400 text-sm">
            <Calendar className="h-4 w-4" />
            <span>Última atualização: 02/04/2026 | Versão 2.1</span>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-4 pb-16">
        <div className="bg-[#111827] border border-gray-800 rounded-2xl p-8 space-y-8">

          {/* Declaração */}
          <div className="bg-primary/10 border border-primary/20 rounded-xl p-4">
            <p className="text-gray-300 italic text-center">
              "Declaro que li, compreendi e concordo com os Termos de Uso e a Política de Privacidade do FluxoPay."
            </p>
          </div>

          <section>
            <h2 className="text-xl font-semibold text-white mb-4">1. Identificação</h2>
            <p className="text-gray-400 leading-relaxed">
              O FluxoPay é uma plataforma digital operada por FELIPE NOGUEIRA SILVA SERVIÇOS COMÉRCIO E LOCAÇÃO,
              inscrita no CNPJ sob o nº 26.344.386/0001-42, com nome fantasia KAFERRI TEC SERVIÇOS, com sede em
              Osasco/SP, responsável pelo desenvolvimento, manutenção e gestão da plataforma.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-4">2. Aceite dos Termos</h2>
            <p className="text-gray-400 leading-relaxed mb-4">
              Ao acessar, utilizar ou se cadastrar na plataforma FluxoPay, o usuário declara que leu, compreendeu
              e concorda integralmente com estes Termos de Uso e com a Política de Privacidade aplicável. O aceite
              é condição indispensável para utilização do sistema.
            </p>
            <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4 flex items-start gap-3">
              <AlertTriangle className="h-5 w-5 text-red-400 mt-0.5 flex-shrink-0" />
              <p className="text-red-300 text-sm">
                Caso o usuário não concorde, total ou parcialmente, com quaisquer disposições aqui previstas,
                deverá abster-se imediatamente de utilizar a plataforma.
              </p>
            </div>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-4">3. Objeto da Plataforma</h2>
            <p className="text-gray-400 leading-relaxed mb-4">
              O FluxoPay consiste em uma plataforma digital voltada à gestão e organização de processos financeiros
              corporativos, permitindo, entre outras funcionalidades:
            </p>
            <ul className="list-disc list-inside text-gray-400 space-y-2 ml-4 mb-4">
              <li>Criação, controle e acompanhamento de solicitações de pagamento</li>
              <li>Definição e gestão de fluxos de aprovação internos</li>
              <li>Anexação, armazenamento e validação de documentos</li>
              <li>Controle de prazos, status e responsáveis</li>
              <li>Registro e rastreabilidade de operações</li>
            </ul>
            <div className="bg-blue-500/10 border border-blue-500/30 rounded-xl p-4 flex items-start gap-3">
              <Info className="h-5 w-5 text-blue-400 mt-0.5 flex-shrink-0" />
              <p className="text-blue-300 text-sm">
                O FluxoPay não realiza movimentações financeiras, não sendo instituição financeira, banco,
                intermediadora de pagamentos ou responsável por execuções de transferências, limitando-se à
                gestão e organização de informações.
              </p>
            </div>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-4">4. Cadastro e Acesso</h2>
            <p className="text-gray-400 leading-relaxed mb-4">
              O acesso à plataforma é restrito a usuários devidamente autorizados pela empresa contratante.
              A gestão de usuários, permissões e acessos é de inteira responsabilidade da empresa contratante.
            </p>
            <p className="text-gray-400 leading-relaxed mb-2">O usuário compromete-se a:</p>
            <ul className="list-disc list-inside text-gray-400 space-y-2 ml-4 mb-4">
              <li>Fornecer informações verdadeiras, completas e atualizadas</li>
              <li>Manter a confidencialidade de suas credenciais de acesso</li>
              <li>Não compartilhar login e senha com terceiros</li>
              <li>Utilizar a plataforma exclusivamente para fins legítimos e autorizados</li>
            </ul>
            <p className="text-gray-400 leading-relaxed">
              Toda atividade realizada na conta será considerada de responsabilidade do usuário e/ou da empresa vinculada.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-4">5. Responsabilidades do Usuário</h2>
            <p className="text-gray-400 leading-relaxed mb-4">
              O usuário declara estar ciente de que é exclusivamente responsável por:
            </p>
            <ul className="list-disc list-inside text-gray-400 space-y-2 ml-4 mb-4">
              <li>Todas as informações, dados e documentos inseridos na plataforma</li>
              <li>A veracidade, integridade e legalidade dos dados fornecidos</li>
              <li>As decisões tomadas com base nas informações registradas</li>
              <li>O cumprimento de políticas internas, normas corporativas e legislações aplicáveis</li>
            </ul>
            <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4 flex items-start gap-3">
              <AlertTriangle className="h-5 w-5 text-red-400 mt-0.5 flex-shrink-0" />
              <p className="text-red-300 text-sm">
                É expressamente proibido: utilizar a plataforma para fins ilícitos, fraudulentos ou não autorizados;
                inserir informações falsas ou enganosas; tentar acessar áreas restritas sem permissão; comprometer
                a segurança, estabilidade ou funcionamento do sistema.
              </p>
            </div>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-4">6. Limitação de Responsabilidade</h2>
            <p className="text-gray-400 leading-relaxed mb-4">
              Na máxima extensão permitida pela legislação aplicável, o FluxoPay não se responsabiliza por:
            </p>
            <ul className="list-disc list-inside text-gray-400 space-y-2 ml-4 mb-4">
              <li>Erros, inconsistências ou omissões nas informações inseridas pelos usuários</li>
              <li>Decisões financeiras, operacionais ou estratégicas tomadas com base na plataforma</li>
              <li>Prejuízos decorrentes de uso indevido ou acesso não autorizado</li>
              <li>Falhas decorrentes de credenciais comprometidas</li>
              <li>Indisponibilidade temporária do sistema</li>
              <li>Falhas provenientes de terceiros, integrações externas ou infraestrutura fora de seu controle</li>
            </ul>
            <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-4 flex items-start gap-3">
              <AlertTriangle className="h-5 w-5 text-amber-400 mt-0.5 flex-shrink-0" />
              <p className="text-amber-300 text-sm">
                A utilização da plataforma é realizada por conta e risco do usuário e da empresa contratante.
              </p>
            </div>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-4">7. Disponibilidade do Sistema</h2>
            <p className="text-gray-400 leading-relaxed mb-4">
              O FluxoPay poderá, a qualquer momento, realizar manutenções programadas ou emergenciais,
              implementar atualizações, melhorias ou correções, e suspender temporariamente o acesso por
              motivos técnicos ou de segurança.
            </p>
            <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-4 flex items-start gap-3">
              <AlertTriangle className="h-5 w-5 text-amber-400 mt-0.5 flex-shrink-0" />
              <p className="text-amber-300 text-sm">
                Não há garantia de disponibilidade contínua, ininterrupta ou livre de erros.
              </p>
            </div>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-4">8. Segurança da Informação</h2>
            <p className="text-gray-400 leading-relaxed mb-4">
              O FluxoPay adota medidas técnicas e organizacionais compatíveis com boas práticas de mercado
              para proteção dos dados. Entretanto, o usuário reconhece que:
            </p>
            <ul className="list-disc list-inside text-gray-400 space-y-2 ml-4">
              <li>Nenhum sistema é totalmente imune a falhas ou ataques</li>
              <li>É sua responsabilidade adotar boas práticas de segurança</li>
              <li>O uso inadequado das credenciais pode comprometer a segurança das informações</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-4">9. Suspensão e Encerramento</h2>
            <p className="text-gray-400 leading-relaxed mb-4">
              O FluxoPay poderá, a seu exclusivo critério, suspender, restringir ou encerrar o acesso do
              usuário, a qualquer momento e sem aviso prévio, em caso de:
            </p>
            <ul className="list-disc list-inside text-gray-400 space-y-2 ml-4">
              <li>Violação destes Termos de Uso</li>
              <li>Uso indevido da plataforma</li>
              <li>Suspeita de fraude ou atividade irregular</li>
              <li>Risco à segurança do sistema ou de outros usuários</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-4">10. Alterações dos Termos</h2>
            <p className="text-gray-400 leading-relaxed">
              O FluxoPay poderá alterar estes Termos de Uso a qualquer momento. Em caso de atualização,
              a nova versão será disponibilizada na plataforma e poderá ser exigido novo aceite do usuário.
              A continuidade do uso poderá ser condicionada à aceitação dos novos termos.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-4">11. Proteção de Dados</h2>
            <p className="text-gray-400 leading-relaxed">
              O tratamento de dados pessoais será realizado em conformidade com a legislação aplicável,
              especialmente a Lei Geral de Proteção de Dados (LGPD - Lei nº 13.709/2018), conforme descrito
              na Política de Privacidade do FluxoPay.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-4">12. Foro e Legislação Aplicável</h2>
            <p className="text-gray-400 leading-relaxed">
              Estes Termos serão regidos pelas leis da República Federativa do Brasil. Fica eleito o foro
              da comarca de Osasco/SP, com renúncia a qualquer outro, por mais privilegiado que seja, para
              dirimir quaisquer controvérsias oriundas destes Termos.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-4">13. Contato</h2>
            <p className="text-gray-400 leading-relaxed mb-4">
              Para dúvidas ou esclarecimentos sobre estes Termos de Uso:
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <a
                href="mailto:simpleqia.oficial@gmail.com"
                className="flex items-center gap-2 text-primary hover:underline"
              >
                <Mail className="h-4 w-4" />
                simpleqia.oficial@gmail.com
              </a>
              <a
                href="https://wa.me/5511914860806"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 text-primary hover:underline"
              >
                <Phone className="h-4 w-4" />
                (11) 91486-0806
              </a>
            </div>
          </section>

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
