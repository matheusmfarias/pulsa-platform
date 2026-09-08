# Pulsa Platform — Operational Presence Domain

Status: proposta de domínio para a Fase 6 — sem implementação

## 1. Propósito e fronteira

Operational Presence registra **quem efetivamente compareceu para realizar uma entrada de
escala oficial**. Não substitui escala, ausência ou substituição e não é o registro trabalhista
oficial de jornada.

```text
Planned   = ScheduleEntry
Exception = Absence
Coverage  = Replacement
Actual    = Presence
```

Cada conceito responde a uma pergunta diferente:

| Conceito | Pergunta respondida |
| --- | --- |
| `Assignment` | Onde e em qual posto o Worker está vinculado? |
| `ScheduleEntry` | Quem foi originalmente programado, onde e quando? |
| `Absence` | O Worker originalmente programado informou ou teve uma indisponibilidade? |
| `Replacement` | Qual Assignment assumiu a cobertura daquela ausência? |
| `Presence` | Qual Assignment efetivamente realizou aquela entrada de escala? |

`ScheduleEntry` não recebe campos de presença e revisões publicadas continuam imutáveis.
`Absence` não deve ser inferida da falta de `Presence`: ausência de confirmação é estado
desconhecido, não prova de falta. `Replacement` informa cobertura planejada/confirmada, mas não
prova comparecimento.

## 2. Modelo de domínio

### 2.1 Âncora e identidade

`Presence` deve referenciar diretamente:

- uma `ScheduleEntry`, como âncora do compromisso operacional concreto; e
- uma `performed_assignment_id`, como a `Assignment` da pessoa que efetivamente compareceu.

Quando o comparecimento decorrer de substituição, deve também referenciar o `Replacement` que
autorizou aquela troca. O vínculo conceitual é:

```text
ScheduleEntry (planejado original)
├── Assignment (Worker original)
├── Absence (exceção, opcional)
│   └── Replacement (cobertura, opcional)
└── Presence (realizado)
    ├── performed_assignment_id
    └── replacement_id (somente quando o realizado é o substituto)
```

`Presence` não deve apontar somente para `Worker`: a `Assignment` preserva o contexto de
`Position`, `Unit`, `Operation` e vigência que legitimou a atuação. Também não deve duplicar
`worker_id`, `position_id`, `unit_id`, `operation_id`, `contract_id` ou `client_id`, pois são
deriváveis das referências preservadas.

Deve existir no máximo uma `Presence` não cancelada por `ScheduleEntry` na V1. A Fase 6 V1
modela a realização do posto/intervalo programado, não toda entrada espontânea de pessoas em uma
unidade. Se o realizado foi atribuído à pessoa errada, corrige-se por cancelamento auditado e
novo registro; não se sobrescreve a identidade histórica.

### 2.2 Resolução do Worker efetivamente esperado

A resolução ocorre transacionalmente no primeiro registro de presença:

1. localizar a `ScheduleEntry` na revisão publicada oficial atual da `Schedule`;
2. localizar sua `Absence` com status `reported`, se existir;
3. se não houver `Absence` ativa, o esperado efetivo é a `Assignment` original da entrada;
4. se houver `Absence` ativa e `Replacement` com status `active`, o esperado efetivo é a
   `replacement_assignment_id`;
5. se houver `Absence` ativa sem `Replacement`, não há Worker efetivamente esperado e a entrada
   está descoberta; não se cria `Presence` até a exceção ser resolvida;
6. persistir a Assignment resolvida em `performed_assignment_id` e, quando aplicável, o
   `replacement_id`.

Essa resolução é um **snapshot do fato no momento do registro**, não uma propriedade calculada
em cada leitura. Mudanças posteriores em `Absence` ou `Replacement` não podem trocar
silenciosamente quem consta como presente.

Consequências de lifecycle:

- uma `Replacement` com `Presence` não cancelada não pode ser cancelada antes do cancelamento
  explícito da `Presence`;
