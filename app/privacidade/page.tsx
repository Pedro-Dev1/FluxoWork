import Link from "next/link"
import { ArrowLeft, Shield, Calendar, Mail, Phone, Info, CheckCircle } from "lucide-react"

export default function PrivacidadePage() {
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
            <Link href="/termos" className="px-4 py-2 text-gray-400 hover:text-white transition-colors text-sm font-medium">Termos</Link>
            <Link href="/privacidade" className="px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium">Privacidade</Link>
          </div>
        </nav>
      </header>

      {/* Hero */}
      <div className="bg-gradient-to-b from-primary/10 to-transparent py-16 px-4">
        <div className="max-w-3xl mx-auto text-center">
          <div className="inline-flex items-center justify-center p-3 bg-primary/10 rounded-2xl mb-6">
            <Shield className="h-8 w-8 text-primary" />
          </div>
          <h1 className="text-4xl font-bold text-white mb-4">Política de Privacidade</h1>
          <p className="text-gray-300 mb-4">FluxoPay - LGPD (Lei nº 13.709/2018)</p>
          <div className="flex items-center justify-center gap-2 text-gray-400 text-sm">
            <Calendar className="h-4 w-4" />
            <span>Vigência: 02/04/2026 | Versão 2.1 | CNPJ 26.344.386/0001-42</span>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-4 pb-16">
        <div className="bg-[#111827] border border-gray-800 rounded-2xl p-8 space-y-8">

          <section>
            <h2 className="text-xl font-semibold text-white mb-4">1. Controlador e Encarregado (DPO)</h2>
            <p className="text-gray-400 leading-relaxed mb-4">
              <strong className="text-white">Controlador dos Dados:</strong> FELIPE NOGUEIRA SILVA SERVIÇOS COMÉRCIO E LOCAÇÃO,
              CNPJ 26.344.386/0001-42, nome fantasia KAFERRI TEC SERVIÇOS, com sede em Osasco/SP, responsável pelas
              decisões relativas ao tratamento de dados pessoais no FluxoPay.
            </p>
            <p className="text-gray-400 leading-relaxed mb-4">
              <strong className="text-white">Encarregado de Dados (DPO):</strong> simpleqia.oficial@gmail.com. O DPO é o canal
              oficial para exercício de direitos dos titulares, dúvidas sobre o tratamento de dados e comunicação com a ANPD.
            </p>
            <div className="bg-blue-500/10 border border-blue-500/30 rounded-xl p-4 flex items-start gap-3">
              <Info className="h-5 w-5 text-blue-400 mt-0.5 flex-shrink-0" />
              <p className="text-blue-300 text-sm">
                Para dados de prestadores inseridos pelas Empresas Clientes, a Empresa Cliente atua como Controladora
                e o FluxoPay atua como Operadora, conforme Art. 37 da LGPD.
              </p>
            </div>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-4">2. Dados Coletados e Finalidades</h2>

            <h3 className="text-lg font-medium text-white mb-3">2.1 Dados de Usuários (colaboradores das Empresas Clientes)</h3>
            <ul className="list-disc list-inside text-gray-400 space-y-1 ml-4 mb-4">
              <li><strong className="text-white">Identificação:</strong> nome completo, e-mail corporativo, cargo</li>
              <li><strong className="text-white">Autenticação:</strong> hash de senha (nunca a senha em texto claro), tokens de sessão</li>
              <li><strong className="text-white">Rastreabilidade:</strong> IP de acesso, dispositivo, navegador, data/hora de login e ações</li>
            </ul>

            <h3 className="text-lg font-medium text-white mb-3">2.2 Dados de Prestadores de Serviço</h3>
            <ul className="list-disc list-inside text-gray-400 space-y-1 ml-4 mb-4">
              <li>Dados cadastrais: nome/razão social, CPF/CNPJ, endereço, contatos</li>
              <li>Documentação de habilitação e qualificação técnica</li>
              <li>Dados bancários para fins de pagamento (agência, conta, banco)</li>
              <li>Histórico de contratos, pagamentos e status de validação</li>
            </ul>

            <div className="bg-green-500/10 border border-green-500/30 rounded-xl p-4 flex items-start gap-3">
              <CheckCircle className="h-5 w-5 text-green-400 mt-0.5 flex-shrink-0" />
              <p className="text-green-300 text-sm">
                Não coletamos dados sensíveis (saúde, biometria, etnia, orientação sexual) e não permitimos o cadastro
                de dados de menores de 18 anos através do FluxoPay.
              </p>
            </div>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-4">3. Base Legal do Tratamento</h2>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-700">
                    <th className="text-left py-3 px-4 text-white font-medium">Base Legal</th>
                    <th className="text-left py-3 px-4 text-white font-medium">Artigo LGPD</th>
                    <th className="text-left py-3 px-4 text-white font-medium">Aplicação</th>
                  </tr>
                </thead>
                <tbody className="text-gray-400">
                  <tr className="border-b border-gray-800">
                    <td className="py-3 px-4">Execução contratual</td>
                    <td className="py-3 px-4">Art. 7, V</td>
                    <td className="py-3 px-4">Autenticação, acesso, gestão de prestadores</td>
                  </tr>
                  <tr className="border-b border-gray-800">
                    <td className="py-3 px-4">Legítimo interesse</td>
                    <td className="py-3 px-4">Art. 7, IX</td>
                    <td className="py-3 px-4">Auditoria, segurança, prevenção a fraudes</td>
                  </tr>
                  <tr className="border-b border-gray-800">
                    <td className="py-3 px-4">Obrigação legal</td>
                    <td className="py-3 px-4">Art. 7, II</td>
                    <td className="py-3 px-4">Retenção fiscal e trabalhista</td>
                  </tr>
                  <tr>
                    <td className="py-3 px-4">Consentimento</td>
                    <td className="py-3 px-4">Art. 7, I</td>
                    <td className="py-3 px-4">Funcionalidades opcionais - revogável a qualquer tempo</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-4">4. Compartilhamento de Dados</h2>
            <p className="text-gray-400 leading-relaxed mb-4">
              Os dados são compartilhados apenas nas seguintes hipóteses, todas com salvaguardas contratuais:
            </p>
            <ul className="list-disc list-inside text-gray-400 space-y-2 ml-4 mb-4">
              <li>Provedores de infraestrutura de hospedagem, sob cláusulas de confidencialidade</li>
              <li>Empresa Cliente - acesso exclusivo aos seus próprios dados</li>
              <li>Autoridades competentes quando exigido por lei ou ordem judicial</li>
            </ul>
            <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4">
              <p className="text-red-300 text-sm">
                <strong>Proibido:</strong> O FluxoPay jamais vende, cede ou comercializa dados pessoais para terceiros
                para fins de marketing, publicidade ou qualquer finalidade alheia ao serviço contratado.
              </p>
            </div>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-4">5. Transferência Internacional de Dados</h2>
            <p className="text-gray-400 leading-relaxed">
              Caso dados sejam processados em infraestrutura localizada fora do Brasil, o FluxoPay garante que tais
              transferências ocorrem apenas para países com grau de proteção adequado reconhecido pela ANPD ou mediante
              cláusulas contratuais padrão, conforme Arts. 33 e seguintes da LGPD.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-4">6. Retenção e Eliminação de Dados</h2>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-700">
                    <th className="text-left py-3 px-4 text-white font-medium">Tipo de Dado</th>
                    <th className="text-left py-3 px-4 text-white font-medium">Prazo de Retenção</th>
                  </tr>
                </thead>
                <tbody className="text-gray-400">
                  <tr className="border-b border-gray-800">
                    <td className="py-3 px-4">Logs de acesso e auditoria</td>
                    <td className="py-3 px-4">2 anos após último acesso</td>
                  </tr>
                  <tr className="border-b border-gray-800">
                    <td className="py-3 px-4">Dados de prestadores e pagamentos</td>
                    <td className="py-3 px-4">5 anos (obrigação fiscal)</td>
                  </tr>
                  <tr className="border-b border-gray-800">
                    <td className="py-3 px-4">Dados de auditoria de fluxos</td>
                    <td className="py-3 px-4">5 anos (comprovação e disputas)</td>
                  </tr>
                  <tr>
                    <td className="py-3 px-4">Dados de usuários desativados</td>
                    <td className="py-3 px-4">90 dias, salvo retenção legal</td>
                  </tr>
                </tbody>
              </table>
            </div>
            <p className="text-gray-400 text-sm mt-4">
              Após os prazos, eliminação segura padrão NIST 800-88 ou anonimização irreversível.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-4">7. Medidas de Segurança</h2>
            <ul className="list-disc list-inside text-gray-400 space-y-2 ml-4">
              <li>Criptografia de dados em trânsito com TLS 1.3</li>
              <li>Criptografia de dados em repouso (AES-256)</li>
              <li>Hash de senhas com bcrypt, fator de custo &gt;= 12</li>
              <li>Controle de acesso baseado em perfis (RBAC) com princípio do menor privilégio</li>
              <li>Logs de auditoria imutáveis com rastreabilidade completa</li>
              <li>Autenticação multifator (MFA) obrigatória para administradores</li>
              <li>Monitoramento contínuo de anomalias e alertas automáticos</li>
              <li>Backups criptografados com retenção mínima de 30 dias</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-4">8. Direitos do Titular</h2>
            <p className="text-gray-400 leading-relaxed mb-4">
              Conforme Art. 18 da LGPD, os titulares têm direito a:
            </p>
            <ul className="list-disc list-inside text-gray-400 space-y-2 ml-4 mb-4">
              <li><strong className="text-white">Confirmação e Acesso</strong> - confirmar existência e obter cópia dos dados</li>
              <li><strong className="text-white">Correção</strong> - atualizar dados incompletos, inexatos ou desatualizados</li>
              <li><strong className="text-white">Anonimização, Bloqueio ou Eliminação</strong> - de dados desnecessários ou em desconformidade</li>
              <li><strong className="text-white">Portabilidade</strong> - receber dados em formato estruturado e interoperável</li>
              <li><strong className="text-white">Eliminação</strong> - de dados tratados com base em consentimento</li>
              <li><strong className="text-white">Oposição</strong> - ao tratamento baseado em legítimo interesse</li>
              <li><strong className="text-white">Revisão de decisões automatizadas</strong> - solicitar revisão de decisões por algoritmos</li>
              <li><strong className="text-white">Revogação do consentimento</strong> - a qualquer tempo, sem prejuízo do tratamento anterior</li>
            </ul>
            <p className="text-gray-400 leading-relaxed">
              Para exercer qualquer direito, envie solicitação para simpleqia.oficial@gmail.com com nome completo,
              e-mail cadastrado e descrição do pedido. Prazo de resposta: 15 dias úteis.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-4">9. Cookies e Tecnologias Similares</h2>
            <p className="text-gray-400 leading-relaxed mb-4">
              O FluxoPay utiliza exclusivamente cookies estritamente necessários para:
            </p>
            <ul className="list-disc list-inside text-gray-400 space-y-2 ml-4 mb-4">
              <li>Manutenção da sessão autenticada do usuário</li>
              <li>Segurança (tokens CSRF e proteção contra ataques de sessão)</li>
              <li>Preferências básicas de interface (idioma, tema)</li>
            </ul>
            <div className="bg-green-500/10 border border-green-500/30 rounded-xl p-4 flex items-start gap-3">
              <CheckCircle className="h-5 w-5 text-green-400 mt-0.5 flex-shrink-0" />
              <p className="text-green-300 text-sm">
                Não utilizamos cookies de rastreamento, analytics comportamental ou publicidade. Todos os cookies
                de sessão são eliminados ao logout ou ao fechar o navegador.
              </p>
            </div>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-4">10. Incidentes de Segurança</h2>
            <p className="text-gray-400 leading-relaxed mb-4">
              Em caso de incidente que possa afetar dados pessoais, o FluxoPay:
            </p>
            <ul className="list-disc list-inside text-gray-400 space-y-2 ml-4 mb-4">
              <li>Notificará a Empresa Cliente no prazo máximo de 72 horas após ciência do evento</li>
              <li>Comunicará a ANPD nos termos do Art. 48 da LGPD, quando aplicável</li>
              <li>Adotará medidas imediatas de contenção, remediação e prevenção de recorrência</li>
              <li>Fornecerá relatório de incidente com causa, dados afetados e medidas adotadas</li>
            </ul>
            <p className="text-gray-400 leading-relaxed">
              Para reportar incidentes: simpleqia.oficial@gmail.com ou (11) 91486-0806
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-4">11. Atualizações desta Política</h2>
            <p className="text-gray-400 leading-relaxed mb-4">
              Esta Política entra em vigor em 02/04/2026 e pode ser atualizada periodicamente. Alterações relevantes
              serão comunicadas por e-mail com antecedência mínima de 15 dias. A versão vigente estará sempre disponível
              na tela de login do FluxoPay.
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
