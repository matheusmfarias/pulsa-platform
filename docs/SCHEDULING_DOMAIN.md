# Pulsa Platform — Scheduling Domain

Status: Fase 4 — especificação de domínio (não implementada)

---

## 1. Propósito e fronteiras

Scheduling representa **quando uma pessoa previamente vinculada operacionalmente deve
trabalhar**. É o domínio de programação planejada; não registra a execução real nem a demanda
temporal.

As responsabilidades permanecem separadas:

| Conceito | Responde | Não responde |
| --- | --- | --- |
| Assignment | Onde e em qual `Position` o `Worker` está vinculado | Quando deve trabalhar |
| Scheduling | Quando o `Worker` está programado | Se efetivamente trabalhou ou quantas pessoas eram necessárias |
| Attendance (futuro) | O que efetivamente ocorreu | A programação oficial |
| Staffing Requirement temporal (futuro) | Quantas pessoas eram necessárias no período | Pessoas programadas ou presentes |

`Position.base_required_headcount` continua sendo a necessidade estrutural/base do posto. Não é
demanda temporal, não mede cobertura e nunca deve ser reinterpretado para validar uma escala.

Esta especificação substitui, para a Fase 4, a hipótese preliminar de modelagem por
`Shift → ShiftPosition → ShiftAssignment` registrada em documentos anteriores. Ela não altera
o domínio já implementado nem cria schema, migração, código ou permissão nesta fase documental.

## 2. Modelo de domínio

```text
Operation
└── Schedule
    └── ScheduleRevision
        └── ScheduleEntry
            └── Assignment
                ├── Worker
                └── Position
                    └── Unit (timezone)
```

`Schedule` pertence a uma `Operation`. `ScheduleEntry` alcança `Worker`, `Position`, `Unit`,
`Operation`, `Contract` e `Client` por sua `Assignment` e pela hierarquia já canônica. Não devem
ser duplicados `client_id`, `contract_id`, `unit_id`, `position_id` ou `worker_id` quando forem
deriváveis dessa cadeia.

`Assignment` é a âncora histórica de elegibilidade de cada entrada: a escala não cria uma nova
alocação estrutural nem altera a história da alocação existente.

### Schedule

Representa o planejamento lógico de uma única `Operation` em um período civil.

Campos conceituais:

- `organization_id`
- `operation_id`
- `period_start` (`date`)
- `period_end` (`date`)
- `created_at`
- `created_by`

O lifecycle de publicação não pertence diretamente a `Schedule`; ele pertence às suas revisões.
A implementação futura deverá validar um período coerente, incluindo `period_start <= period_end`.

Para a mesma `Operation`, duas `Schedules` não podem ter períodos civis sobrepostos. A regra
usa o intervalo explícito `period_start`/`period_end`, sem tornar mês uma unidade obrigatória;
Schedules sequenciais sem sobreposição são permitidas. A implementação PostgreSQL deve proteger
essa invariante no banco, e não somente na UI.

### ScheduleRevision

Representa uma versão historicamente preservável do planejamento.

Campos conceituais:

- `schedule_id`
- `version`
- `status`
- `based_on_revision_id` (nullable)
- `created_at`, `created_by`
- `submitted_at`, `submitted_by`
- `approved_at`, `approved_by`
- `published_at`, `published_by`

Invariante conceitual: `UNIQUE (schedule_id, version)`.

Uma revisão publicada é o registro oficial daquele planejamento e nunca pode ser reescrita
silenciosamente. `based_on_revision_id` permite rastrear uma revisão criada a partir de uma
publicada.

Uma `Schedule` pode ter várias revisões `published`, pois as versões anteriores permanecem
histórico oficial. A revisão oficial atual é a revisão `published` de maior `version`. Esse
estado é derivável; não adicionar `current_revision_id` conceitual à `Schedule` nesta fase.

### ScheduleEntry

Representa um intervalo concreto de trabalho programado para uma `Assignment` em uma revisão.

Campos conceituais:

- `schedule_revision_id`
- `assignment_id`
- `starts_at` (`timestamptz`)
- `ends_at` (`timestamptz`)
- `break_starts_at` (`timestamptz`, nullable)
- `break_ends_at` (`timestamptz`, nullable)
- `created_at`
- `created_by`

Não duplicar `worker_id` ou `position_id`: ambos são derivados da `Assignment`. A implementação
futura deve assegurar `starts_at < ends_at` e que o intervalo esteja dentro do período lógico da
`Schedule`, interpretado conforme a timezone operacional da `Unit`.

## 3. Lifecycle de revisão

Estados V1:

- `draft`
- `pending_approval`
- `approved`
- `published`

| Estado | Entradas | Próximas transições permitidas |
| --- | --- | --- |
| `draft` | Editáveis | `pending_approval` |
| `pending_approval` | Congeladas | `approved`, `draft` |
| `approved` | Congeladas | `published`, `draft` |
| `published` | Imutáveis | nenhuma |

