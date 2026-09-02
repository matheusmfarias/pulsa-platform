# Pulsa Platform — Architecture Decisions

This file records significant technical/product decisions.

---

## ADR-001 — Modular monolith

**Status:** Accepted

Use a modular monolith for the initial product.

Reason:
One developer, early-stage domain, need for speed and changeability.

Rejected initially:
- microservices;
- Kubernetes;
- distributed messaging.

---

## ADR-002 — Next.js as application backend

**Status:** Accepted

Next.js will initially provide UI plus application/server entry points.

No dedicated backend service until a concrete need emerges.

---

## ADR-003 — PostgreSQL as source of truth

**Status:** Accepted

Core operational data remains relational in PostgreSQL.

JSON is reserved for genuinely flexible metadata.

---

## ADR-004 — Organization is not Client

**Status:** Accepted

Organization represents the data owner.

Initially Organization = Pulsa.

Clients are companies served by Pulsa and must not be modeled as tenants merely to anticipate a future portal.

---

## ADR-005 — Avoid redundant hierarchical IDs

**Status:** Accepted

Do not repeat `operation_id`, `unit_id`, etc. where they are unambiguously derivable from a canonical relationship unless a concrete performance/RLS requirement justifies it.

---

## ADR-006 — Scheduling uses ShiftPosition

**Status:** Accepted

A Shift cannot represent demand only as a total worker count.

Use:

Shift → ShiftPosition → ShiftAssignment

This allows demand and coverage by Position.

---

## ADR-007 — Scheduling requires operational discovery

**Status:** Accepted

Do not implement Scheduling until Pulsa's real scheduling/substitution rules are validated.

---

## ADR-008 — KPI values calculated on-demand in MVP

**Status:** Accepted

Do not persist generic KPI Measurement entities initially.

Use SQL queries/views.

Introduce snapshots/materialized views only when justified.

---

## ADR-009 — Domain events and audit are distinct

**Status:** Accepted

Domain events = business facts.

Audit events = actor/change trace.

Where part of one logical mutation, business mutation + event + audit must be atomic.

---

## ADR-010 — Operational records are not hard-deleted by default

**Status:** Accepted

Use lifecycle/status transitions.

Future LGPD anonymization must preserve referential integrity.

---

## ADR-011 — Permission-based authorization

**Status:** Accepted

Roles map to permissions.

Application code must not rely on scattered direct role checks.

---

## ADR-012 — Do not prebuild client access abstraction

**Status:** Accepted

RLS and authorization must remain evolvable, but client portal-specific access scope abstractions will be introduced only when that product surface exists.

---

## ADR-013 — No organization_id duplication in ShiftAssignment initially

**Status:** Accepted

Do not denormalize `organization_id` into ShiftAssignment merely for hypothetical RLS performance.

Revisit only with evidence.

---

## ADR-014 — Concurrency strategy

**Status:** Accepted

Use database constraints and transactions first.

Where optimistic locking becomes necessary, prefer explicit integer `version` over using `updated_at` as a version token.


---

## ADR-015 — Future client portal may contain actions

**Status:** Accepted

Pulsa Client is not assumed to be read-only.

Future client access may include controlled actions such as approvals, validations, requests or operational acknowledgements.

No client-specific authorization abstraction will be implemented until that portal becomes a concrete requirement.

---

## ADR-016 — Attendance is operational, not formal timekeeping

**Status:** Accepted

The MVP Attendance model records operational presence/execution.

It is not assumed to be the legal/formal source of truth for payroll timekeeping.

Future integration with a formal point/time-tracking system must remain possible.

---

## ADR-017 — SLA model supports heterogeneous metric types

**Status:** Accepted

SLA definitions must be able to represent at least:

- percentage;
- quantity;
- duration.

This supports coverage targets, replacement deadlines, admission deadlines and implementation SLAs without forcing all SLAs into a single numeric percentage model.

---

## ADR-018 — Benchmark-derived domains remain backlog only

**Status:** Accepted

Benchmark analysis identified potential future domains including StaffingNeed, AdmissionProcess, TimeTrackingIntegration, Timesheet, ClientApproval, EmployeeRequest and NotificationIntegration.

