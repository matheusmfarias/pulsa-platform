"use client";

import Link from "next/link";
import { useActionState, useState, useTransition } from "react";

import { Button } from "@/components/ui/button";
import { FeedbackMessage } from "@/components/ui/feedback-message";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import type { AssignmentWithContext } from "@/modules/assignments";
import { ScheduleEntryAbsenceControl } from "@/modules/absences/components/schedule-entry-absence-control";

import { copyScheduleEntryToDaysAction, createScheduleEntryAction, deleteScheduleEntriesAction, deleteScheduleEntryAction, type ScheduleActionState, updateScheduleEntryAction } from "../actions";
import { buildSchedulePositionGroups, eligibleAssignmentsForDate, isScheduleRevisionEditable, scheduleWeekDays, type ScheduleWeekDay, zonedCivilDateTime } from "../domain/weekly-schedule";
import { activeAbsenceForScheduleEntry, activeReplacementForAbsence, type ScheduleEntryWithContext, type ScheduleRevisionStatus } from "../domain/scheduling";

const initialState: ScheduleActionState = { error: null };

function EntryForm({ scheduleId, revisionId, timeZone, assignments, date, entry, onCreate, onCancel }: { scheduleId: string; revisionId: string; timeZone: string; assignments: AssignmentWithContext[]; date: string; entry?: ScheduleEntryWithContext; onCreate?: boolean; onCancel?: () => void }) {
  const localStart = entry ? zonedCivilDateTime(entry.starts_at, timeZone) : { date, time: "08:00" };
  const localEnd = entry ? zonedCivilDateTime(entry.ends_at, timeZone) : { date, time: "17:00" };
  const localBreakStart = entry?.break_starts_at ? zonedCivilDateTime(entry.break_starts_at, timeZone).time : "";
  const localBreakEnd = entry?.break_ends_at ? zonedCivilDateTime(entry.break_ends_at, timeZone).time : "";
  const action = onCreate ? createScheduleEntryAction.bind(null, scheduleId) : updateScheduleEntryAction.bind(null, scheduleId, entry!.id);
  const [state, formAction, pending] = useActionState(action, initialState);
  const eligible = eligibleAssignmentsForDate(assignments, localStart.date);
  return <form action={formAction} className="mt-3 grid gap-2 rounded-surface border border-border-default bg-surface p-3 text-sm sm:grid-cols-2"><input name="schedule_revision_id" type="hidden" value={revisionId} /><input name="time_zone" type="hidden" value={timeZone} /><input name="date" type="hidden" value={localStart.date} />
    {onCreate ? <Select name="assignment_id" required><option value="">Colaborador com Assignment</option>{eligible.map((assignment) => <option key={assignment.id} value={assignment.id}>{assignment.worker.full_name}</option>)}</Select> : <input name="assignment_id" type="hidden" value={entry!.assignment_id} />}
    <div className="grid grid-cols-2 gap-2"><Input defaultValue={localStart.time} name="starts_at" required type="time" /><Input defaultValue={localEnd.time} name="ends_at" required type="time" /></div>
    <div className="grid grid-cols-2 gap-2"><Input defaultValue={localBreakStart} name="break_starts_at" type="time" /><Input defaultValue={localBreakEnd} name="break_ends_at" type="time" /></div>
    <div className="flex gap-2"><Button disabled={pending || (onCreate && !eligible.length)} size="sm" type="submit">{pending ? "Salvando…" : onCreate ? "Adicionar" : "Salvar"}</Button>{onCancel ? <Button onClick={onCancel} size="sm" type="button" variant="ghost">Cancelar</Button> : null}</div>{state.error ? <FeedbackMessage className="sm:col-span-2" variant="danger">{state.error}</FeedbackMessage> : null}
  </form>;
}

function AddEntryDialog({ scheduleId, revisionId, timeZone, assignments, date }: { scheduleId: string; revisionId: string; timeZone: string; assignments: AssignmentWithContext[]; date: string }) {
  const [open, setOpen] = useState(false);
  return <><Button onClick={() => setOpen(true)} size="sm" type="button" variant="ghost">Adicionar colaborador</Button>{open ? <div aria-modal="true" className="fixed inset-0 z-50 grid place-items-center bg-foreground/20 p-4" role="dialog"><div className="w-full max-w-md rounded-surface border border-border-default bg-surface p-5 shadow-lg"><div className="flex items-start justify-between gap-4"><div><h3 className="font-semibold">Adicionar colaborador</h3><p className="mt-1 text-sm text-muted-foreground">{new Intl.DateTimeFormat("pt-BR", { timeZone: "UTC" }).format(new Date(`${date}T00:00:00Z`))}</p></div><Button aria-label="Fechar" onClick={() => setOpen(false)} size="sm" type="button" variant="ghost">×</Button></div><EntryForm assignments={assignments} date={date} onCancel={() => setOpen(false)} onCreate revisionId={revisionId} scheduleId={scheduleId} timeZone={timeZone} /></div></div> : null}</>;
}

