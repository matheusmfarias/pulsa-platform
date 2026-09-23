# UI-02 — Workers como referência operacional

Este registro documenta decisões observadas e validadas no módulo Workers. Ele
orienta fases futuras, mas não autoriza replicação automática em outros módulos.

Status: Golden

Golden screen: `/app/workers`

Estados futuros possíveis: Draft → Golden → Adopted.

`/app/workers` é a golden screen inicial do Core List Pattern. Enquanto o
pattern estiver em Draft, essa tela será o laboratório para validar sua
composição visual, responsividade e maturidade antes da adoção por outras
listagens.

## List View

- Ordem estrutural: contexto e ação principal, controles de refino, quantidade
  de resultados, conteúdo tabular e estados.
- A contagem deve ficar próxima da tabela e informar quando há filtros aplicados.
- A identificação humana é o primeiro conteúdo da linha; identificadores
  técnicos aparecem somente quando forem necessários ao fluxo.

## Filter Bar

- Busca e status permanecem em uma única superfície compacta.
- A busca continua sendo o controle prioritário.
- Busca aplica automaticamente após um debounce curto e status aplica no
  momento da seleção; a listagem não possui etapa ou botão de aplicação.
- A URL permanece como fonte de verdade dos filtros e é atualizada pelo App
  Router sem scroll ou reload perceptível da página inteira.
- Filtros aplicados devem permanecer visualmente claros; preferir chips
  discretos e individualmente removíveis para filtros ativos.
- Deve existir uma forma clara de limpar filtros.
- O estado sem resultados diferencia ausência de cadastro de ausência de
  correspondências.
- Não adicionar filtros sem suporte real de dados e backend.

## Table

- A tabela usa cabeçalho discreto, linhas de densidade confortável, divisores,
  hover e foco na linha.
- O container tabular é uma região nomeada e focável para navegação por teclado.
- A identificação humana continua sendo prioritária.
- Preservar contexto é prioridade na escolha da estratégia responsiva.
- O agrupamento de dados secundários na célula principal continua válido em
  telas estreitas.
- Overflow horizontal é aceitável quando preservar colunas melhora a comparação
  entre registros.
- Quando pertinente, ScrollShadow deve indicar o overflow horizontal real.
- Ainda não há uma única estratégia responsiva definitiva. A golden screen
  `/app/workers` será usada para validar a solução final.

## Empty, loading e error

- Ausência de cadastro pode oferecer o CTA principal quando o RBAC permitir.
- Ausência por filtro orienta ajuste ou limpeza dos filtros.
- Loading replica a geometria da página para reduzir mudança brusca de layout.
- Mudanças de filtro mantêm cabeçalho e toolbar estáveis; o estado pending e o
  loading ficam restritos à região de resultados.
- Erros usam FeedbackMessage, linguagem operacional e ação de nova tentativa.

## Row actions

- O nome continua sendo link para o detalhe.
- Uma única ação de linha, com alvo de 40 px e nome acessível, torna a navegação
  localizável sem competir visualmente com o conteúdo.

## Detail View

- O detalhe é uma superfície contínua organizada por seções e divisores, sem um
  card para cada agrupamento.
- Worker, alocação atual, histórico de alocações e mudanças de situação possuem
  responsabilidades textualmente explícitas.
- Relações com unidade, operação, cliente, posto e alocação são apresentadas
  como links humanos.
- Cargo e posto não repetem o mesmo rótulo: o cargo é informação e o posto é
  acessado como relação concreta.

## Form

- Formulários de página agrupam Identificação e Contato e vínculo; no drawer
  de criação, Identificação, Contato e Vínculo permanecem seções distintas.
- A ação primária fica no final; Cancelar é secundária e retorna ao contexto
  adequado de criação ou edição.
- Required, optional, ajuda e erros continuam governados pelos primitives da
  Foundation V1.

## Criação contextual

- A criação curta acontece em drawer sobre o workspace, não em uma página
  visualmente independente.
- `/app/workers/new` representa a listagem de colaboradores com o drawer de
  criação aberto; filtros relevantes permanecem expressos na URL.
- Header e footer ficam fixos, enquanto o body pode usar ScrollShadow quando
  houver overflow real.
- Em telas pequenas, o mesmo drawer ocupa praticamente toda a viewport.
- Drawers de formulário preservam o contexto visível e confirmam o descarte
  somente quando existirem alterações ainda não salvas.
- Criações concluídas usam feedback de sucesso discreto por toast, sem bloquear
  a continuidade do trabalho.
