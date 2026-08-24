import { Shield, Calendar, Mail, Info, CheckCircle } from "lucide-react"
import { LegalPageShell } from "@/components/legal-page-shell"

export default function PrivacidadePage() {
  return (
    <LegalPageShell
      icon={Shield}
      activeHref="/privacidade"
      title="Política de Privacidade"
      subtitle="FluxoPay - LGPD (Lei nº 13.709/2018)"
      meta={
        <>
          <Calendar className="h-3.5 w-3.5" />
          <span>Vigência: 02/04/2026 | Versão 2.1 | CNPJ 26.344.386/0001-42</span>
        </>
      }
    >
      <div className="bg-card border border-border rounded-lg p-6 space-y-8">
        <section>
          <h2 className="text-base font-semibold text-foreground mb-3">1. Controlador e Encarregado (DPO)</h2>
          <p className="text-text-secondary text-sm leading-relaxed mb-3">
            <strong className="text-foreground">Controlador dos Dados:</strong> FELIPE NOGUEIRA SILVA SERVIÇOS
            COMÉRCIO E LOCAÇÃO, CNPJ 26.344.386/0001-42, nome fantasia KAFERRI TEC SERVIÇOS, com sede em Osasco/SP,
            responsável pelas decisões relativas ao tratamento de dados pessoais no FluxoPay.
          </p>
          <p className="text-text-secondary text-sm leading-relaxed mb-3">
            <strong className="text-foreground">Encarregado de Dados (DPO):</strong> simpleqia.oficial@gmail.com. O
            DPO é o canal oficial para exercício de direitos dos titulares, dúvidas sobre o tratamento de dados e
            comunicação com a ANPD.
          </p>
          <div className="bg-accent border border-primary/20 rounded-control p-4 flex items-start gap-3">
            <Info className="h-4 w-4 text-primary mt-0.5 shrink-0" />
            <p className="text-primary text-sm">
              Para dados de prestadores inseridos pelas Empresas Clientes, a Empresa Cliente atua como Controladora e
              o FluxoPay atua como Operadora, conforme Art. 37 da LGPD.
            </p>
          </div>
        </section>

        <section>
          <h2 className="text-base font-semibold text-foreground mb-3">2. Dados Coletados e Finalidades</h2>

          <h3 className="text-sm font-medium text-foreground mb-2">
            2.1 Dados de Usuários (colaboradores das Empresas Clientes)
          </h3>
          <ul className="list-disc list-inside text-text-secondary text-sm space-y-1 ml-1 mb-4">
            <li>
              <strong className="text-foreground">Identificação:</strong> nome completo, e-mail corporativo, cargo
            </li>
            <li>
              <strong className="text-foreground">Autenticação:</strong> hash de senha (nunca a senha em texto
              claro), tokens de sessão
            </li>
            <li>
              <strong className="text-foreground">Rastreabilidade:</strong> IP de acesso, dispositivo, navegador,
              data/hora de login e ações
            </li>
          </ul>

          <h3 className="text-sm font-medium text-foreground mb-2">2.2 Dados de Prestadores de Serviço</h3>
          <ul className="list-disc list-inside text-text-secondary text-sm space-y-1 ml-1 mb-4">
            <li>Dados cadastrais: nome/razão social, CPF/CNPJ, endereço, contatos</li>
            <li>Documentação de habilitação e qualificação técnica</li>
            <li>Dados bancários para fins de pagamento (agência, conta, banco)</li>
            <li>Histórico de contratos, pagamentos e status de validação</li>
          </ul>

          <div className="bg-success-subtle border border-success/20 rounded-control p-4 flex items-start gap-3">
            <CheckCircle className="h-4 w-4 text-success mt-0.5 shrink-0" />
            <p className="text-success text-sm">
              Não coletamos dados sensíveis (saúde, biometria, etnia, orientação sexual) e não permitimos o cadastro
              de dados de menores de 18 anos através do FluxoPay.
            </p>
          </div>
        </section>

        <section>
          <h2 className="text-base font-semibold text-foreground mb-3">3. Base Legal do Tratamento</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border-strong">
                  <th className="text-left py-2.5 px-3 text-foreground font-medium">Base Legal</th>
                  <th className="text-left py-2.5 px-3 text-foreground font-medium">Artigo LGPD</th>
                  <th className="text-left py-2.5 px-3 text-foreground font-medium">Aplicação</th>
                </tr>
              </thead>
              <tbody className="text-text-secondary">
                <tr className="border-b border-border">
                  <td className="py-2.5 px-3">Execução contratual</td>
                  <td className="py-2.5 px-3">Art. 7, V</td>
                  <td className="py-2.5 px-3">Autenticação, acesso, gestão de prestadores</td>
                </tr>
                <tr className="border-b border-border">
                  <td className="py-2.5 px-3">Legítimo interesse</td>
                  <td className="py-2.5 px-3">Art. 7, IX</td>
                  <td className="py-2.5 px-3">Auditoria, segurança, prevenção a fraudes</td>
                </tr>
                <tr className="border-b border-border">
                  <td className="py-2.5 px-3">Obrigação legal</td>
                  <td className="py-2.5 px-3">Art. 7, II</td>
                  <td className="py-2.5 px-3">Retenção fiscal e trabalhista</td>
                </tr>
                <tr>
                  <td className="py-2.5 px-3">Consentimento</td>
                  <td className="py-2.5 px-3">Art. 7, I</td>
                  <td className="py-2.5 px-3">Funcionalidades opcionais - revogável a qualquer tempo</td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>

        <section>
          <h2 className="text-base font-semibold text-foreground mb-3">4. Compartilhamento de Dados</h2>
          <p className="text-text-secondary text-sm leading-relaxed mb-3">
            Os dados são compartilhados apenas nas seguintes hipóteses, todas com salvaguardas contratuais:
          </p>
          <ul className="list-disc list-inside text-text-secondary text-sm space-y-1.5 ml-1 mb-4">
            <li>Provedores de infraestrutura de hospedagem, sob cláusulas de confidencialidade</li>
            <li>Empresa Cliente - acesso exclusivo aos seus próprios dados</li>
            <li>Autoridades competentes quando exigido por lei ou ordem judicial</li>
          </ul>
          <div className="bg-danger-subtle border border-danger/20 rounded-control p-4">
            <p className="text-danger text-sm">
              <strong>Proibido:</strong> O FluxoPay jamais vende, cede ou comercializa dados pessoais para terceiros
              para fins de marketing, publicidade ou qualquer finalidade alheia ao serviço contratado.
            </p>
          </div>
        </section>

        <section>
          <h2 className="text-base font-semibold text-foreground mb-3">5. Transferência Internacional de Dados</h2>
          <p className="text-text-secondary text-sm leading-relaxed">
            Caso dados sejam processados em infraestrutura localizada fora do Brasil, o FluxoPay garante que tais
            transferências ocorrem apenas para países com grau de proteção adequado reconhecido pela ANPD ou mediante
            cláusulas contratuais padrão, conforme Arts. 33 e seguintes da LGPD.
          </p>
        </section>

        <section>
          <h2 className="text-base font-semibold text-foreground mb-3">6. Retenção e Eliminação de Dados</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border-strong">
                  <th className="text-left py-2.5 px-3 text-foreground font-medium">Tipo de Dado</th>
                  <th className="text-left py-2.5 px-3 text-foreground font-medium">Prazo de Retenção</th>
                </tr>
              </thead>
              <tbody className="text-text-secondary">
                <tr className="border-b border-border">
                  <td className="py-2.5 px-3">Logs de acesso e auditoria</td>
                  <td className="py-2.5 px-3">2 anos após último acesso</td>
                </tr>
                <tr className="border-b border-border">
                  <td className="py-2.5 px-3">Dados de prestadores e pagamentos</td>
                  <td className="py-2.5 px-3">5 anos (obrigação fiscal)</td>
                </tr>
                <tr className="border-b border-border">
                  <td className="py-2.5 px-3">Dados de auditoria de fluxos</td>
                  <td className="py-2.5 px-3">5 anos (comprovação e disputas)</td>
                </tr>
                <tr>
                  <td className="py-2.5 px-3">Dados de usuários desativados</td>
                  <td className="py-2.5 px-3">90 dias, salvo retenção legal</td>
                </tr>
              </tbody>
            </table>
          </div>
          <p className="text-text-tertiary text-xs mt-3">
            Após os prazos, eliminação segura padrão NIST 800-88 ou anonimização irreversível.
          </p>
        </section>

        <section>
          <h2 className="text-base font-semibold text-foreground mb-3">7. Medidas de Segurança</h2>
          <ul className="list-disc list-inside text-text-secondary text-sm space-y-1.5 ml-1">
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
          <h2 className="text-base font-semibold text-foreground mb-3">8. Direitos do Titular</h2>
          <p className="text-text-secondary text-sm leading-relaxed mb-3">
            Conforme Art. 18 da LGPD, os titulares têm direito a:
          </p>
          <ul className="list-disc list-inside text-text-secondary text-sm space-y-1.5 ml-1 mb-4">
            <li>
              <strong className="text-foreground">Confirmação e Acesso</strong> - confirmar existência e obter cópia
              dos dados
            </li>
            <li>
              <strong className="text-foreground">Correção</strong> - atualizar dados incompletos, inexatos ou
              desatualizados
            </li>
            <li>
              <strong className="text-foreground">Anonimização, Bloqueio ou Eliminação</strong> - de dados
              desnecessários ou em desconformidade
            </li>
            <li>
              <strong className="text-foreground">Portabilidade</strong> - receber dados em formato estruturado e
              interoperável
            </li>
            <li>
              <strong className="text-foreground">Eliminação</strong> - de dados tratados com base em consentimento
            </li>
            <li>
              <strong className="text-foreground">Oposição</strong> - ao tratamento baseado em legítimo interesse
            </li>
            <li>
              <strong className="text-foreground">Revisão de decisões automatizadas</strong> - solicitar revisão de
              decisões por algoritmos
            </li>
            <li>
              <strong className="text-foreground">Revogação do consentimento</strong> - a qualquer tempo, sem
              prejuízo do tratamento anterior
            </li>
          </ul>
          <p className="text-text-secondary text-sm leading-relaxed">
            Para exercer qualquer direito, envie solicitação para simpleqia.oficial@gmail.com com nome completo,
            e-mail cadastrado e descrição do pedido. Prazo de resposta: 15 dias úteis.
          </p>
        </section>

        <section>
          <h2 className="text-base font-semibold text-foreground mb-3">9. Cookies e Tecnologias Similares</h2>
          <p className="text-text-secondary text-sm leading-relaxed mb-3">
            O FluxoPay utiliza exclusivamente cookies estritamente necessários para:
          </p>
          <ul className="list-disc list-inside text-text-secondary text-sm space-y-1.5 ml-1 mb-4">
            <li>Manutenção da sessão autenticada do usuário</li>
            <li>Segurança (tokens CSRF e proteção contra ataques de sessão)</li>
            <li>Preferências básicas de interface (idioma, tema)</li>
          </ul>
          <div className="bg-success-subtle border border-success/20 rounded-control p-4 flex items-start gap-3">
            <CheckCircle className="h-4 w-4 text-success mt-0.5 shrink-0" />
            <p className="text-success text-sm">
              Não utilizamos cookies de rastreamento, analytics comportamental ou publicidade. Todos os cookies de
              sessão são eliminados ao logout ou ao fechar o navegador.
            </p>
          </div>
        </section>

        <section>
          <h2 className="text-base font-semibold text-foreground mb-3">10. Incidentes de Segurança</h2>
          <p className="text-text-secondary text-sm leading-relaxed mb-3">
            Em caso de incidente que possa afetar dados pessoais, o FluxoPay:
          </p>
          <ul className="list-disc list-inside text-text-secondary text-sm space-y-1.5 ml-1 mb-4">
            <li>Notificará a Empresa Cliente no prazo máximo de 72 horas após ciência do evento</li>
            <li>Comunicará a ANPD nos termos do Art. 48 da LGPD, quando aplicável</li>
            <li>Adotará medidas imediatas de contenção, remediação e prevenção de recorrência</li>
            <li>Fornecerá relatório de incidente com causa, dados afetados e medidas adotadas</li>
          </ul>
          <p className="text-text-secondary text-sm leading-relaxed">
            Para reportar incidentes: simpleqia.oficial@gmail.com
          </p>
        </section>

        <section>
          <h2 className="text-base font-semibold text-foreground mb-3">11. Atualizações desta Política</h2>
          <p className="text-text-secondary text-sm leading-relaxed mb-4">
            Esta Política entra em vigor em 02/04/2026 e pode ser atualizada periodicamente. Alterações relevantes
            serão comunicadas por e-mail com antecedência mínima de 15 dias. A versão vigente estará sempre
            disponível na tela de login do FluxoPay.
          </p>
          <div className="flex flex-col sm:flex-row gap-4">
            <a href="mailto:simpleqia.oficial@gmail.com" className="flex items-center gap-2 text-primary hover:underline text-sm">
              <Mail className="h-4 w-4" />
              simpleqia.oficial@gmail.com
            </a>
          </div>
        </section>
      </div>
    </LegalPageShell>
  )
}