Transições explícitas:

```text
draft → pending_approval
pending_approval → approved
pending_approval → draft
approved → published
approved → draft
```

Uma alteração em `pending_approval` exige retorno a `draft`. Uma alteração em `approved`
invalida a aprovação e também exige retorno a `draft`. Após a publicação, o caminho é:

```text
published revision → new revision based on the published revision → draft → novo ciclo
```

`published` é, portanto, imutável. A V1 não exige segregação entre maker e checker:
`created_by` pode ser igual a `approved_by`. Uma futura regra de segregação poderá ser definida
por `Operation`; não será criada uma configuração genérica antecipada.

Estados como `viewed`, `acknowledged` e `accepted` não pertencem ao lifecycle de `Schedule` ou
`ScheduleRevision`.

## 4. Elegibilidade e integridade temporal

Para criar uma nova `ScheduleEntry`, a `Assignment` deve:

1. pertencer à mesma `Operation` da `Schedule`, pela cadeia
   `Assignment → Position → Unit → Operation`;
2. cobrir a data/período programado da entrada;
3. ter status `pending` ou `active`.

Não se pode criar nova entrada usando `Assignment` com status `suspended`, `finished` ou
`cancelled`. Esta lista deve ser reavaliada se o domínio de `Assignment` mudar.

As proteções históricas atuais continuam válidas: o contexto estrutural não pode ser reescrito
depois que há histórico de `Assignment`. Scheduling deve sempre interpretar esse contexto pela
cadeia preservada, e não por cópias denormalizadas.

Elegibilidade e integridade não são verificadas apenas na criação da entrada. Antes de
`submitScheduleRevision()`, `approveScheduleRevision()` e `publishScheduleRevision()`, a
implementação futura deve revalidar o estado atual: pertencimento da `Assignment` à `Operation`,
status elegível, cobertura do período da entrada pela `Assignment`, coerência das vigências
estruturais e inexistência de conflito de `Worker`. Não confiar somente em validação histórica
feita quando o rascunho foi criado.

## 5. Tempo, timezone e intervalo

O período de `Schedule` usa `date` (`period_start` e `period_end`). Os horários de
`ScheduleEntry` são instantes `timestamptz` persistidos em UTC.

A criação, edição e apresentação devem interpretar horário local por:

```text
Position → Unit.timezone
```

`Unit.timezone` é a timezone operacional, e não o timezone do servidor nem uma configuração
global da aplicação. O modelo deve suportar naturalmente turnos que atravessam a meia-noite;
eles são um único intervalo cuja ordem absoluta permanece `starts_at < ends_at`. Horários não
devem ser armazenados como strings.

Na V1 cada entrada admite zero ou um intervalo exato:

- `break_starts_at` e `break_ends_at` são ambos `NULL`, ou ambos preenchidos;
- quando preenchidos, vale
  `starts_at < break_starts_at < break_ends_at < ends_at`.

Não criar `ScheduleEntryBreak` na foundation.

## 6. Conflitos

Um rascunho pode conter conflitos temporariamente para permitir a montagem da escala. A UX deve
exibi-los de modo explícito. A transição `draft → pending_approval` deve bloquear enquanto houver
conflito crítico.

Conflitos críticos V1:

1. o mesmo `Worker` em intervalos sobrepostos;
2. `Assignment` incompatível com a `Operation` da escala;
3. entrada fora da vigência da `Assignment`;
4. incoerência com vigência estrutural já existente.

O primeiro conflito já impede que a mesma pessoa seja planejada em dois locais ao mesmo tempo;
não há regra independente baseada somente em localização. A proteção de sobreposição de
`Assignment` existente é estrutural e por data: ela não substitui a validação intradiária de
`ScheduleEntry`.

A validação de sobreposição do mesmo `Worker` não se limita à mesma `Schedule` ou `Operation`.
Ao validar uma revisão para submissão, aprovação ou publicação, ela deve comparar suas entradas
com as da própria revisão e com entradas de outras revisões relevantes da mesma `Organization`.
Como bloqueio externo V1, são relevantes revisões `pending_approval`, `approved` e a revisão
`published` oficial atual de cada outra `Schedule`. Outras revisões `draft` não bloqueiam, pois
planejamentos ainda não oficiais podem concorrer temporariamente durante a montagem.

Uma revisão `published` histórica substituída por uma `published` de `version` maior da mesma
`Schedule` não provoca conflito externo. Assim, para cada outra `Schedule`, a implementação deve
considerar somente sua revisão `published` oficial atual, além das revisões
`pending_approval` e `approved` relevantes.

Não bloquear uma escala porque `scheduled_count > base_required_headcount`. A comparação entre
necessidade temporal, pessoas programadas e presença real dependerá de um futuro domínio de
Staffing Requirement temporal.

## 7. Publicação, ações de domínio e auditoria