- para registrar o Worker original após uma ausência/replacement equivocada, primeiro cancela-se
  a presença, depois a substituição e depois a ausência, preservando toda a trilha;
- a troca de substituto ainda é permitida antes de existir `Presence`: cancela-se a cobertura
  anterior e cria-se outra;
- `Presence` só nasce para entrada pertencente à revisão publicada oficial no instante do
  primeiro registro. Se outra revisão for publicada depois, o fato continua ligado à entrada
  que era oficial e deve permanecer consultável no histórico.

### 2.3 Campos conceituais

Campos mínimos propostos:

- `id`;
- `organization_id`;
- `schedule_entry_id`;
- `performed_assignment_id`;
- `replacement_id` (`null` para o Worker original);
- `status`;
- `arrived_at`;
- `departed_at` (`null` enquanto a presença estiver em andamento);
- `source` (origem do primeiro registro);
- `source_reference` (`null` para registro manual sem referência externa);
- `recorded_at` e `recorded_by`;
- `completed_at` e `completed_by` quando houver saída;
- `cancelled_at`, `cancelled_by` e `cancellation_reason` quando cancelada.

`organization_id` é mantido como boundary de tenancy/RLS e deve coincidir com a Organization da
`ScheduleEntry`, da `performed_assignment_id` e do `Replacement`, quando presente.

`arrived_at` e `departed_at` são instantes `timestamptz`, persistidos em UTC. Exibição e
comparação civil usam `Position → Unit.timezone`, como no Scheduling. `recorded_at` é diferente
do horário observado: um supervisor pode registrar às 08:20 uma chegada ocorrida às 08:05.

### 2.4 Estados mínimos

Estados persistidos V1:

- `present`: chegada confirmada e `departed_at` ainda ausente;
- `completed`: chegada e saída confirmadas;
- `cancelled`: registro invalidado explicitamente, sem apagamento físico.

Transições:

```text
novo → present → completed
          └──────→ cancelled
                    ↑
completed ──────────┘
```

Não persistir como status de `Presence`:

- `expected` ou `unconfirmed`: derivam de escala sem presença;
- `absent`: pertence a `Absence`;
- `covered`: deriva de `Replacement` ativa;
- `late` e `early_departure`: são classificações derivadas da comparação entre horários
  realizados e planejados;
- `on_break`: intervalos reais ficam fora da V1.

A V1 pode mostrar objetivamente “chegada após o início programado” e “saída antes do fim
programado”. Não deve chamar isso de atraso tolerado, falta parcial ou infração enquanto não
existirem regras concretas por operação. Uma futura tolerância poderá alterar a classificação,
sem reescrever os horários observados.

### 2.5 Chegada/saída versus eventos append-only

A V1 deve armazenar `arrived_at` e `departed_at` no agregado `Presence`, e **não** introduzir um
ledger genérico de batidas/eventos append-only.

Isso é suficiente para a pergunta operacional e evita transformar Pulsa em relógio de ponto.
A preservação histórica ocorre por:

- ações explícitas de registrar chegada, registrar saída, corrigir e cancelar;
- proibição de DML direto;
- auditoria atômica com estado anterior, estado novo, campos alterados, autor, fonte e momento;
- ausência de hard delete.

Correções de horário são permitidas somente por uma ação `correctPresence`, com justificativa
obrigatória e auditoria. Se no futuro app offline ou integração produzir múltiplos eventos brutos,
um `PresenceEvent` de ingestão poderá ser adicionado como fonte para a projeção `Presence`, sem
mudar a semântica desta entidade.

### 2.6 Origem do dado

Um único campo controlado `source` é suficiente na V1:

- `manual`;
- `app`;
- `integration`.

`source_reference` é opcional em `manual` e obrigatório em `app`/`integration`; contém o
identificador opaco e estável do agregado na origem. `source` identifica quem iniciou a
`Presence`; a origem de saída e correções posteriores fica em cada evento de auditoria. Não criar
agora catálogo de fornecedores, webhooks genéricos ou hierarquia de dispositivos.

