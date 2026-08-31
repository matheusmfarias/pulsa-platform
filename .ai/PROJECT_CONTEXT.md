# Pulsa Platform — Project Context

Status: v0.2

This document is the compact context that AI coding agents must read before working on the Pulsa Platform.

---

## 1. What is Pulsa?

Pulsa is being created as a company focused on people, operations and performance.

Its intended positioning is not merely to supply labor.

Pulsa aims to assume operational responsibility, manage teams, supervise execution, monitor indicators and improve client performance.

Initial service portfolio includes areas such as:

- field marketing;
- temporary work;
- intermittent contracts;
- outsourcing;
- recruitment and selection;
- HR solutions.

The technology platform must support this operating model.

---

## 2. What is Pulsa Platform?

Pulsa Platform is intended to become the digital operating system of Pulsa.

It is not a generic ERP.

It should encode the operational method of the company and progressively connect:

```txt
Client
→ Contract
→ Operation
→ Unit
→ Position
→ Worker
→ Assignment
→ Scheduling
→ Attendance
→ Occurrence
→ Performance
```

---

## 3. Product Goal

Allow Pulsa to operate clients in a:

- standardized;
- traceable;
- measurable;
- scalable;
- data-oriented way.

Primary MVP success criterion:

A real Pulsa operation can be managed in the platform without a parallel spreadsheet being the main source of truth.

---

## 4. Core Product Principle

**Build the core. Integrate the commodity.**

Build Pulsa-specific operational intelligence.

Do not build generic or highly regulated systems if mature external tools should be integrated instead.

Examples of things NOT to build initially:

- payroll;
- accounting;
- invoicing;
- electronic signatures;
- generic CRM;
- formal time clock;
- full benefits management;
- chat;
- video calls.

---

## 5. Architecture

Architecture style:

**Modular monolith**

Stack:

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

Main dependency direction:

```txt
UI
↓
Application Services
↓
Domain Rules
↓
Repositories
↓
PostgreSQL
```

Direct database mutations from UI components are prohibited.

---

## 6. Organization Model

`Organization` is the owner of data.

Initially, Organization = Pulsa.

A `Client` is a company served by Pulsa.

Clients are NOT tenants/organizations.

Do not model each client as a separate organization.

Future client portal access will use specific access scopes when that feature exists.

---

## 7. Core Domain

### Client
Company served by Pulsa.

### Contract
Commercial relationship with a Client.

### Operation
Operational engagement managed under a Contract.

### Unit
Physical/logical location within an Operation.

### Position
Structural work need within a Unit.

### Worker
Person eligible to be assigned.

### Assignment
Temporal relationship between Worker and Position.

### Shift
Planned work period.

### ShiftPosition
Required Position/headcount inside a Shift.

### ShiftAssignment
Assignment scheduled into a ShiftPosition.

### Attendance
Operational record of expected/present/late/absent execution.

### Occurrence
Operational exception/problem.

---

## 8. Important Domain Rules

- Worker does not own `position_id`.
- Assignment preserves worker-position history.
- Position belongs to Unit.
- Unit belongs to Operation.
- Operation belongs to Contract.
- Contract belongs to Client.
- Avoid redundant hierarchical IDs.
- Shift must express demand by Position through ShiftPosition.
- Shift is not Attendance.
- Operational entities preserve history.
- KPIs are derived from source data in MVP.
- Business mutation + domain event + audit event must be atomic when part of one logical operation.

---

## 9. Scheduling Gate

DO NOT implement Scheduling from assumptions.

Before Scheduling, real Pulsa operating rules must be validated.

Open questions include:

- fixed vs variable schedules;
- hourly/shift/day granularity;
- multiple units per worker;
- multiple operations per worker;
- substitutions;
- reserve workers;
- recurring schedules;
- intervals;
- relationship with external time clock;
- definition of coverage;
- definition of absenteeism;
- supervision model;
- temporary/intermittent-specific behavior.

Foundation through Assignments may proceed before these answers.

---

## 10. MVP Order

```txt
0. Documentation & Architecture
1. Foundation Core
2. Clients
3. Contracts
4. Operations
5. Units + Positions
6. Workers
7. RBAC + Audit
8. Assignments
--- Operational Discovery Gate ---
9. Scheduling
10. Attendance
11. Occurrences
12. Dashboard
```

---

## 11. RBAC

Initial roles:

- DIRECTOR
- OPERATIONS_MANAGER
- SUPERVISOR
- HR
- RECRUITER
- ADMINISTRATIVE

Authorization is permission-based.

Do not scatter direct role comparisons in application code.

---

## 12. Data and Security

- PostgreSQL is source of truth.
- Use migrations for schema changes.
- Use constraints for invariants.
- Use RLS for row access/isolation.
- Business rules do not belong primarily in RLS.
- Service-role secrets never reach the browser.
- Storage private by default.
- Timestamps persisted in UTC.
- PII minimized.
- Never use real personal data in seeds/tests without explicit need and authorization.
- Operational history is not hard-deleted by default.
- Future LGPD anonymization must preserve referential integrity.

---

## 13. Domain Events and Audit

Domain Event:
Business fact.

Example:

```txt
assignment.activated
```

Audit Event:
Who changed what.

Example metadata:

```json
{
  "previous_state": { "status": "pending" },
  "new_state": { "status": "active" },
  "changes": ["status"]
}
```

These are separate concerns.

---

## 14. Product UI

Pulsa Platform is enterprise operational software.

Desired characteristics:

- clean;
- fast;
- reliable;
- information-dense when appropriate;
- responsive;
- accessible;
- explicit state/feedback.

Avoid generic AI-generated dashboard aesthetics and unnecessary decoration.

---

## 15. Development Philosophy

The project initially has one IT/development owner.

Therefore:

- keep architecture understandable;
- avoid microservices;
- avoid infrastructure without real demand;
- avoid premature abstractions;
- use managed services;
- favor reversible decisions;
- document significant decisions;
- make small reviewable changes.

---

## 16. AI Agent Contract

Before changing code, read:

1. PROJECT_CONTEXT.md
2. CODING_RULES.md
3. DOMAIN.md
4. ARCHITECTURE.md
5. the current phase requirements

Do not invent business rules.

When a requirement conflicts with documentation, report the conflict before implementing.

When a domain OPEN QUESTION blocks correct implementation, stop and ask for a decision.

After changes, provide the required completion report defined in CODING_RULES.md.


---

## 17. Future Domain Candidates

Do not implement these during the current MVP unless explicitly requested:

- StaffingNeed;
- AdmissionProcess;
- TimeTrackingIntegration;
- Timesheet;
- ClientApproval;
- EmployeeRequest;
- NotificationIntegration.

These exist to preserve architectural awareness without causing speculative code.

Attendance is currently operational and is not the formal payroll timekeeping source of truth.

A future client portal may support controlled actions, not just dashboard viewing.
