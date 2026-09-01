# Pulsa Platform — Architecture

Status: Draft v0.3

---

## Architecture Style

Modular monolith.

A aplicação utiliza Next.js como camada web/aplicação e PostgreSQL/Supabase como plataforma de persistência.

A arquitetura deve ser simples o suficiente para um desenvolvedor solo, mas preservar limites de domínio.

---

## Stack

- Next.js
- TypeScript
- Tailwind CSS
- shadcn/ui
- PostgreSQL
- Supabase
- Supabase Auth
- Supabase Storage
- Vercel
- GitHub
- Zod
- Vitest
- Playwright
- Sentry

---

## Main Architecture

UI  
↓  
Application Services  
↓  
Domain Rules  
↓  
Repositories  
↓  
PostgreSQL

UI components must not contain business rules.

Direct database access from UI components is prohibited.

---

## Module Structure

```txt
src/
  app/
  components/
    ui/
    shared/
  modules/
    auth/
    organizations/
    clients/
    contracts/
    operations/
    units/
    positions/
    workers/
    assignments/
    scheduling/
    attendance/
    occurrences/
    performance/
  shared/
    auth/
    db/
    errors/
    logging/
    validation/
```

Cada módulo deve preferencialmente possuir:

```txt
module/
  components/
  domain/
  services/
  repositories/
  schemas/
  types/
  index.ts
```

Módulos devem expor APIs públicas pelo `index.ts`.

Imports internos entre módulos devem ser evitados.

Não criar abstrações genéricas antes de existirem pelo menos dois casos reais de uso.

---

## Architecture Principles

1. Domain first.
2. Modular monolith.
3. PostgreSQL as source of truth.
4. Explicit business rules.
5. Build the core, integrate the commodity.
6. Security by design.
7. Auditability.
8. Preserve operational history.
9. Avoid premature abstractions.
10. Architecture follows real Pulsa operations.
11. Prefer correctness over convenience in operational data.
12. Do not denormalize without a concrete reason.

---

## Organization vs Client

Organization representa o proprietário dos dados.

Inicialmente, a única organização é a Pulsa.

Clients são empresas atendidas pela Pulsa e não são tenants.

Não modelar cada cliente como organization.

Portal futuro de clientes será resolvido com escopos de acesso específicos quando o requisito existir.

---

## Backend

Next.js fornece a camada inicial de backend/aplicação.

Operações de negócio devem passar por services.

Exemplos:

- createClient()
- createContract()
- createOperation()
- activateAssignment()
- registerAttendance()
- resolveOccurrence()

Server Actions e Route Handlers são adapters de entrada, não o local das regras de negócio.

---

## Transactions

Operações de domínio que exigem múltiplas mutações devem ser atômicas.

Princípio:

```txt
business mutation
+ domain event
+ audit event
= same transaction
```

A estratégia técnica concreta para transações será escolhida durante Foundation.

Opções aceitáveis incluem:

- PostgreSQL functions/RPCs para operações críticas;
- conexão server-side capaz de transações explícitas.

Não simular transação com múltiplas chamadas independentes ao banco.

---

## Database

PostgreSQL é a fonte autoritativa dos dados operacionais.

Core deve ser relacional.

JSON é permitido apenas para metadados genuinamente variáveis, como payloads de auditoria.

IDs deriváveis pela hierarquia não devem ser duplicados apenas para conveniência.

---

## Authentication

Supabase Auth fornece autenticação.

Identidade de autenticação e identidade da aplicação são separadas.

```txt
auth.users
↓
profiles
↓
organization_members
↓
roles / permissions
```

---

## Authorization

Usar permissions centralizadas.

Evitar checks espalhados como:

```ts
if (role === 'SUPERVISOR')
```

Roles iniciais:

- DIRECTOR
- OPERATIONS_MANAGER
- SUPERVISOR
- HR
- RECRUITER
- ADMINISTRATIVE

Permissões serão mapeadas explicitamente em `CODING_RULES.md`/schema de autorização.

---

## Initial Permission Matrix

Legenda:

- C = create
- R = read
- U = update
- D = destructive transition/administrative removal

