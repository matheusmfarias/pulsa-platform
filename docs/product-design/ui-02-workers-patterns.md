# UI-02 — Workers como referência operacional

Este registro documenta decisões observadas e validadas no módulo Workers. Ele
orienta fases futuras, mas não autoriza replicação automática em outros módulos.

## List View

- Ordem estrutural: contexto e ação principal, controles de refino, quantidade
  de resultados, conteúdo tabular e estados.
- A contagem deve ficar próxima da tabela e informar quando há filtros aplicados.
- A identificação humana é o primeiro conteúdo da linha; identificadores
  técnicos aparecem somente quando forem necessários ao fluxo.

## Filter Bar

- Busca e status permanecem em uma única superfície compacta.
- Filtros ativos são descritos em texto e sempre possuem ação explícita para
  limpeza.
- O estado sem resultados diferencia ausência de cadastro de ausência de
  correspondências.
- Novos filtros só devem ser adicionados com fonte de dados confiável e ganho
  operacional demonstrável.

## Table

- A tabela usa cabeçalho discreto, linhas de densidade confortável, divisores,
  hover e foco na linha.
- O container tabular é uma região nomeada e focável para navegação por teclado.
- No mobile, a tabela não vira coleção de cards: dados secundários são agrupados
  na célula de identificação, preservando nome, CPF, contato, alocação, status e
  ação sem overflow.
- Em telas amplas, os mesmos dados voltam a colunas próprias.

## Empty, loading e error

- Ausência de cadastro pode oferecer o CTA principal quando o RBAC permitir.
- Ausência por filtro orienta ajuste ou limpeza dos filtros.
- Loading replica a geometria da página para reduzir mudança brusca de layout.
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

- Campos são agrupados semanticamente em Identificação e Contato e vínculo.
- A ação primária fica no final; Cancelar é secundária e retorna ao contexto
  adequado de criação ou edição.
- Required, optional, ajuda e erros continuam governados pelos primitives da
  Foundation V1.
