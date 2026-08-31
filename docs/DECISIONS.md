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
