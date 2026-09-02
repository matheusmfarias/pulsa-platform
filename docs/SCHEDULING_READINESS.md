# Scheduling Readiness

Status: technical reconnaissance only. This document records the current foundation and decisions that must await operational discovery; it is not a Scheduling specification.

## Current state

- `Worker` is a person eligible for operational work. It has status and optional `engagement_start_date` / `engagement_end_date`, but no employment-engagement modality or availability model. It does not imply a traditional employment relationship, and no current rule makes attendance mandatory.
- `Assignment` is the dated structural relationship between a Worker and a Position. It has `start_date`, optional `end_date`, and lifecycle statuses `pending`, `active`, `suspended`, `finished`, and `cancelled`.
- A PostgreSQL exclusion constraint prevents overlapping `pending` or `active` Assignments for the same Worker. This protects structural allocation, not intraday work scheduling.
- `Position.base_required_headcount` and the existing occupancy metrics compare structural demand with active Assignments. They do not represent demand by time, planned work, presence, or temporal coverage.
- `Operation` is bounded by Contract dates and has an operational lifecycle. `Unit` belongs to an Operation, has its own active/inactive status, and stores a required IANA timezone validated by the application. There are no Units without a timezone in the current schema.

## Boundaries to preserve

- Assignment answers: **where and in which Position is this person operationally linked?**
- A future Schedule must answer: **when is this person planned to work?**
- Scheduling must not reinterpret structural headcount or active Assignments as coverage/presence.
- Operational timestamps must be stored in UTC and interpreted through the Unit timezone; a global application timezone is insufficient.
- Existing history rules are a minimum baseline: active/suspended Assignments cannot have Worker, Position, or start date rewritten; finished/cancelled Assignments cannot have context or period rewritten. Structural ancestry is likewise frozen after Assignment history.

## Authorization and audit baseline

Critical domain writes currently follow:

```text
Server Action → service requirePermission() → public RBAC-protected RPC
→ database authorization → mutation + audit event in one transaction
```

DIRECTOR and OPERATIONS_MANAGER currently have the broadest operational mutation access. SUPERVISOR currently reads Workers and Assignments but does not create or update Assignments; HR can update Assignments. The future read, edit, publish, and approval responsibilities for Scheduling remain product decisions. Future Scheduling reads must keep organization-scoped RLS, and mutations must extend the same audited RPC pattern rather than use direct DML.

## Schema-affecting gaps awaiting discovery

1. Worker engagement modality is not modeled, so CLT, temporary, intermittent, and provider/MEI scenarios cannot be distinguished.
2. Availability and eligibility for temporary work are not modeled.
3. The unit of scheduling (day, shift, or exact interval) is undecided.
4. Scheduling validity, recurrence, exceptions, and overnight behavior are undecided.
5. The relationship between a temporary placement and the current Assignment overlap invariant is undecided.
6. Temporal headcount demand by Unit/Position is not modeled.
7. Publication, approval, worker acknowledgement, and post-publication revision policy are undecided.
8. The conflict model for a Worker across units and operations is undecided.
9. Interval/break rules and their applicability by engagement modality are undecided.
10. The external timekeeping source and its relationship to future operational presence are undecided.

## Risks

- **Critical:** collapsing Schedule into Assignment and losing the structural/temporal distinction.
- **Critical:** silently rewriting published or historical schedules.
- **High:** using only local time or a global timezone, especially for overnight work and timezone changes.
- **High:** treating the Assignment exclusion constraint as the final conflict model for intraday schedules or temporary placement.
- **High:** hardcoding employment-law or attendance rules for every Worker.
- **High:** modeling recurrence before validity, exceptions, publication, and conflict rules are settled.
- **Medium:** using `base_required_headcount` as hourly demand or coverage.
- **Medium:** persisting coverage or KPI values that should be derived from source facts.
- **Medium:** introducing generic operational settings before concrete varying rules are validated.

## Decisions awaiting discovery

The next implementation must wait for operational decisions on period/recurrence, scale-by-position versus scale-by-person, time-varying demand, temporary cross-operation work, availability, authorship/approval/publication, revision history, intervals, and conflict rules. No Scheduling entity, schema, permission, UI, or migration is introduced by this document.
