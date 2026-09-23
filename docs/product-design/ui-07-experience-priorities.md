# UI-07 — Experiência orientada ao trabalho

Status: duas rodadas implementadas; observação com usuários ainda pendente.

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

## Próximo ciclo de desenho

- Observar com Operações e RH os percursos desta segunda rodada sem fornecer o
  manual antes; usar as dúvidas reais para priorizar as próximas mudanças.
- Revisar as telas de criação e edição de escala e alocação, em especial
  validações, consequências de publicação e retorno após salvar.
- Avaliar em telefone real a escala, o registro de presença e os estados vazios
  do Worker; ajustar densidade e texto com base em observação.
- Validar com as diretorias a nomenclatura dos módulos e os atalhos mais usados
  antes de uma reorganização maior da navegação.
