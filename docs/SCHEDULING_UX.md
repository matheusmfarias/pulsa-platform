# Scheduling UX — Foundation Readiness

Status: UX analysis only. This document proposes an interaction structure for future Scheduling; it does not define a domain model, lifecycle, permissions, or implementation scope.

## 1. Objective

Scheduling should help the backoffice answer one operational question: **who should be where and when?** It must reveal staffing need, planned people, gaps, conflicts, and publication state without becoming a personal-calendar interface.

The proposal follows the current Pulsa visual language: a wide operational content area, compact cards, explicit filters, tables/grids with horizontal overflow where necessary, badges for exceptional state, and detail views for investigation.

## 2. Principles

- Start from operational context: Operation and Unit before calendar decoration.
- Put exceptions before volume: gaps and conflicts are more important than an empty time grid.
- Keep structural data distinct from temporal data.
- Make state explicit, but treat draft, publication, acknowledgement, and acceptance as UX hypotheses until discovery confirms the domain.
- Use progressively disclosed detail: weekly overview first; side/detail context only when an item needs action.
- Do not make desktop density unusable on smaller screens.

## 3. Recommended primary view

The primary view should be a **weekly view by Position**, scoped first to an Operation and normally narrowed to a Unit. It maps directly to the operational question of whether each concrete posto has people planned on each day.

This view is recommended first because a supervisor manages operational demand by location/posto, while a Worker-focused view is better for investigating an individual conflict. It must show `base_required_headcount` only as a labelled structural reference, never as a claim of temporal coverage.

### Textual wireframe

```text
ESCALAS · SEMANA 14/09 → 20/09                         [Nova escala — futura]

[Operação: Apoio de loja ▼] [Unidade: Loja Aurora Centro ▼]
[Semana anterior] [Hoje] [Próxima semana]              [Status: Todos ▼]

Resumo operacional (hipóteses de UX)
[Postos com lacuna: 3] [Conflitos: 1] [Rascunho] [Publicada]

POSTO / REFERÊNCIA ESTRUTURAL   SEG          TER          QUA          QUI          SEX
Promotor de Vendas · base 4     2 planejados  3 planejados  4 planejados  4 planejados  3 planejados
                                ! lacuna 2    ! lacuna 1    Mariana      Mariana      ! lacuna 1
                                pessoas/turnos em detalhe ao abrir a célula

Repositor · base 2              Lucas        Lucas        Lucas        Lucas        Lucas
                                08–17        08–17        08–17        08–17        08–17

Supervisor Operacional · base 1 Renata       Renata       ! conflito   Renata       Renata
                                08–17        08–17        dois locais  08–17        08–17
```

Cells should show a short primary signal only: person(s), interval(s), or an exception. Selecting a cell opens contextual detail rather than expanding every row by default.

## 4. Secondary views

### Weekly view by Worker

Secondary investigation view for dispatchers and supervisors. Rows are Workers; cells summarize Unit, Position, and interval. It is the best place to understand a person's planned week and surface double-booking, but it should not replace the Position-first control view.

### Daily operational view

Focused single-day view, grouped by Unit and Position, with more room for intervals, people, exceptions, and an action queue. It is the likely day-of-operations view after a schedule exists.

### Unit-scoped view

Not a separate model: a persistent Unit filter/state applied to the primary weekly or daily views. The Unit detail page may eventually link into this context, but no route or link is proposed now.

## 5. Need versus planned work

The interface must name each layer so the user does not infer more than the data supports:

```text
Posto: Promotor de Vendas
Referência estrutural: base 3          ← current Position.base_required_headcount
Necessidade no período: a definir      ← future, only if the domain provides it
Pessoas planejadas: 2                  ← future Schedule result
Diferença: 1                           ← derived UI signal, when both inputs exist
```

Until period-specific demand exists, the UI may show the structural reference as context only and should not label a gap, coverage percentage, or "necessidade no período" as known fact.

## 6. Filters and navigation

Essential filters: **Operation, Unit, period/week, and status**. Unit should depend on the selected Operation. The period navigator is a first-class control, not a generic filter.

Secondary filters, initially collapsed or placed behind "Mais filtros": Position, JobRole, and Worker. This avoids an overloaded filter bar while supporting troubleshooting.

An active-filter summary and a clear reset action are important because the grid must always make its scope obvious.

## 7. States, conflicts, and exceptions

The following are visual hypotheses, not confirmed domain statuses:

| Signal | Proposed treatment | Purpose |
| --- | --- | --- |
| Draft | Neutral badge and a persistent scope banner | Makes non-official work unmistakable. |
| Published | Positive/strong badge with publication context | Identifies the official operational reference. |
| Changed after publication | Badge plus concise change marker in the affected cell | Directs attention without rewriting history invisibly. |
| Incomplete | Warning badge/count and highlighted cell summary | Points to a missing planned person or unresolved input. |
| Conflict | Destructive/warning icon with accessible text and detail panel | Surfaces a specific issue without filling the whole grid with text. |
| Acknowledgement/acceptance pending | Neutral action-state badge | Keeps communication state separate from attendance. |

Conflict indicators should be placed at cell level and aggregated in the summary strip. A click/tap reveals the affected Worker, period, and conflicting context. The grid should not encode a presumed legal rule; it should only explain the conflict supplied by future domain validation.

## 8. Future publication experience

The future UX should support a flexible progression without hardcoding it:

```text
Rascunho → revisão de exceções → publicação → comunicação → ciência/aceite (se aplicável)
```

Before publication, the screen should emphasize unresolved exceptions and scope. After publication, it should display an explicit state and a concise change history entry whenever an approved policy allows alteration. Communication, acknowledgement, and acceptance must remain distinct optional steps until discovery defines them.

## 9. Mobile strategy

Desktop uses the weekly Position grid with horizontal scroll inside the existing table/card pattern. Mobile should not compress seven days into unreadable cells.

```text
ESCALAS · TER, 16/09
[Operação ▼] [Unidade ▼] [‹] [Hoje] [›]

Promotor de Vendas · base 4
2 pessoas planejadas · atenção necessária
Mariana Alves · 08–17
Lucas Ferreira · 08–17
[Ver exceção]
```

Mobile defaults to a chronological daily list grouped by Unit/Position, with a day picker and concise exception markers. The Worker-week view can be a drill-down, not the primary mobile experience.

## 10. Future Pulsa Worker integration

The backoffice must present publication and change information in a form that can later feed a Worker-facing experience: relevant period, Unit, Position, interval, change marker, and communication/acknowledgement state where applicable. It should not assume that all Workers have the same contract type, attendance flow, notification channel, or acceptance requirement.

## 11. Decisions awaiting discovery

1. Whether the primary planning unit is Position, Worker, shift, or exact interval.
2. Whether and how temporal demand is defined independently from structural headcount.
3. The validity, recurrence, exception, and overnight model.
4. The conflict rules for a Worker across Units and Operations.
5. The meanings and transitions of draft, publication, amendment, cancellation, acknowledgement, and acceptance.
6. Who may create, review, publish, and amend schedules.
7. Whether Workers must acknowledge or accept any schedule category.
8. What information will come from the future timekeeping integration versus Pulsa operational data.
9. Which availability and engagement-modality rules apply before a Worker can be planned.

## 12. Benchmark boundary

Mature field-service products are useful references for exception-first dispatching, compact weekly grids, and drill-down conflict handling. Pulsa should use those interaction principles while remaining a vertical operational product: explicit hierarchy, controlled workflow, and no generic no-code calendar builder.