`recorded_by`/`completed_by` identificam o usuário autenticado quando a ação é humana. Uma
integração futura deve usar um principal técnico autenticado e vinculado à Organization, nunca
DML com service role usado como bypass. A identidade do Worker continua separada de usuário de
autenticação.

## 3. Invariantes

1. Uma `Presence` pertence à mesma Organization de todas as referências alcançadas.
2. Só se inicia `Presence` para uma `ScheduleEntry` de revisão publicada oficial no momento da
   criação.
3. Existe no máximo uma `Presence` não cancelada por `ScheduleEntry`.
4. Sem ausência reportada, `performed_assignment_id` é a Assignment original e
   `replacement_id` é `null`.
5. Com ausência reportada e replacement ativo, `performed_assignment_id` é exatamente a
   `replacement_assignment_id` e `replacement_id` aponta para esse replacement.
6. Ausência reportada e descoberta não aceita `Presence`; a ausência deve ser cancelada ou
   coberta primeiro.
7. `performed_assignment_id`, `schedule_entry_id` e `replacement_id` são imutáveis depois da
   criação. Erro de identidade exige cancelamento e novo registro.
8. `arrived_at` é obrigatório; `departed_at`, quando presente, deve ser maior que
   `arrived_at`.
9. `present` exige `departed_at = null`; `completed` exige `departed_at != null`; `cancelled`
   exige metadados completos de cancelamento.
10. Não há hard delete nem reativação de `Presence` cancelada.
11. Cancelar a `Replacement` referenciada exige cancelar antes a `Presence` não cancelada.
12. Publicação posterior de uma revisão não move nem apaga presenças já registradas.
13. Horários fora do intervalo planejado são dados operacionais válidos e geram sinalização;
    não são silenciosamente ajustados ou rejeitados por uma tolerância global arbitrária.
14. Falta de `Presence` nunca cria `Absence` automaticamente.
15. `ScheduleEntry`, `Absence`, `Replacement` e `Presence` não são reescritas para imitar umas às
    outras.

## 4. Idempotência e conflitos

### Idempotência

- Toda ação de escrita aceita uma `idempotency_key` no boundary da aplicação.
- Para `app` e `integration`, `source_reference` é obrigatório e único no escopo
  `(organization_id, source, source_reference)`.
- Repetir a mesma chave/referência com o mesmo comando e payload canônico retorna o resultado já
  produzido, sem nova mutação nem novo evento de auditoria.
- Reutilizar a mesma chave de comando com payload diferente é conflito explícito; nunca vale
  “last write wins”. A mesma `source_reference` pode evoluir de chegada para saída por meio de
  outro comando e outra chave, mas nunca pode passar a identificar outra Organization,
  `ScheduleEntry` ou Assignment realizada.
- Em `manual`, a unicidade da presença ativa por `ScheduleEntry` impede duplo clique de criar
  duplicatas. A chave de requisição ainda deve ser enviada pela aplicação para replay seguro.
- Registrar a mesma saída novamente com o mesmo horário é replay idempotente; uma saída diferente
  exige `correctPresence`, permissão própria e justificativa.

A persistência técnica do recibo de idempotência pode ser definida na 6A. Ela não deve virar um
modelo genérico de mensageria antes da ingestão por app/integração existir.

### Conflitos

As RPCs devem bloquear/serializar a `ScheduleEntry`, a `Absence` e o `Replacement` relevantes ao
resolver o esperado efetivo, evitando corrida entre registrar presença, trocar cobertura e
cancelar ausência.

Conflitos bloqueantes V1:

- segunda `Presence` não cancelada para a mesma entrada;
- Assignment realizada diferente da resolução original/replacement;
- referência cruzando Organizations;
- saída anterior à chegada;
- alteração de identidade de uma presença existente;
- cancelamento de replacement ainda referenciado por presença válida;
- reutilização divergente de chave idempotente ou referência de origem.

Conflitos que devem ser **exibidos, não apagados nem normalizados**:

