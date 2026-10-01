# Acabamento das rotas do Pulsa Core

Inventário das 43 páginas em `/app`, excluindo Colaboradores, que já recebeu a rodada própria, e o aplicativo Pulsa Worker. Este acabamento segue a fundação em `ui-06-application-foundation.md`: hierarquia informacional, superfícies contidas, responsividade e estados de carregamento fiéis ao conteúdo. Nenhuma regra operacional muda.

| Rotas | Estrutura e tratamento específico |
| --- | --- |
| `/app` | Visão geral: manter indicadores, caminhos de ação e resumo de operações; não converter em listagem genérica. |
| `/app/absences`, `/[absenceId]` | Ausências: manter filtros de cobertura e contexto da ocorrência; tabela densa pode rolar horizontalmente com indicação visual, sem segunda rolagem vertical. Detalhe permanece em seções. |
| `/app/assignments`, `/new`, `/[assignmentId]`, `/[assignmentId]/edit` | Alocações: busca, período e vínculo temporal preservados; listagem fluida, colunas proporcionais e formulário mais concentrado. Histórico e contexto operacional continuam no detalhe. |
| `/app/presences` | Presença: preservar seleção do dia, indicadores e leitura operacional. A tabela longa acompanha a página e sinaliza overflow horizontal. |
| `/app/scheduling`, `/new`, `/[scheduleId]` | Escalas: preservar período, revisão, aprovação e as visualizações semanal, diária e por colaborador. O carregamento do detalhe espelha resumo e programação sem empilhar uma tabela fictícia dentro de outro card. |
| `/app/operations`, `/new`, `/[operationId]`, `/[operationId]/edit` | Operações: lista, contexto contratual, métricas e unidades preservados. O detalhe separa visão geral, unidades e situação em abas; a edição conserva a aba de origem ao voltar. Formulário usa uma superfície compacta. |
| `/app/units`, `/new`, `/[unitId]`, `/[unitId]/edit` | Unidades: tabela com larguras controladas e página sem rolagem interna. O detalhe separa visão geral, postos, colaboradores e situação; a edição conserva a aba de origem. Formulário preserva fuso horário. |
| `/app/units/[unitId]/positions/new`, `/[positionId]`, `/[positionId]/edit`; `/app/positions`, `/new`, `/[positionId]`, `/[positionId]/edit` | Postos: cadastro e navegação continuam associados à unidade e ao cargo reutilizável. A lista usa colunas proporcionais, sem criar noções de escala, vaga ou cobertura. As rotas globais de detalhe/edição reutilizam as telas aninhadas. |
| `/app/job-roles`, `/new`, `/[jobRoleId]`, `/[jobRoleId]/edit` | Cargos: listagem e cadastro enxutos; novo cargo abre sem skeleton porque não depende de dados prévios. |
| `/app/clients`, `/new`, `/[clientId]`, `/[clientId]/edit` | Clientes: listagem, dados comerciais e vínculos mantidos; novo cliente abre sem skeleton, já que só possui campos estáticos. |
| `/app/contracts`, `/new`, `/[contractId]`, `/[contractId]/edit` | Contratos: manter relação com cliente e período; formulário reduz espaço redundante sem alterar campos ou validação. |
| `/app/admin/users`, `/[userId]`; `/app/admin/audit`, `/[auditEventId]` | Administração: manter permissões, escopo e leitura de auditoria; tabelas usam a página como rolagem vertical. Filtros de auditoria e dados de acesso não são apresentados como cadastro comum. |

Padrões transversais: listagens têm uma única rolagem vertical da página, com overflow horizontal apenas quando necessário; skeletons de lista, detalhe e formulário reproduzem a família da tela sem superfícies aninhadas excessivas; formulários compartilham largura e espaçamento mais contidos no desktop e conservam o formato de folha no celular. As telas de detalhe curtas permanecem em seções contínuas. Abas agrupam tarefas distintas nos detalhes longos de Colaboradores, Operações e Unidades; Escala conserva suas visualizações próprias.