function EntryItem({ scheduleId, revisionId, entry, editable, canCreateAbsence, days, selected, onSelect }: { scheduleId: string; revisionId: string; entry: ScheduleEntryWithContext; editable: boolean; canCreateAbsence: boolean; days: ScheduleWeekDay[]; selected: boolean; onSelect: (id: string, selected: boolean) => void }) {
  const timeZone = entry.assignment.position.unit.timezone;
  const start = zonedCivilDateTime(entry.starts_at, timeZone).time;
  const end = zonedCivilDateTime(entry.ends_at, timeZone).time;
  const pause = entry.break_starts_at && entry.break_ends_at ? `${zonedCivilDateTime(entry.break_starts_at, timeZone).time}–${zonedCivilDateTime(entry.break_ends_at, timeZone).time}` : null;
  const [deleteState, deleteAction, deleting] = useActionState(deleteScheduleEntryAction.bind(null, scheduleId, entry.id), initialState);
  const [copyState, copyAction, copying] = useActionState(copyScheduleEntryToDaysAction.bind(null, scheduleId, revisionId, entry.id), initialState);
  const entryDay = zonedCivilDateTime(entry.starts_at, timeZone).date;
  const activeAbsence = activeAbsenceForScheduleEntry(entry);
  const activeReplacement = activeAbsence ? activeReplacementForAbsence(activeAbsence) : null;
  return <div className={`border-b border-border-default py-2 last:border-0 ${activeAbsence ? "rounded-control bg-status-warning-background/20 px-2" : ""}`}>{editable ? <label className="float-right"><input aria-label={`Selecionar ${entry.assignment.worker.full_name}`} checked={selected} onChange={(event) => onSelect(entry.id, event.target.checked)} type="checkbox" /></label> : null}<p className="truncate font-medium">{entry.assignment.worker.full_name}</p><p className="text-xs tabular-nums text-muted-foreground">{start}–{end}</p>{pause ? <p className="text-xs tabular-nums text-muted-foreground">Intervalo {pause}</p> : null}<ScheduleEntryAbsenceControl activeAbsence={activeAbsence ? { ...activeAbsence, replacementWorkerName: activeReplacement?.replacement_assignment.worker.full_name } : null} canCreate={canCreateAbsence} scheduleEntryId={entry.id} scheduleId={scheduleId} />{editable ? <details className="mt-1"><summary className="cursor-pointer text-xs text-muted-foreground">Editar · remover · copiar para dias</summary><EntryForm assignments={[]} entry={entry} revisionId={revisionId} scheduleId={scheduleId} timeZone={timeZone} date={entryDay} /><form action={copyAction} className="mt-2 space-y-2"><p className="text-xs text-muted-foreground">Copiar para dias</p><div className="flex flex-wrap gap-2">{days.filter((day) => day.key !== entryDay).map((day) => <label className="flex items-center gap-1 text-xs" key={day.key}><input name="target_dates" type="checkbox" value={day.key} />{day.label}</label>)}</div><Button disabled={copying} size="sm" type="submit" variant="ghost">{copying ? "Copiando…" : "Copiar"}</Button>{copyState.error ? <FeedbackMessage className="mt-2" variant={copyState.error.includes("não eram") ? "warning" : "danger"}>{copyState.error}</FeedbackMessage> : null}</form><form action={deleteAction} className="mt-1"><Button disabled={deleting} size="sm" type="submit" variant="ghost">Remover</Button>{deleteState.error ? <FeedbackMessage className="mt-2" variant="danger">{deleteState.error}</FeedbackMessage> : null}</form></details> : null}</div>;
}