- chegada depois do início planejado;
- saída antes do fim planejado;
- horário realizado muito fora do intervalo planejado;
- presença histórica ligada a revisão publicada depois substituída;
- eventual sobreposição entre presenças do mesmo Worker. A realidade deve permanecer registrada,
  e a inconsistência deve ser encaminhada para correção explícita.

## 5. Fluxo operacional

O read model diário do Supervisor parte da revisão publicada oficial e resolve uma linha por
`ScheduleEntry`:

```text
ScheduleEntry
  ↓ resolve Absence reportada
  ↓ resolve Replacement ativa
  ↓ encontra Presence não cancelada
  ↓ compara planned x actual
  ↓ classifica estado operacional e necessidade de ação
```

Estados derivados para a visão, sem criar um novo lifecycle persistido:

| Condição | Esperado efetivo | Estado operacional |
| --- | --- | --- |
| Sem ausência e sem presença | Worker original | Aguardando confirmação |
| Ausência reportada, sem replacement | Ninguém | Ausente · descoberto |
| Ausência reportada, replacement ativo, sem presença | Substituto | Coberto · aguardando confirmação |
| Presence `present` | `performed_assignment` | Presente |
| Presence `completed` | `performed_assignment` | Concluído |
| Chegada após início planejado | `performed_assignment` | Presente · chegada após o previsto |
| Saída antes do fim planejado | `performed_assignment` | Concluído · saída antes do previsto |

A visão deve priorizar exceções:

1. ausência descoberta;
2. horário iniciado sem confirmação de presença;
3. substituto esperado ainda não confirmado;
4. chegada após o previsto;
5. saída antes do previsto;
6. registros conflitantes que exigem correção.

Não considerar uma entrada “ausente” apenas porque o relógio passou do início: ela permanece
“sem confirmação” até existir `Absence` ou regra futura explícita de no-show. Tampouco considerar
uma replacement “realizada” antes de existir `Presence`.

O read model deve oferecer filtros por dia, `Operation`, `Unit` e estado operacional, respeitando
`OperationalContext` apenas como filtro de navegação. Ele não é autorização. O histórico deve
continuar Organization-scoped e preservar presenças vinculadas a revisões anteriormente
oficiais.

## 6. RBAC e auditoria

Permissões iniciais propostas:

- `presence:read`;
- `presence:create` — registrar chegada;
- `presence:update` — registrar saída ou corrigir horários com justificativa;
- `presence:cancel` — invalidar um registro com justificativa.

| Role | read | create | update | cancel |
| --- | --- | --- | --- | --- |
| `DIRECTOR` | sim | sim | sim | sim |
| `OPERATIONS_MANAGER` | sim | sim | sim | sim |
| `SUPERVISOR` | sim | sim | sim | sim |
| `HR` | sim | não | não | não |
| `RECRUITER` | não | não | não | não |
| `ADMINISTRATIVE` | não | não | não | não |

O Supervisor precisa corrigir erros operacionais durante o turno; a justificativa e a auditoria
são o controle inicial. Caso a responsabilidade real seja mais restrita por operação, essa regra
deve surgir de requisito validado, sem criar IAM dinâmico antecipadamente.

Como o RBAC atual é Organization-scoped, a primeira versão não deve fingir isolamento por
`Operation` ou `Unit`: `OperationalContext` filtra UX, mas não protege dados. Escopo operacional
mais estreito exige uma evolução explícita de autorização.

Todas as mutações seguem o boundary existente:

```text
Server Action / ingestão autenticada
→ Service
→ requirePermission()
→ RPC pública protegida por RBAC
→ validação e lock no banco
→ mutation + audit atômicos
```

Não há DML direto em `Presence`. A RLS de leitura usa `presence:read` e Organization. Auditoria
mínima:

- `record_arrival`;
- `record_departure`;
- `correct`;
- `cancel`.

Cada evento registra actor/principal, `source`, `source_reference`, horários de observação e
registro, justificativa quando exigida, estado anterior, estado novo e campos alterados. Leituras
de auditoria permanecem protegidas por `audit:read` e RLS Organization-scoped.

