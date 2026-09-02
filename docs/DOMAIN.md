# Pulsa Platform
## Domain Model

Status: Draft v0.3

---

# 1. Princípios

O domínio da aplicação deve representar uma empresa que administra operações intensivas em pessoas.

O sistema não deve tratar tudo como simples cadastro.

As entidades existem dentro de relações operacionais e possuem ciclo de vida próprio.

Princípios:

1. Preservar histórico operacional.
2. Evitar denormalização sem necessidade comprovada.
3. Regras críticas devem ser explícitas.
4. Banco deve impedir estados estruturalmente inválidos sempre que possível.
5. Regras operacionais ainda desconhecidas devem permanecer como OPEN QUESTIONS.

---

# 2. Hierarquia operacional

Organization
├── JobRole
├── Client
│   └── Contract
│       └── Operation
│           └── Unit
│               └── Position
│                   └── Assignment
└── Worker

A hierarquia representa contexto organizacional.

Escalas, presença, ocorrências e indicadores se relacionam com diferentes níveis dessa estrutura.

---

# 3. Entidades principais

## Organization

Representa a organização proprietária da plataforma.

Inicialmente:

Pulsa.

Campos conceituais:

- id
- legal_name
- trade_name
- status
- created_at
- updated_at

O sistema deve manter a noção de organização proprietária, ainda que inicialmente exista apenas a Pulsa.

---

## Client

Empresa atendida pela Pulsa.

Campos:

- id
- organization_id
- legal_name
- trade_name
- document_number
- status
- created_at
- updated_at

Status inicial:

- active
- inactive

O funil comercial não faz parte do core inicialmente. Portanto, `prospect` não pertence ao domínio v0.2.

---

## Contract

Representa o vínculo comercial que permite a existência de uma ou mais operações.

Campos:

- id
- client_id
- name
- start_date
- end_date
- status
- external_reference
- created_at
- updated_at

Status:

- draft
- active
- suspended
- ended
- cancelled

Um contrato pertence a um cliente e pode possuir várias operações.

---

## Operation

Representa uma operação administrada pela Pulsa para um cliente.

Campos:

- id
- contract_id
- name
- description
- start_date
- end_date
- status
- manager_user_id
- created_at
- updated_at

Status:

- planning
- implementation
- active
- suspended
- closing
- closed

`client_id` não é repetido em Operation porque é derivável de Contract.

Quando informado em create/update, `manager_user_id` aponta para um usuário/profile com
membership ativa na mesma Organization da Operation. Não há workflow adicional de gestor
implementado nesta fase.

---

## Unit

Local físico ou unidade lógica pertencente a uma operação.

Exemplos:

- loja;
- supermercado;
- centro de distribuição;
- fábrica;
- evento;
- região operacional.

Campos:

- id
- operation_id
- name
- code
- address
- city
- state
- timezone
- status
- created_at
- updated_at

Timestamps devem ser persistidos em UTC. `timezone` existe para interpretação/apresentação local.

---

## JobRole (Cargo)

Catálogo organizacional reutilizável de cargos/funções. Pertence à Organization, não a um
Client, Contract, Operation ou Unit.

Campos:

- id
- organization_id
- name
- description
- status
- created_at
- updated_at

Um JobRole pode ser reutilizado por vários Positions. `name` é a fonte de verdade do nome do
cargo.

## Position (Posto)

Necessidade estrutural concreta de trabalho dentro de uma Unit. Não representa uma pessoa e
exige um JobRole.

Campos:

- id
- unit_id
- job_role_id
- description
- base_required_headcount
- status
- created_at
- updated_at

Status:

- active
- inactive

Position não possui `title` próprio; o nome do cargo é derivado de JobRole.

`base_required_headcount` representa necessidade estrutural/base e não substitui escala,
turno ou cobertura.

---

## Worker

Pessoa que pode ser alocada em uma operação.

Campos iniciais:

- id
- organization_id
- full_name
- document_number
- email
- phone
- status
- engagement_start_date
- engagement_end_date
- created_at
- updated_at

Status:

- onboarding
- active
- inactive
- terminated

Observação:

`Worker` não deve ser tratado como sinônimo definitivo de empregado CLT. A natureza do vínculo poderá futuramente exigir uma entidade específica de relação de trabalho.

Dados pessoais devem receber tratamento compatível com LGPD.

---

## Assignment

Representa a relação temporal entre Worker e Position.

Campos:

- id
- worker_id
- position_id
- start_date
- end_date
- status
- created_at
- updated_at

Status:

- pending
- active
- suspended
- finished
- cancelled

Não repetir `unit_id` ou `operation_id`, pois são derivados de Position.

Assignments preservam histórico e não devem ser sobrescritos.

