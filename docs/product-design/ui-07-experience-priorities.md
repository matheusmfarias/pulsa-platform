# UI-07 — Experiência orientada ao trabalho

Status: quatro rodadas implementadas; observação com usuários ainda pendente.

## Problema observado

O Core oferece muitos módulos, mas a entrada principal priorizava indicadores e
cadastros. Para quem precisa resolver o dia, localizar presença, ausência ou
escala exigia conhecer previamente a estrutura do sistema. No Worker, a tela
inicial podia destacar uma jornada substituída e deixar invisível outra jornada
válida no mesmo dia. Os cartões de jornada repetiam informações com pouca
distinção entre estado, horário e ação.

## Critérios de experiência

- O usuário encontra a próxima tarefa a partir da primeira tela.
- Estado, consequência e ação aparecem juntos; cor nunca é o único sinal.
- Conteúdo importante vem antes de indicadores e cadastro de referência.
- Em telas estreitas, horários e ações continuam legíveis e alcançáveis.
- Os padrões do `ui-06-application-foundation.md` e os tokens Pulsa governam o
  Core. O Worker usa a mesma linguagem sem perder sua prioridade mobile.
- O trabalho visual não altera regras de escala, ausência, cobertura ou presença.

## Primeira rodada

### Pulsa Core

- A Visão geral mantém pendências no topo e passa a oferecer quatro entradas
  diretas: presença, ausências, escalas e colaboradores.
- A navegação coloca a rotina operacional antes de clientes e contratos.
- Links explicam o propósito da tela com verbos de ação, preservando os nomes
  oficiais dos módulos.

### Pulsa Worker

- A tela Hoje exibe uma segunda jornada do mesmo dia quando o modelo retorna
  uma jornada atual e outra jornada do dia. O estado da segunda jornada fica
  visível sem abrir o detalhe.
- Cartões da escala ganharam hierarquia mais clara entre data, horário,
  unidade, estado, orientação e detalhes. O detalhe usa o mesmo indicador de
  estado e apresenta suas informações em uma seção identificada.
- A experiência mantém alvos de toque e rótulos de estado acessíveis.

## Próximas validações com usuários

1. **Diretor de operações:** encontrar uma ausência sem cobertura, decidir quem
   deve agir e localizar a presença esperada. Observar caminho, tempo e pontos
   de dúvida sem explicar o menu antes.
2. **Diretora de RH:** encontrar um colaborador, compreender a situação do
   vínculo e identificar onde consultar alocação e histórico.
3. **Colaborador:** abrir Hoje, dizer se precisa comparecer e identificar a
   próxima jornada. Confirmar que o texto de jornada substituída não sugere
   registrar presença.

Registrar, para cada tarefa, se foi concluída sem ajuda, o primeiro clique,
termos incompreendidos e etapas desnecessárias. Nenhuma regra de negócio deve
ser criada apenas com base na aparência da interface.

## Segunda rodada

- A consulta de Ausências passou a selecionar explicitamente o vínculo original
  da entrada de escala. A nova referência de ausência herdada tornara a relação
  ambígua no PostgREST e impedia a página de carregar (`PGRST201`).
- A listagem mostra filtros com seleção clara, resultado vazio específico e
  nome de quem cobre a jornada também na apresentação compacta.
- O detalhe informa de imediato se há cobertura, oferece o caminho até a
  presença do dia e usa termos operacionais em vez de `ScheduleEntry` e IDs.
- A tela de Presença apresenta o panorama diário em uma superfície compacta e
  liga jornadas sem cobertura à lista de ausências. Horários realizados ficam
  visíveis também quando a tabela esconde colunas secundárias.
- O detalhe do colaborador prioriza alocação atual e histórico. Contato,
  administração do acesso Worker e mudanças de situação aparecem depois.

As páginas de Ausências, Presença e Colaborador foram conferidas no navegador
do ambiente de teste. Nenhum registro operacional foi alterado nesta rodada.

## Terceira rodada

- A criação de Escalas explica que o resultado é um rascunho, diferencia começar
  vazio de copiar uma escala publicada e orienta a conferência das jornadas
  antes de enviar para aprovação.
- O formulário sinaliza período invertido, sobreposição conhecida e ausência de
  escala de origem antes do envio; erros de campo deixam de permanecer visíveis
  após a pessoa corrigir o campo.
- A seção de revisão usa termos operacionais e mostra a consequência de publicar.
  A publicação exige uma confirmação explícita na própria tela.
- A criação e edição de Alocações explicam o período aberto, mostram os estados
  dos colaboradores em português e indicam o retorno ao detalhe após salvar.

Os formulários e a validação obrigatória foram conferidos no navegador do
ambiente de teste. Nenhum registro operacional foi criado nesta rodada.

## Quarta rodada

- O menu do Core foi agrupado por rotina, estrutura, pessoas, clientes e
  administração. A rotina fica aberta inicialmente; os outros grupos se abrem
  conforme a página atual e guardam a preferência de cada navegador.
- Uma busca de páginas e tarefas está disponível no menu e no cabeçalho móvel.
  Termos usuais, como “falta”, levam ao módulo correspondente. No computador,
  Ctrl/Cmd+K abre a busca; setas e Enter permitem navegar sem mouse.
- Os indicadores da Visão geral passaram a ser consultados sob demanda, após
  pendências e atalhos. O detalhe da escala mantém aprovação visível e recolhe
  datas e histórico quando não são necessários para a tarefa atual.
- As janelas de jornada, ausência, substituição e presença usam um componente
  de diálogo com título, foco inicial, Escape e retorno do foco. O menu móvel
  também usa um diálogo modal nativo. Confirmações de cancelamento de ausência
  e remoção em lote apresentam a consequência antes da ação.
- No Worker, a tela Hoje deixa de repetir o atalho para Escala já presente na
  navegação fixa. A mensagem vazia aponta diretamente para esse item.

O Core foi conferido no navegador em largura de computador e telefone,
incluindo busca, menu e janela de jornada. O acesso Worker da sessão atual não
estava disponível; a mudança pontual nessa tela foi verificada por código e
pelos testes existentes. Não houve alteração de registros operacionais.

## Próximo ciclo de desenho

- Observar com Operações e RH os percursos de ausência, presença, escala e
  alocação sem fornecer o manual antes; registrar dúvidas e etapas evitáveis.
- Validar com as diretorias os novos grupos do menu, os termos de busca e os
  atalhos mais usados antes de consolidar a nomenclatura.
- Avaliar em telefone real a escala, o registro de presença e os estados vazios
  do Worker; ajustar densidade e texto com base em observação.
