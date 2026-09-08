# UI-06 — Application UX Foundation

Status: foundation de UI/UX da aplicação autenticada.

## Objetivo

Consolidar padrões compartilhados antes da expansão de Scheduling e dos
próximos módulos operacionais, reduzindo divergências visuais sem transformar
componentes de domínio em abstrações genéricas.

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