Submissão, aprovação, devolução, publicação e criação a partir de publicação devem ser ações
explícitas, não uma atualização genérica de `status`:

```text
submitScheduleRevision()
approveScheduleRevision()
returnScheduleRevisionToDraft()
publishScheduleRevision()
createRevisionFromPublished()
```

A implementação futura deve usar o boundary vigente:

```text
Server Action → Service → requirePermission() → RBAC-protected RPC
→ DB authorization → mutation + audit
```

Não haverá DML direto em tabelas protegidas. Devem ser auditadas, no mínimo, a criação, a
submissão, a aprovação, a devolução a rascunho, a publicação e a criação de revisão baseada em
publicação anterior. Operações de cópia ou lote devem preferir uma auditoria que descreva a ação
sem produzir ruído desnecessário de centenas de inserts individuais.

## 8. RBAC e contexto operacional

Permissions propostas para implementação futura:

- `schedule:read`
- `schedule:create`
- `schedule:update`
- `schedule:submit`
- `schedule:approve`
- `schedule:publish`

Matriz inicial proposta:

| Role | Permissions de Scheduling |
| --- | --- |
| `DIRECTOR` | todas |
| `OPERATIONS_MANAGER` | todas |
| `SUPERVISOR` | todas |
| `HR` | todas |
| `RECRUITER` | `schedule:read` |
| `ADMINISTRATIVE` | `schedule:read` |

Esta é uma proposta inicial e poderá mudar quando houver regras específicas por `Operation`.
Não criar IAM dinâmico nem escopo de `Unit` nesta fase.

O Scheduling Backoffice respeitará o `OperationalContext` existente (`all`, `client`,
`contract`) como filtro de UX. Esse contexto não é autorização, tenancy nem escopo de segurança:
`Schedule` continua pertencendo à `Operation`, e RBAC/RLS continuam sendo as barreiras de acesso.

## 9. Fonte única e perspectivas de UX

Há uma única fonte de verdade: as `ScheduleEntry` de uma revisão. As visões não criam modelos
separados para escala por `Position` e por `Worker`.

- visão principal: semanal por `Position`;
- visões secundárias: diária e por `Worker`.

Nessas visões, `base_required_headcount` pode aparecer apenas como referência estrutural
rotulada; não como lacuna, cobertura ou necessidade do período enquanto não existir Staffing
Requirement temporal.

## 10. Recorrência, comunicação e domínios adiados

Não criar motor de recorrência ou RRULE na primeira versão. O fluxo inicial de produtividade é:

```text
Schedule anterior/publicada → copiar para novo período → gerar draft → ajustar
```

Padrões como `5x2`, `6x1` e `12x36` poderão auxiliar geração futura, mas não são fonte de
verdade. `ScheduleEntry` é a programação concreta.

Publicar torna a escala oficial. Comunicação, visualização, ciência e aceite são estados
individuais futuros; não devem ser status da escala nem gerar tabelas de acknowledgement nesta
foundation. Eles somente serão introduzidos quando Pulsa Worker ou canais de comunicação existirem.

Também ficam explicitamente fora do escopo desta foundation:

- temporal staffing requirements;
- attendance, ponto, ausências e atestados;
- replacements e reserve workers;
- calendário dinâmico de disponibilidade;
- Pulsa Worker;
- tasks, checklists e canais de comunicação;
- AI scheduling, forecasting e previsão de no-show;
- routing e payroll.

Os conceitos permanecem distintos:

```text
necessidade estrutural ≠ necessidade temporal ≠ pessoas escaladas ≠ presença real
```

Não persistir cobertura derivada enquanto as fontes de dados necessárias não existirem.

## 11. Fases de implementação

### Phase 4A — Scheduling Domain Foundation

- schema;
- revisions;
- entries;
- lifecycle;
- conflicts;
- RBAC;
- RPC;
- audit;
- tests.

### Phase 4B — Scheduling Backoffice

- listagem;
- criação e edição;
- weekly view;
- daily view;
- worker view;
- aprovação e publicação;
- OperationalContext.

### Phase 4C — Scheduling Productivity

- copy previous schedule;
- bulk operations;
- UX refinements.

### Phase 4D — Communication / Acknowledgement

Somente quando canais de comunicação ou Pulsa Worker existirem.

## 12. Princípios arquiteturais vinculantes

- PostgreSQL é a source of truth.
- Histórico publicado não pode ser reescrito silenciosamente.
- Mutações protegidas não usam DML direto; services chamam `requirePermission()` e RPCs públicas
  protegidas aplicam autorização no banco.
- Regras de negócio não pertencem a componentes React.
- Não criar abstrações especulativas.
- Não persistir cobertura derivada.
- A timezone da `Unit` governa o tempo operacional.
- `Worker` continua separado de usuário de autenticação.
- `Unit` continua sendo localização operacional, não departamento.
