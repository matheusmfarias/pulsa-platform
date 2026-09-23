# UI-06 — Application UX Foundation

Status: foundation de UI/UX da aplicação autenticada.

## Objetivo

Consolidar padrões compartilhados antes da expansão de Scheduling e dos
próximos módulos operacionais, reduzindo divergências visuais sem transformar
componentes de domínio em abstrações genéricas.

## Linguagem visual do Pulsa Core

Pulsa Core é um workspace operacional enterprise, desktop-first e responsivo.
Sua linguagem visual deve ser clean, calma, precisa e information-first, com
densidade média e hierarquia suficiente para leitura, comparação e ação.

- Inter é a tipografia da aplicação e Lucide é a biblioteca de ícones.
- Os tokens semânticos Pulsa existentes são a autoridade visual.
- O canvas é neutro e off-white, com surfaces claras e bem delimitadas.
- Preferir borders antes de shadows. Shadows são reservadas para situações em
  que a elevação comunica uma relação espacial ou estado de interação.
- Cores da marca funcionam como acento, não como decoração dominante.
- Controles usam radius de aproximadamente 8 px; surfaces, aproximadamente
  12 px; dialogs e drawers, aproximadamente 16 px.
- Cada contexto deve possuir uma ação primária clara, sem competir com ações
  secundárias.
- Status nunca depende somente de cor: deve possuir também rótulo textual,
  ícone ou outra indicação perceptível.
- Responsividade deve recompor a interface conforme o espaço disponível, não
  apenas encolher a composição desktop.

Evitar:

- generic AI dashboard aesthetics;
- excesso de cards;
- gradientes decorativos;
- sombras pesadas;
- uso excessivo de cores;
- pills sem significado semântico.

## ScrollShadow

ScrollShadow é uma primitive aprovada para indicar conteúdo adicional em
regiões delimitadas cujo overflow não seja óbvio, como tabelas, sidebar,
tabs/filter strips e bodies de dialogs ou drawers.

Deve responder ao overflow real da região e não ser usado no scroll normal da
página.

## HeroUI

HeroUI é uma biblioteca aprovada de implementation primitives, não o design
system do Pulsa.

- Pulsa Design System e seus tokens continuam sendo a autoridade.
- Primitives de HeroUI devem se adaptar à linguagem visual Pulsa.
- Toda primitive adotada deve ser encapsulada em `src/components/ui`.
- Feature modules e route pages não devem importar HeroUI diretamente.
- Priorizar HeroUI quando houver ganho real de acessibilidade ou comportamento.
- Não substituir componentes Pulsa existentes sem benefício concreto.
- Não realizar migração massiva para HeroUI.

## Listagens

Listagens devem seguir a estrutura:

1. PageHeader
2. filtros
3. resumo de resultados
4. conteúdo principal
5. empty/error states

A foundation fornece estrutura visual compartilhada, mas filtros e tabelas
continuam pertencendo aos seus respectivos módulos.

Não criar uma tabela genérica capaz de representar qualquer domínio.

## Detalhes

Páginas de detalhe usam DetailSection e DetailItem compartilhados.

A superfície de detalhe permanece contínua, dividida semanticamente por
seções, evitando um card independente para cada agrupamento de dados.

## Visão geral

A Visão geral prioriza exceções e pendências antes de indicadores de volume.

A ordem conceitual é:

Requer atenção
→ Acessos às rotinas do dia
→ Indicadores operacionais
→ Resumo das operações

Indicadores derivados devem explicar exatamente o dado que representam.
Alocações sobre efetivo base não devem ser apresentadas como cobertura de
Scheduling.

## Contexto global

O contexto operacional global responde:

"Em qual recorte organizacional estou trabalhando?"

Ele pode representar todos os clientes, um cliente ou, futuramente, um
contrato quando houver necessidade operacional validada.

O contexto global não deve crescer automaticamente até Operação, Unidade,
Posto ou Colaborador.

## Contexto da tarefa

Telas operacionais especializadas podem possuir contexto próprio.

Scheduling, por exemplo, poderá trabalhar com:

Operação
→ Unidade
→ Período

Esse contexto pertence à tarefa de planejamento e não ao seletor global da
aplicação.

## Scheduling

Scheduling deve reutilizar PageShell, PageHeader, feedback, badges e demais
primitives da foundation, mas pode possuir componentes específicos para sua
grade semanal, navegação temporal, conflitos e publicação.

Não transformar Scheduling em uma tabela ou calendário genérico.