These concepts must be documented but not implemented speculatively.

---

## ADR-019 — Transaction boundary with the Supabase Data API

**Status:** Accepted

The Supabase JavaScript client does not expose an explicit multi-statement transaction
boundary across independent Data API calls.

Foundation Core therefore does not introduce a transaction abstraction or emulate
atomicity with sequential requests. Critical implemented mutations write business data and the
audit event through purpose-specific PostgreSQL RPCs. Domain events remain future capability;
a direct server-side PostgreSQL connection may be evaluated if a concrete workload justifies it.

---

## ADR-020 — Internal RBAC boundary

**Status:** Accepted

Each active `organization_members` row has exactly one internal role. The role-to-permission
matrix is defined centrally in TypeScript using `entity:action` permissions, and application
services enforce permissions before repository access.

PostgreSQL RLS remains responsible primarily for organization isolation and active membership.
For critical mutations, the same permission matrix is enforced by RBAC-protected public RPC
wrappers; private implementations are not directly executable by `authenticated` or `anon`.

---

## ADR-021 — Atomic append-only business audit

**Status:** Accepted

Existing business mutations are executed by small entity-specific PostgreSQL functions.
Each function changes the business row and appends its `audit_events` row in the same
transaction. Authenticated clients cannot bypass these functions with direct writes to the
audited business tables, and they receive no direct privileges on `audit_events`.

Audit metadata stores changed field names and only the minimum safe before/after state.
Worker PII values are never copied into metadata. Generic audit triggers, Domain Events and
an audit UI remain outside this decision.

---

## ADR-022 — Minimum temporal protection for Assignments

**Status:** Accepted

A new Assignment requires an active Worker and an active Position in the same Organization.
For the same Worker, date ranges are mutually exclusive while Assignments are `pending` or
`active`; both boundary dates are inclusive. PostgreSQL enforces this invariant with an
exclusion constraint so concurrent writes cannot bypass it.

This decision does not restrict simultaneous relationships by Unit or Operation. Those rules
remain behind the Operational Discovery gate. The current RBAC matrix gives SUPERVISOR read
access only, following the Assignments phase definition.

---

## ADR-023 — JobRole is separate from Position

**Status:** Accepted

JobRole is the reusable organizational cargo/function catalog. Position is the concrete
operational posto in a Unit and references a required JobRole. Position no longer owns a `title`;
JobRole.name is the source of truth and can be reused by multiple Positions.

---

## ADR-024 — Structural context freezes after Assignment history

**Status:** Accepted

After Assignment history exists, Position cannot move Unit or JobRole; Unit cannot move
Operation; Operation cannot move Contract; and Contract cannot move Client. The intended change
is to close/inactivate the prior structure and create a new record in the new context.

---

## ADR-025 — Current application context is exactly one active Organization

**Status:** Accepted for the current phase

The application requires exactly one active organization membership. Zero memberships fail and
multiple active memberships produce an explicit conflict. A multi-organization selector remains
an open future product decision.

---

## ADR-026 — Real integration tests fail closed

**Status:** Accepted

Real integration tests require explicit `SUPABASE_TEST_*` credentials plus
`SUPABASE_TEST_CONFIRMATION=integration-test`. They never infer a linked Supabase project, read
`.temp/project-ref`, recover service-role credentials through the CLI, or fall back to `.env`.

---

## ADR-027 — Administração inicial é DIRECTOR-only com permissions explícitas

**Status:** Accepted

A Fase 3 expõe memberships e auditoria somente a `DIRECTOR`, através de
`organization_member:read`, `organization_member:update` e `audit:read`. A matriz continua fixa e
sincronizada em TypeScript/PostgreSQL; não existe cadastro ou edição granular de permissions.

Role/status de membership são alterados pela RPC auditada existente, agora protegida pela matriz
RBAC e por lock transacional da Organization. A transação rejeita rebaixar ou inativar o último
`DIRECTOR` ativo. Auditoria é lida com RLS organizacional, sem service-role na aplicação.

E-mails de outros usuários ficam fora da Foundation administrativa: não há acesso apropriado a
`auth.users` com as credenciais normais do backend e nenhuma service-role foi adicionada.