| Domain | DIRECTOR | OPERATIONS_MANAGER | SUPERVISOR | HR | RECRUITER | ADMINISTRATIVE |
|---|---|---|---|---|---|---|
| Clients | CRUD | CRUD | R | R | R | R |
| Contracts | CRUD | CRUD | R | R | R | R |
| Operations | CRUD | CRUD | R | R | R | R |
| Units/Positions | CRUD | CRUD | R/U | R | R | R |
| Workers | CRUD | R | R | CRUD | R | R |
| Assignments | CRUD | CRUD | R | R/U | R | R |
| Shifts | CRUD | CRUD | CRU | R | R | R |
| Attendance | CRUD | R/U | CRU | R/U | R | R |
| Occurrences | CRUD | CRU | CRU | R | R | R |

Essa matriz é inicial e deve ser revisada quando a operação real definir responsabilidades.

---

## RLS

RLS deve proteger dados organizacionais.

RLS responde principalmente:

**este usuário pode acessar esta linha?**

Regras de negócio não devem ser implementadas principalmente em policies.

Não construir abstração de client portal antes do requisito real.

Policies devem ser mantidas simples, explícitas e testáveis.

---

## Domain Events

Fatos de negócio relevantes são registrados em `domain_events`.

O registro deve ocorrer dentro da mesma transação da mutação correspondente.

Não usar triggers de banco para representar semântica de domínio por padrão.

Não usar brokers externos no MVP.

---

## Audit

Mutações críticas devem gerar audit events.

Formato mínimo de metadata:

```json
{
  "previous_state": {},
  "new_state": {},
  "changes": []
}
```

Audit responde quem/quando/o quê.

Domain Event responde o que aconteceu no negócio.

---

## Concurrency

Primeira linha de defesa:

- foreign keys;
- unique constraints;
- check constraints;
- transações.

Optimistic locking com `version` será usado apenas em entidades que demonstrem necessidade real de edição concorrente.

Não usar `updated_at` como version token por padrão.

---

## Deletion Strategy

Entidades operacionais preservam histórico.

Fluxo normal usa status, não hard delete.

Para dados pessoais, arquitetura deve permitir anonimização futura sem quebrar referências.

Não adicionar `deleted_at` indiscriminadamente.

---

## Time

Timestamps persistidos em UTC.

Unidades podem possuir timezone local para apresentação e regras operacionais.

---

## Security

- least privilege;
- no service role in browser;
- private storage by default;
- signed document access when document module exists;
- environment-based secrets;
- server-side validation;
- audit trail;
- LGPD-oriented data minimization;
- no real PII in seed data;
- authorization checks in server/application layer.

---

## Testing

Prioridades:

1. domain rules;
2. application services;
3. authorization;
4. critical end-to-end workflows.

Coverage percentage is not a primary success metric.

---

## Deployment

```txt
feature branch
↓
pull request
↓
CI
↓
Vercel Preview
↓
merge main
↓
production
```

Production changes originate from version-controlled code.

Codex/AI must not directly modify production environments.

---

## CI Minimum

- lint
- typecheck
- unit tests
- build

E2E may run separately where appropriate.

---

## Observability

MVP:

- structured server logs;
- Sentry;
- audit_events;
- actionable errors.

Não construir observability stack própria.

---

## Long-running Jobs

Next.js remains the backend for the MVP.

If long-running jobs emerge, evaluate a dedicated worker/Edge Function only when there is a concrete workload.

Do not implement background infrastructure preemptively.

---

## Non-goals

Initial architecture does not include:

- microservices;
- Kubernetes;
- Kafka;
- dedicated backend;
- native mobile app;
- event sourcing;
- GraphQL;
- AI features;
- workflow engine;
- custom payroll;
- custom time-clock system.


---

## Integration Boundaries

The platform should own Pulsa-specific operational context and integrate commodity/specialized capabilities.

Likely future integration boundaries include:

- formal time tracking / point system;
- payroll;
- recruitment/admission tooling where appropriate;
- document/signature providers;
- multichannel communication;
- analytical BI.

Pulsa operational dashboards remain native when they are needed for real-time operational decisions.

A future client portal may expose controlled actions, not only read-only analytics. Authorization for those actions must be introduced only when the portal becomes a real product surface.

Do not implement these integrations during the MVP unless explicitly required.