### Histórico operacional implementado

Enquanto não existe Assignment descendente, relações estruturais continuam corrigíveis. Após
existir histórico de Assignment:

- Position não pode mudar de Unit nem de JobRole;
- Unit não pode mudar de Operation;
- Operation não pode mudar de Contract;
- Contract não pode mudar de Client.

Para Assignment, `pending` permite corrigir worker, position, start_date e end_date conforme
as validações existentes. Em `active` ou `suspended`, worker, position e start_date ficam
imutáveis, mas end_date pode ser ajustada. Em `finished` ou `cancelled`, contexto e período não
podem ser reescritos.

---

# 4. Scheduling (planejado)

Scheduling possui gate de discovery operacional.

Sua modelagem conceitual inicial é:

Shift  
└── ShiftPosition  
    └── ShiftAssignment  
        └── Attendance

## Shift

Representa um período de trabalho planejado em uma unidade.

Campos conceituais:

- id
- unit_id
- start_at
- end_at
- status
- created_at
- updated_at

Status:

- planned
- open
- covered
- in_progress
- completed
- cancelled

---

## ShiftPosition

Representa a necessidade de determinada Position dentro de um Shift.

Campos:

- id
- shift_id
- position_id
- required_headcount
- created_at
- updated_at

Exemplo:

Turno manhã:
- 2 promotores
- 1 repositor

Isso deve resultar em dois ShiftPositions distintos.

---

## ShiftAssignment

Relaciona uma Assignment válida a uma necessidade de ShiftPosition.

Campos:

- id
- shift_position_id
- assignment_id
- status
- created_at
- updated_at

Status:

- scheduled
- confirmed
- absent
- replaced
- completed

Não duplicar `organization_id` inicialmente. O contexto é derivável pela cadeia relacional.

---

## Attendance

Registro de execução/presença operacional.

O MVP não deve tentar substituir um sistema formal de ponto.

Attendance is an operational representation and may later receive or reconcile data from a formal time-tracking/time-clock integration. The model must not assume that Attendance itself is the legal source of truth for payroll timekeeping.

Campos conceituais:

- id
- shift_assignment_id
- check_in_at
- check_out_at
- status
- source
- notes
- created_at
- updated_at

Status:

- expected
- present
- late
- absent
- excused_absence

---

# 5. Occurrence

Registra exceções ou problemas operacionais.

Exemplos:

- falta;
- atraso;
- acidente;
- problema na unidade;
- reclamação;
- falha de execução;
- comportamento;
- substituição;
- incidente operacional.

Campos:

- id
- operation_id
- unit_id nullable
- worker_id nullable
- type
- severity
- status
- description
- opened_at
- resolved_at
- created_by
- created_at
- updated_at

Status:

- open
- in_progress
- resolved
- cancelled

Severity:

- low
- medium
- high
- critical

---

# 6. Performance

## KPI Definition

Define uma métrica.

Campos:

- id
- organization_id
- code
- name
- description
- unit
- calculation_method
- active

No MVP, valores de KPI não são persistidos como entidade de domínio.

Eles devem ser calculados on-demand via queries SQL ou views.

Snapshots/materializações só serão introduzidos quando houver requisito real de performance ou histórico.

---

## SLA Definition

Define compromisso mensurável associado a contrato ou operação.

SLAs may represent different metric families, including:

- percentage;
- quantity;
- duration.

Examples:

- coverage >= 98%;
- replacement completed within 5 business days;
- admission completed within 1 business day;
- implementation completed within 20 calendar days.

Campos:

- id
- contract_id
- operation_id nullable
- name
- metric_type
- target_value
- target_unit
- measurement_method
- active

`metric_type` and `target_unit` must be explicit enough to support percentages, quantities and durations without encoding business meaning in free-form text only.

---

# 7. Domain Events (planejado)

Eventos representam uma capacidade futura para fatos relevantes de negócio. A tabela
`domain_events` não faz parte da Foundation implementada atualmente.

Exemplos:

- client.created
- contract.activated
- operation.created
- operation.activated
- position.created
- position.headcount_changed
- worker.created
- worker.activated
- worker.terminated
- assignment.created
- assignment.activated
- assignment.finished
- shift.created
- shift.uncovered
- shift.covered
- shift.completed
- attendance.present
- attendance.absent
- attendance.late
- occurrence.opened
- occurrence.resolved
- sla.at_risk
- sla.breached

Quando implementados, eventos de domínio devem ser registrados na mesma transação da mutação de
negócio que os originou.

Não usar Kafka, RabbitMQ ou event sourcing no MVP.

---

# 8. Auditoria

`audit_events` existe e é usado nas mutações críticas implementadas. Registra ator,
organização, entidade, ação e metadata.

