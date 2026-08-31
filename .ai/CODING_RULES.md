# Pulsa Platform — Coding Rules

Status: v0.2  
Audience: human developers and AI coding agents

These rules are mandatory unless a documented architecture decision explicitly changes them.

---

## 1. General Rule

Do not optimize for amount of code produced.

Optimize for:

1. correctness;
2. maintainability;
3. domain clarity;
4. security;
5. small reviewable changes.

---

## 2. Scope Discipline

Implement only the requested phase.

Do not:

- add unrelated features;
- redesign neighboring modules;
- create speculative abstractions;
- add packages without necessity;
- add AI features;
- build future client/worker portals early.

If a useful improvement is outside scope, report it as a recommendation instead of implementing it.

---

## 3. Domain First

Business terminology must match `DOMAIN.md`.

Do not invent synonyms for domain concepts.

Examples:

Use `Assignment`, not random alternatives such as `Placement` or `AllocationRecord`, unless the domain documentation is changed first.

Use `Position` for structural work need.

Use `Worker` for the person eligible for assignment.

---

## 4. Layering

Required flow:

```txt
UI / route adapter
↓
application service
↓
domain rules
↓
repository
↓
database
```

Forbidden:

- business rules inside React components;
- direct Supabase mutations inside UI components;
- permission logic scattered across components;
- database rules duplicated in frontend-only code.

Server Actions and Route Handlers are adapters.

They validate transport/input context and call application services.

---

## 5. Module Boundaries

Each business module lives under:

```txt
src/modules/<module>
```

Preferred structure:

```txt
components/
domain/
services/
repositories/
schemas/
types/
index.ts
```

A module exposes its public surface through `index.ts`.

Avoid importing another module's internal repository/domain files.

If cross-module coordination is needed, prefer calling an exported service or shared domain contract.

---

## 6. TypeScript

- strict mode required;
- no `any` unless justified in code comment;
- prefer discriminated unions for domain states when useful;
- prefer explicit return types on exported services;
- avoid unsafe casts;
- do not silence TypeScript errors with `as unknown as`.

---

## 7. Validation

Use Zod at system boundaries.

Validate:

- form submissions;
- route payloads;
- query parameters;
- external integrations;
- data crossing trust boundaries.

Frontend validation improves UX but is not security.

Server/application layer must validate independently.

---

## 8. Database

PostgreSQL is source of truth.

Always use:

- foreign keys;
- NOT NULL where semantically required;
- unique constraints where invariants require them;
- check constraints for structural invariants.

Do not:

- store relational core as JSON;
- duplicate hierarchical IDs without reason;
- rely on frontend validation for integrity;
- hard-delete operational history by default.

Every schema change must be a migration.

Never edit production schema manually without migration.

---

## 9. Transactions

If a business operation performs multiple state changes that must succeed together, use one database transaction.

Expected atomic unit where applicable:

```txt
domain mutation
+ domain event
+ audit event
```

Do not implement pseudo-transactions using independent database calls.

If Supabase client limitations prevent proper atomicity, use an approved server-side/PostgreSQL transaction strategy.

---

## 10. Domain Events

Domain events represent business facts.

Naming:

```txt
entity.action
```

Examples:

- client.created
- assignment.activated
- attendance.absent
- occurrence.resolved

Events must be generated from application/domain operations, not UI actions.

Do not publish a domain event if the underlying business transaction fails.

---

## 11. Audit Events

Critical mutations must record:

- actor;
- entity;
- action;
- timestamp;
- previous_state where meaningful;
- new_state;
- changed fields.

Audit data is not a substitute for domain history where historical querying becomes a real business requirement.

---

## 12. Authorization

Do not scatter role comparisons.

Use centralized permission checks.

Preferred style:

```ts
requirePermission(context, 'assignment:update')
```

Avoid:

```ts
if (user.role === 'DIRECTOR') ...
```

except inside the central permission system.

Authorization must be checked server-side.

UI hiding is not authorization.

---

## 13. RLS

RLS protects row access.

Do not encode complex workflow/business rules primarily in RLS.

Policies must remain:

- minimal;
- understandable;
- testable.

Never expose service-role credentials to browser code.

---

## 14. Security

- secrets only in environment variables;
- no secrets committed;
- private storage by default;
- PII only when necessary;
- no real worker data in tests/seeds;
- sanitize/log carefully;
- do not log tokens, credentials, document numbers or sensitive PII.

---

## 15. Dates and Timezones

Persist timestamps in UTC.

Convert to local timezone only at application/presentation boundaries.

Units may define their timezone.

Never assume server timezone is the business timezone.

---

## 16. Deletion

Operational entities use lifecycle statuses.

Do not add generic delete buttons to operational records.

Hard delete requires explicit domain justification.

PII anonymization will be implemented when required by the worker lifecycle/LGPD flow.

---

## 17. Concurrency

Prefer database invariants and transactions first.

Use optimistic locking only where concurrent editing is a demonstrated risk.

When used, prefer explicit integer `version`.

Do not use `updated_at` as a concurrency token by default.

---

## 18. UI

The product is operational software, not a marketing page.

Prioritize:

- clarity;
- information hierarchy;
- responsiveness;
- fast feedback;
- accessible forms;
- meaningful loading/empty/error states.

Avoid:

- decorative gradients by default;
- excessive animations;
- visual noise;
- generic AI-dashboard aesthetics;
- sparkles or decorative AI metaphors.

Use shadcn/ui as a component foundation, not as a design substitute.

---

## 19. Error Handling

Domain/application errors should be explicit and typed where practical.

Differentiate:

- validation error;
- authorization error;
- not found;
- conflict;
- invariant violation;
- infrastructure failure.

Do not return raw database errors to the UI.

Log actionable infrastructure errors server-side.

---

## 20. Tests

Write tests primarily for:

- domain invariants;
- services;
- authorization;
- critical flows;
- regressions.

Do not write tests solely to inflate coverage.

Every bug fix with repeatable behavior should add a regression test when practical.

---

## 21. Dependencies

Before adding a dependency:

1. verify native/platform functionality;
2. verify existing dependency;
3. justify the package.

Do not add large libraries for small utilities.

Record significant dependency decisions in `DECISIONS.md`.

---

## 22. AI Agent Behavior

When an AI agent works on this repository:

1. read `PROJECT_CONTEXT.md`;
2. read `CODING_RULES.md`;
3. read the relevant docs/module before editing;
4. inspect existing patterns before creating new ones;
5. make the smallest coherent change;
6. run relevant validation/tests;
7. report what changed.

The agent must not invent unresolved domain rules.

If blocked by an OPEN QUESTION, stop and report it.

---

## 23. Required Completion Report

Every implementation phase must return:

1. Files created/changed
2. Database/schema changes
3. Business rules implemented
4. Tests executed and result
5. Architecture decisions made
6. Risks or open questions
7. Technical debt introduced
8. Explicitly not implemented

---

## 24. Definition of Done

A task is not done merely because the UI renders.

Where relevant, it must include:

- validation;
- authorization;
- data integrity;
- error handling;
- tests;
- migration;
- audit/event behavior;
- documentation update.

Only implement items that are part of the requested scope.


---

## 25. Future Domain Candidates

Do not create tables/modules for the following simply because they are documented:

- StaffingNeed
- AdmissionProcess
- TimeTrackingIntegration
- Timesheet
- ClientApproval
- EmployeeRequest
- NotificationIntegration

They are backlog/domain candidates only.

Implementation requires an explicit phase/task and validated operational requirement.