## 7. Fora do V1

- sistema oficial de ponto eletrônico e requisitos legais de marcação;
- folha de pagamento, banco de horas, horas extras, adicional noturno e cálculos trabalhistas;
- aprovação de espelho de ponto;
- múltiplas batidas, intervalos reais, pausas e ledger de eventos brutos;
- geolocalização, geofence, biometria, selfie e antifraude;
- tolerâncias configuráveis, arredondamento ou classificação legal de atraso/saída antecipada;
- criação automática de ausência/no-show pela falta de check-in;
- presença sem `ScheduleEntry`, pessoa adicional ou atuação espontânea fora da escala;
- presença parcial dividida entre Worker original e substituto na mesma entrada;
- múltiplos Workers realizando uma única `ScheduleEntry`;
- alterações em `ScheduleEntry` para acomodar o realizado;
- ingestão específica de qualquer fornecedor de ponto;
- sincronização offline e resolução avançada de eventos fora de ordem;
- indicadores oficiais de absenteísmo, produtividade ou horas produtivas sem fórmula acordada;
- alertas preditivos, forecasting e IA de no-show;
- custom roles, permissions dinâmicas ou escopo RBAC por Unit/Operation;
- UI do Pulsa Worker.

## 8. Fases 6A / 6B / 6C

### 6A — Presence Domain Foundation

- validar este modelo e o vocabulário operacional com Supervisores;
- criar schema, constraints, lifecycle e proteção histórica;
- criar permissões fixas, RLS, RPCs e services com `requirePermission()`;
- implementar chegada, saída, correção e cancelamento auditados;
- implementar idempotência mínima e concorrência com Absence/Replacement;
- cobrir invariantes em testes unitários e integração real explicitamente configurada.

Critério de saída: o backend consegue afirmar, de forma auditável, qual Assignment realizou uma
`ScheduleEntry` publicada sem alterar Planned, Exception ou Coverage.

### 6B — Supervisor Operational View

- criar o read model diário de esperado versus realizado;
- combinar ScheduleEntry, Absence, Replacement e Presence sem persistir estados derivados;
- priorizar ausência descoberta, confirmação pendente e desvios de horário;
- adicionar os fluxos manuais do Backoffice para registrar e corrigir presença;
- respeitar timezone da Unit e filtros de `OperationalContext`.

Critério de saída: o Supervisor consegue responder “quem deveria estar, quem está e o que exige
ação agora?”.

### 6C — App / Integration Ingestion Readiness

- estabilizar o contrato autenticado de ingestão com `source_reference` e idempotência;
- criar principal técnico Organization-scoped e política de rotação/revogação;
- tratar retries, payload divergente e eventos fora de ordem de forma explícita;
- pilotar um único produtor real (app ou fornecedor escolhido) antes de generalizar adapters;
- adicionar ledger append-only apenas se o piloto demonstrar necessidade de eventos brutos,
  offline ou reconciliação.

Critério de saída: uma fonte externa consegue atualizar a mesma verdade operacional com segurança,
sem transformar Presence em folha/ponto nem contornar RBAC e auditoria.

## 9. Decisões vinculantes resumidas

- A âncora de `Presence` é `ScheduleEntry`; a identidade realizada é uma `Assignment` persistida.
- Replacement resolve o esperado efetivo no momento da criação, mas não é recalculado na leitura.
- V1 possui somente `present`, `completed` e `cancelled`.
- V1 armazena chegada/saída no agregado, não eventos de ponto append-only.
- Origem é `manual`, `app` ou `integration`, com referência opaca quando externa.
- Duplicidade é idempotente; divergência é conflito explícito.
- Supervisor é o principal operador; HR lê; Recruiter e Administrative não acessam inicialmente.
- A visão do Supervisor é uma projeção, não uma nova fonte de verdade.
- Tudo que for trabalhista, antifraude, não escalado ou multi-evento fica fora da V1.