Entidade sugerida:

audit_events

Campos:

- id
- organization_id
- actor_user_id
- entity_type
- entity_id
- action
- metadata
- created_at

Updates usam previous/new state e changes pelo helper de auditoria. Em criações, a metadata pode
ser parcial conforme a função de mutação. O formato abaixo é o objetivo mínimo arquitetural, não
uma garantia de metadata completa em todos os casos atuais:

```json
{
  "previous_state": {},
  "new_state": {},
  "changes": []
}
```

Auditoria e Domain Events possuem propósitos diferentes.

---

# 9. Exclusão e histórico

Entidades operacionais não devem ser hard-deleted como fluxo normal.

Preferir transições de estado:

- active → inactive
- active → closed
- active → terminated

Dados pessoais sujeitos à LGPD devem permitir anonimização futura sem destruir integridade referencial.

`deleted_at` não deve ser adicionado indiscriminadamente em todas as tabelas.

---

# 10. Concorrência

A concorrência deve ser tratada principalmente por invariantes e constraints no banco.

Para entidades de edição simultânea real, poderá ser usado optimistic locking com campo `version`.

Não usar `updated_at` como token de concorrência por padrão.

Não adicionar `version` em todas as tabelas sem necessidade.

---

# 11. Regras iniciais

### R01
Um Contract pertence a exatamente um Client.

### R02
Uma Operation pertence a exatamente um Contract.

### R03
Uma Unit pertence a uma Operation.

### R04
Uma Position pertence a uma Unit.

### R05
Um Worker não possui Position diretamente. A relação ocorre por Assignment.

### R06
Assignments preservam histórico.

### R07
Escala planejada não equivale a presença confirmada.

### R08
Ausência deve ser registrada como fato operacional.

### R09
Indicadores devem ser derivados dos dados operacionais sempre que possível.

### R10
Regras relevantes devem ser garantidas no backend e/ou banco, não exclusivamente no frontend.

### R11
Mutações críticas e seus audit events participam da mesma transação. Domain events permanecem
planejados.

### R12
IDs deriváveis pela hierarquia não devem ser duplicados sem necessidade comprovada.

---

# 12. Regras de propagação de status — provisórias

Estas regras serão refinadas conforme o domínio real amadurecer:

- Client inactive → não permite novos contratos/operações ativas.
- Contract suspended → operações não podem avançar normalmente sem decisão explícita.
- Operation closed → não permite novos assignments ou shifts.
- Worker terminated → não permite novos assignments e exige encerramento dos vínculos ativos.

Não implementar cascatas destrutivas automáticas sem regra explícita de negócio.

---

# 13. OPEN QUESTIONS

Antes de Scheduling:

1. Escalas são fixas ou variáveis?
2. São modeladas por horário, turno ou dia?
3. Um worker pode trabalhar em múltiplas unidades na mesma semana?
4. Um worker pode estar em múltiplas operações simultaneamente?
5. Como funciona substituição?
6. Existe pool de reserva/folguistas?
7. A escala é definida pela Pulsa ou recebida do cliente?
8. Existe recorrência de escala?
9. Como funcionam intervalos?
10. Controle será apenas operacional ou também formal de jornada?
11. Qual a definição de cobertura?
12. Qual a definição de absenteísmo?
13. Quais SLAs serão efetivamente contratados?
14. Como temporários e intermitentes diferem no domínio?
15. Supervisor responde por unidade, operação ou região?
16. Quais integrações trabalhistas serão necessárias?
17. Quais documentos pertencem à pessoa, vínculo, operação ou alocação?


---

# 14. Future domain candidates

These concepts are intentionally documented without implementation:

## StaffingNeed

Represents a dynamic need to fill capacity caused by:

- expansion;
- termination;
- long absence;
- new operation;
- substitution;
- seasonality.

Do not implement until the relationship with Position, Assignment and Recruitment is validated.

## AdmissionProcess

Potential future workflow between approved candidate and active Worker.

May include documents, ASO, contract formalization and onboarding.

Do not collapse this prematurely into Worker status transitions.

## TimeTrackingIntegration

Potential integration boundary with a formal point/timekeeping provider.

Pulsa Attendance remains operational unless a future decision changes that responsibility.

## Timesheet

Potential future representation of formalized worked time and adjustments.

Out of MVP.

## ClientApproval

Potential future action model for clients to approve operational items such as adjustments, exceptions or validations.

Important: a future client portal may include actions, not only read-only dashboards.

## EmployeeRequest

Potential future workflow for worker requests such as documents, corrections or absence-related submissions.

## NotificationIntegration

Potential future integration boundary for WhatsApp, email, multichannel service or automation providers.

Domain events should remain suitable as triggers for these integrations.
