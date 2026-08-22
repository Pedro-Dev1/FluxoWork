# Padrão de acabamento

## Números
- Algarismos tabulares em toda coluna monetária. Casas decimais alinhadas.
- Alinhamento à direita para valor, à esquerda para texto, sempre.
- Uma convenção única para negativo em todo o sistema — escolha e não misture.
- Precisão total em tabela e detalhe. Abreviação (1,2 mi) só em eixo de gráfico.
- Todo número exibido carrega comparação: período anterior, meta ou média. Um
  número sozinho não é informação.

## Hierarquia
- Uma métrica primária por tela, visivelmente maior que o resto. Se tudo tem o
  mesmo peso, o layout não decidiu nada.
- Hierarquia por tamanho, peso e espaçamento antes de por cor.
- Cor comunica estado. Nunca decora. Chrome da interface em neutro.

## Espaçamento
- Escala fixa de 4pt. Nenhum valor arbitrário no meio.
- Densidade de ferramenta de trabalho: a lista principal mostra muitas linhas
  sem rolagem.
- Agrupamento por proximidade e por régua fina, não por card dentro de card.

## Superfícies
- Traço fino para separar. Sombra só em coisa que realmente flutua sobre o
  conteúdo — modal, dropdown, popover.
- Raio pequeno e consistente. Um valor para controles, outro para superfícies.

## Gráficos
- Nada de estilo padrão da biblioteca. Todo gráfico é configurado.
- Um tom de destaque e neutros. Paleta múltipla só quando as séries são
  categorias reais e comparáveis.
- Rótulo direto na série em vez de legenda lateral, quando couber.
- Grade horizontal fina, sem grade vertical. Eixo sem borda.
- Tooltip mostra valor exato formatado e a comparação.

## Estados
Toda tela que busca dado tem os quatro desenhados:
- Carregando: esqueleto com a forma do conteúdo final, não spinner.
- Vazio: diz o que fazer, com a ação à mão.
- Erro: diz o que houve e como resolver. Não pede desculpa, não é vago.
- Denso: testado com nome longo, valor de sete dígitos e lista de 500 linhas.

## Movimento
- Só onde algo mudou de estado. Transição de 120–200ms.
- Nada de entrada animada em conteúdo estático.
- prefers-reduced-motion respeitado.

## Texto
- Rótulo nomeia o que a pessoa reconhece, não o que o banco de dados chama.
- Botão diz o que acontece: "Aprovar pagamento", não "Confirmar".
- A ação mantém o mesmo nome do botão ao aviso de sucesso.
- Frase em caixa normal. Sem exclamação, sem emoji, sem texto de vendedor.
- Todo texto em português correto, com acentuação — nunca "Aprovacoes",
  "Gestao", "Visao geral". Isso já está inconsistente hoje entre telas.
