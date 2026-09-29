# UI-08 — Inventário de controles HTML e próximos componentes Pulsa

Este inventário registra os controles de interface encontrados no código e
separa os casos já cobertos por primitives Pulsa daqueles que ainda usam
diretamente a aparência ou o comportamento padrão do navegador. Elementos
HTML continuam sendo a base semântica dos componentes; o objetivo é evitar
controles visuais inconsistentes entre módulos.

## Selects

Os selects visíveis usam `src/components/ui/select.tsx`, um combobox Pulsa com
lista própria, seleção por mouse e teclado, busca por digitação, suporte a
opções desabilitadas, validação obrigatória e envio pelo `FormData`.
`src/components/ui/filter-select.tsx` continua sendo o seletor compacto das
barras de filtro, com rótulo e valor ativo no próprio gatilho.

Os usos cobertos incluem formulários de alocação, contrato, posto, unidade,
operação, escala, cargo e convite de usuário; criação de jornada; motivo de
ausência; atribuição de substituto; e seleção de mês e ano na navegação de
presenças.

Ao adicionar uma opção, use `<option value="...">Rótulo</option>` como dado de
entrada para `Select`. Ela é convertida em opção visual do Pulsa e não aparece
como um menu nativo no navegador. Para valores controlados, use
`value` + `onValueChange`.

## Outros controles encontrados

| Controle | Estado atual | Próximo passo recomendado |
| --- | --- | --- |
| Texto, busca, e-mail, senha, número, data e hora | `Input` cobre todos os campos visíveis compartilhados, inclusive a busca da navegação. Campos `hidden` permanecem HTML direto por serem apenas transporte de formulário. | Manter data e hora sobre inputs nativos encapsulados: eles preservam teclado, locale e picker do dispositivo com acabamento Pulsa. |
| Área de texto | Todos os campos visíveis usam `Textarea`, inclusive a descrição de cargo. | Reutilizar a primitive em novos formulários. |
| Checkbox | `Checkbox` cobre a seleção de jornadas e os dias de cópia em Scheduling, com estados marcado, foco, hover e desabilitado. | Reutilizar a primitive em novas seleções booleanas. |
| Disclosure / expansão | `Disclosure`, `DisclosureTrigger` e `DisclosureContent` cobrem Visão geral, presença, histórico da escala, auditoria, detalhes de usuário e diagnóstico de desempenho. | Preservar a hierarquia e escolher o acabamento da superfície no módulo; o comportamento e o indicador de expansão ficam na primitive. |
| Botões | Ações de produto usam `Button`; botões HTML diretos aparecem principalmente na navegação global, menus próprios e calendário de presenças. | Manter o HTML interno dessas primitives. Revisar os botões diretos quando os respectivos controles forem consolidados, sem substituir interações de navegação por uma primitive genérica. |
| Tabelas | Listagens usam primitives em `src/components/ui/table.tsx`. A grade semanal de Scheduling é uma tabela especializada escrita diretamente no módulo. | Preservar a semântica tabular da grade. Se novos ajustes visuais forem necessários, criar primitives específicas para a grade semanal, sem generalizar a tabela para todos os domínios. |
| Diálogos e campos | `Dialog`, `AlertDialog`, `Field`, `Input` e `Textarea` já encapsulam padrões compartilhados. | Continuar usando essas primitives em novas telas; evitar recriar foco, validação e tokens localmente. |

## Orientação

- Os tokens semânticos Pulsa continuam sendo a fonte de cor, foco e estados.
- Controles que precisam de comportamento nativo de plataforma, como data e
  hora, podem continuar usando os inputs HTML por trás do wrapper visual.
- Campos ocultos que carregam IDs ou contexto para ações do servidor não são
  controles visíveis e não precisam de substitutos visuais.
- Scheduling mantém suas interações de domínio específicas; componentes
  compartilhados devem oferecer a base visual e acessível sem apagar essas
  diferenças.
