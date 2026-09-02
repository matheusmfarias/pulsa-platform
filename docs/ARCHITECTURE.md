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
    authorization/
    organizations/
    clients/
    contracts/
    operations/
    units/
    job-roles/
    positions/
    workers/
    assignments/
    overview/
    administration/
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

Server Actions e Route Handlers são adapters de entrada, não o local das regras de negócio.

---

## Transactions

Operações de domínio que exigem múltiplas mutações devem ser atômicas.

Princípio:

```txt
business mutation
+ audit event
= same transaction
```

Na Foundation implementada, mutações críticas usam funções PostgreSQL/RPC específicas por
entidade. Domain events são uma capacidade planejada e não integram esse caminho atual.

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

O fluxo de aplicação exige exatamente uma membership ativa: zero memberships gera erro e mais
de uma gera conflito explícito. Não há seletor multi-org nesta fase; isso não define uma
limitação permanente do produto.

---

## Authorization

Permissions são centralizadas em `permissions.ts`, e os services usam `requirePermission()`
antes do acesso aos repositórios.

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

No banco, mutações passam por RPCs públicas protegidas por RBAC. A matriz de permissions também
é aplicada no PostgreSQL; implementações críticas ficam no schema `private`, sem execução direta
por `authenticated` ou `anon`. INSERT/UPDATE/DELETE diretos das entidades de domínio protegidas
são bloqueados para esses papéis. A mutação e o audit ocorrem no mesmo caminho transacional.

Autorização apenas na aplicação não é suficiente.

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
| Job Roles | CRUD | CRUD | R | R | R | R |
| Units/Positions | CRUD | CRUD | R/U | R | R | R |
| Workers | CRUD | R | R | CRUD | R | R |
| Assignments | CRUD | CRUD | R | R/U | R | R |
| Administration (memberships/audit) | R/U | - | - | - | - | - |

Essa matriz é inicial e deve ser revisada quando a operação real definir responsabilidades.

A superfície administrativa inicial usa as permissions explícitas
`organization_member:read`, `organization_member:update` e `audit:read`, concedidas somente a
`DIRECTOR`. Não existe editor de permissions, custom roles ou modelo IAM dinâmico.

---

## RLS

RLS protege principalmente isolamento organizacional e leitura de linhas.

RLS responde principalmente:

**este usuário pode acessar esta linha?**

Permission de mutação também é enforced no banco por wrappers RPC; RLS não é a única barreira de
autorização. Regras de negócio não devem ser implementadas principalmente em policies.

Não construir abstração de client portal antes do requisito real.

Policies devem ser mantidas simples, explícitas e testáveis.

---

## Domain Events (planned)

`domain_events` não está implementado na Foundation atual. Continua como capacidade futura para
fatos de negócio e possíveis integrações; não há tabela, publicação ou broker em uso.

---

## Audit

`audit_events` existe e é produzido nas mutações críticas implementadas. Cada registro contém
ator, organização, entidade, ação e metadata; updates usam estados anterior/novo e campos
alterados quando aplicável. Criações podem conter metadata parcial conforme a função RPC.

Formato mínimo de metadata:

```json
{
  "previous_state": {},
  "new_state": {},
  "changes": []
}
```

Audit responde quem/quando/o quê. Domain Events continuam uma intenção futura, distinta do audit.

A leitura administrativa de `audit_events` usa `audit:read` e RLS por Organization. A aplicação
não usa service-role para consultar auditoria. Mudanças de role/status de memberships passam por
RPC auditada e preservam pelo menos um `DIRECTOR` ativo por Organization.

---

## Visão geral operacional

A home autenticada apresenta KPIs derivados de Operations, Units, Workers, Assignments e
Positions ativos, além de efetivo base. Ocupação considera somente `Assignment.status = active`.
Os alertas atuais são Worker ativo sem Assignment ativa e Position abaixo de
`base_required_headcount`; vacancy/coverage não são persistidos.

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