export function ScheduleWeekEditor({ scheduleId, revisionId, status, entries, assignments, canCreateAbsence, weekStart, previousHref, nextHref, initialHref, periodStart, periodEnd, days: providedDays, title = "Programação semanal", previousLabel = "Semana anterior", nextLabel = "Próxima semana", initialLabel = "Semana inicial" }: { scheduleId: string; revisionId: string; status: ScheduleRevisionStatus; entries: ScheduleEntryWithContext[]; assignments: AssignmentWithContext[]; canCreateAbsence: boolean; weekStart: string; previousHref: string | null; nextHref: string | null; initialHref: string; periodStart: string; periodEnd: string; days?: ScheduleWeekDay[]; title?: string; previousLabel?: string; nextLabel?: string; initialLabel?: string }) {
  const editable = isScheduleRevisionEditable(status);
  const days = providedDays ?? scheduleWeekDays(weekStart);
  const groups = buildSchedulePositionGroups(entries, assignments, weekStart);
  const [selected, setSelected] = useState<string[]>([]);
  const [bulkError, setBulkError] = useState<string | null>(null);
  const [removing, startRemoving] = useTransition();
  const selectEntry = (id: string, checked: boolean) => setSelected((current) => checked ? [...new Set([...current, id])] : current.filter((item) => item !== id));
  const removeSelected = () => { if (!selected.length || !window.confirm(`Remover ${selected.length} entradas selecionadas?`)) return; startRemoving(async () => { const result = await deleteScheduleEntriesAction(scheduleId, selected); setBulkError(result.error); if (!result.error) setSelected([]); }); };
  return <section className="py-6"><header className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"><div><h2 className="font-semibold">{title}</h2><p className="mt-1 text-sm leading-6 text-muted-foreground">Horários apresentados no fuso de cada unidade.</p></div><nav className="flex flex-wrap gap-2"><Button asChild disabled={!previousHref} size="sm" variant="outline"><Link href={previousHref ?? initialHref}>{previousLabel}</Link></Button><Button asChild size="sm" variant="outline"><Link href={initialHref}>{initialLabel}</Link></Button><Button asChild disabled={!nextHref} size="sm" variant="outline"><Link href={nextHref ?? initialHref}>{nextLabel}</Link></Button></nav></header>{editable && selected.length ? <div className="mt-3 flex items-center gap-3"><Button disabled={removing} onClick={removeSelected} size="sm" type="button" variant="outline">{removing ? "Removendo…" : `Remover selecionadas (${selected.length})`}</Button>{bulkError ? <FeedbackMessage variant="danger">{bulkError}</FeedbackMessage> : null}</div> : null}
    <div className="mt-5 hidden overflow-x-auto border border-border-default lg:block"><table className="w-full min-w-[1100px] border-collapse text-sm"><thead><tr className="bg-muted/40"><th className="w-52 p-3 text-left font-medium">Unidade / Posto</th>{days.map((day) => <th className={`p-3 text-left font-medium capitalize ${day.key < periodStart || day.key > periodEnd ? "bg-muted/70 text-muted-foreground" : ""}`} key={day.key}>{day.label}</th>)}</tr></thead><tbody>{groups.map((group) => <tr className="border-t border-border-default" key={group.position.id}><td className="align-top p-3"><p className="font-medium">{group.position.name}</p><p className="text-xs text-muted-foreground">{group.unit.name}</p></td>{days.map((day) => { const available = day.key >= periodStart && day.key <= periodEnd; return <td className={`min-w-36 align-top p-2 ${available ? "" : "bg-muted/50 text-muted-foreground"}`} key={day.key}>{(group.entriesByDay[day.key] ?? []).map((entry) => <EntryItem canCreateAbsence={canCreateAbsence} days={days} editable={editable} entry={entry} key={entry.id} onSelect={selectEntry} revisionId={revisionId} scheduleId={scheduleId} selected={selected.includes(entry.id)} />)}{editable && available ? <AddEntryDialog assignments={group.assignments} date={day.key} revisionId={revisionId} scheduleId={scheduleId} timeZone={group.unit.timezone} /> : null}</td>})}</tr>)}</tbody></table></div>
    <div className="mt-5 space-y-5 lg:hidden">{days.map((day) => { const available = day.key >= periodStart && day.key <= periodEnd; return <section className={`border-t border-border-default pt-4 ${available ? "" : "opacity-55"}`} key={day.key}><h3 className="font-medium capitalize">{day.label}{available ? "" : " · fora do período"}</h3>{groups.map((group) => <div className="mt-3" key={group.position.id}><p className="text-sm font-medium">{group.unit.name} · {group.position.name}</p>{(group.entriesByDay[day.key] ?? []).map((entry) => <EntryItem canCreateAbsence={canCreateAbsence} days={days} editable={editable} entry={entry} key={entry.id} onSelect={selectEntry} revisionId={revisionId} scheduleId={scheduleId} selected={selected.includes(entry.id)} />)}{editable && available ? <AddEntryDialog assignments={group.assignments} date={day.key} revisionId={revisionId} scheduleId={scheduleId} timeZone={group.unit.timezone} /> : null}</div>)}</section>})}</div>
  </section>;
}
