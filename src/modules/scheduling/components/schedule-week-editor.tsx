"use client";

import { Pencil } from "lucide-react";
import Link from "next/link";
import { useActionState, useCallback, useEffect, useRef, useState, useTransition } from "react";

import { AlertDialog } from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { FeedbackMessage } from "@/components/ui/feedback-message";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import type { AssignmentWithContext } from "@/modules/assignments";
import { ScheduleEntryAbsenceControl } from "@/modules/absences/components/schedule-entry-absence-control";

import { copyScheduleEntryToDaysAction, createScheduleEntryAction, deleteScheduleEntriesAction, deleteScheduleEntryAction, type ScheduleActionState, updateScheduleEntryAction } from "../actions";
import { buildSchedulePositionGroups, eligibleAssignmentsForDate, isScheduleRevisionEditable, scheduleWeekDays, type ScheduleWeekDay, zonedCivilDateTime } from "../domain/weekly-schedule";
import { activeAbsenceForScheduleEntry, activeReplacementForAbsence, type ScheduleEntryWithContext, type ScheduleRevisionStatus } from "../domain/scheduling";

const initialState: ScheduleActionState = { error: null };

function EntryForm({ scheduleId, revisionId, timeZone, assignments, date, entry, onCreate, onCancel, onCreateSuccess }: { scheduleId: string; revisionId: string; timeZone: string; assignments: AssignmentWithContext[]; date: string; entry?: ScheduleEntryWithContext; onCreate?: boolean; onCancel?: () => void; onCreateSuccess?: () => void }) {
  const idPrefix = entry?.id ?? `${scheduleId}-${date}`;
  const fieldId = (name: string) => `${idPrefix}-${name}`;
  const localStart = entry ? zonedCivilDateTime(entry.starts_at, timeZone) : { date, time: "08:00" };
  const localEnd = entry ? zonedCivilDateTime(entry.ends_at, timeZone) : { date, time: "17:00" };
  const localBreakStart = entry?.break_starts_at ? zonedCivilDateTime(entry.break_starts_at, timeZone).time : "";
  const localBreakEnd = entry?.break_ends_at ? zonedCivilDateTime(entry.break_ends_at, timeZone).time : "";
  const action = onCreate ? createScheduleEntryAction.bind(null, scheduleId) : updateScheduleEntryAction.bind(null, scheduleId, entry!.id);
  const [state, formAction, pending] = useActionState(action, initialState);
  const eligible = eligibleAssignmentsForDate(assignments, localStart.date);
  useEffect(() => {
    if (onCreate && state.success) onCreateSuccess?.();
  }, [onCreate, onCreateSuccess, state.success]);
  return (
    <form
      action={formAction}
      className="grid gap-4 text-sm sm:grid-cols-2"
    >
      <input name="schedule_revision_id" type="hidden" value={revisionId} />
      <input name="time_zone" type="hidden" value={timeZone} />
      <input name="date" type="hidden" value={localStart.date} />

      {onCreate ? (
        <Field description="Mostra colaboradores com alocação válida para este dia." id={fieldId("assignment_id")} label="Colaborador" required>
          <Select name="assignment_id">
            <option value="">Selecione o colaborador</option>
            {eligible.map((assignment) => (
              <option key={assignment.id} value={assignment.id}>
                {assignment.worker.full_name}
              </option>
            ))}
          </Select>
        </Field>
      ) : (
        <input name="assignment_id" type="hidden" value={entry!.assignment_id} />
      )}
      {onCreate && !eligible.length ? <FeedbackMessage className="sm:col-span-2">Nenhum colaborador com alocação válida neste dia. Confira as alocações antes de adicionar a jornada.</FeedbackMessage> : null}

      <div className="grid grid-cols-2 gap-3 sm:col-span-2">
        <Field id={fieldId("starts_at")} label="Início" required>
          <Input
            defaultValue={localStart.time}
            name="starts_at"
            type="time"
          />
        </Field>
        <Field id={fieldId("ends_at")} label="Fim" required>
          <Input defaultValue={localEnd.time} name="ends_at" type="time" />
        </Field>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:col-span-2 sm:grid-cols-2">
        <Field id={fieldId("break_starts_at")} label="Início do intervalo" optional>
          <Input
            defaultValue={localBreakStart}
            name="break_starts_at"
            type="time"
          />
        </Field>
        <Field id={fieldId("break_ends_at")} label="Fim do intervalo" optional>
          <Input
            defaultValue={localBreakEnd}
            name="break_ends_at"
            type="time"
          />
        </Field>
      </div>

      <div className="flex gap-2 sm:col-span-2">
        <Button
          disabled={pending || (onCreate && !eligible.length)}
          size="sm"
          type="submit"
        >
          {pending ? "Salvando…" : onCreate ? "Adicionar jornada" : "Salvar horários"}
        </Button>
        {onCancel ? (
          <Button onClick={onCancel} size="sm" type="button" variant="ghost">
            Cancelar
          </Button>
        ) : null}
      </div>

      {state.error ? (
        <FeedbackMessage className="sm:col-span-2" variant="danger">
          {state.error}
        </FeedbackMessage>
      ) : state.success && !onCreate ? (
        <FeedbackMessage className="sm:col-span-2" variant="success">
          {state.success}
        </FeedbackMessage>
      ) : null}
    </form>
  );
}

function AddEntryDialog({ scheduleId, revisionId, timeZone, assignments, date }: { scheduleId: string; revisionId: string; timeZone: string; assignments: AssignmentWithContext[]; date: string }) {
  const [open, setOpen] = useState(false);
  const closeDialog = useCallback(() => setOpen(false), []);
  return (
    <>
      <Button onClick={() => setOpen(true)} size="sm" type="button" variant="ghost">
        Adicionar colaborador
      </Button>
      {open ? (
        <Dialog
          description={`Jornada de ${new Intl.DateTimeFormat("pt-BR", { timeZone: "UTC" }).format(new Date(`${date}T00:00:00Z`))}. Escolha um colaborador alocado e confira os horários.`}
          onOpenChange={setOpen}
          open={open}
          title="Adicionar jornada"
        >
          <EntryForm
            assignments={assignments}
            date={date}
            onCancel={closeDialog}
            onCreate
            onCreateSuccess={closeDialog}
            revisionId={revisionId}
            scheduleId={scheduleId}
            timeZone={timeZone}
          />
        </Dialog>
      ) : null}
    </>
  );
}

function EntryItem({ scheduleId, revisionId, entry, editable, canCreateAbsence, days, periodStart, periodEnd, selected, onSelect }: { scheduleId: string; revisionId: string; entry: ScheduleEntryWithContext; editable: boolean; canCreateAbsence: boolean; days: ScheduleWeekDay[]; periodStart: string; periodEnd: string; selected: boolean; onSelect: (id: string, selected: boolean) => void }) {
  const timeZone = entry.assignment.position.unit.timezone;
  const start = zonedCivilDateTime(entry.starts_at, timeZone).time;
  const end = zonedCivilDateTime(entry.ends_at, timeZone).time;
  const pause = entry.break_starts_at && entry.break_ends_at ? `${zonedCivilDateTime(entry.break_starts_at, timeZone).time}–${zonedCivilDateTime(entry.break_ends_at, timeZone).time}` : null;
  const [deleteState, deleteAction, deleting] = useActionState(deleteScheduleEntryAction.bind(null, scheduleId, entry.id), initialState);
  const [copyState, copyAction, copying] = useActionState(copyScheduleEntryToDaysAction.bind(null, scheduleId, revisionId, entry.id), initialState);
  const entryDay = zonedCivilDateTime(entry.starts_at, timeZone).date;
  const activeAbsence = activeAbsenceForScheduleEntry(entry);
  const activeReplacement = activeAbsence ? activeReplacementForAbsence(activeAbsence) : null;
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState<"edit" | "copy">("edit");
  const [copyTargets, setCopyTargets] = useState<string[]>([]);
  const [copyAttempted, setCopyAttempted] = useState(false);
  const [confirmRemove, setConfirmRemove] = useState(false);
  const deleteFormRef = useRef<HTMLFormElement>(null);
  const targetDays = days.filter((day) => day.key !== entryDay && day.key >= periodStart && day.key <= periodEnd);
  const workerName = entry.assignment.worker.full_name;
  const copyResult = copyState.error;
  const copyResultVariant = copyResult?.startsWith("0 entradas copiadas") || copyResult?.includes("não eram elegíveis")
    ? "warning"
    : copyResult?.match(/^\d+ entradas copiadas/) ? "success" : "danger";

  return (
    <div className={`min-w-0 border-b border-border-default py-2 last:border-0 ${activeAbsence ? "rounded-control bg-status-warning-background/20 px-2" : ""}`}>
      {editable ? <label className="float-right"><input aria-label={`Selecionar ${workerName}`} checked={selected} onChange={(event) => onSelect(entry.id, event.target.checked)} type="checkbox" /></label> : null}
      <p className="truncate font-medium" title={workerName}>{workerName}</p>
      <p className="text-xs tabular-nums text-muted-foreground">{start}–{end}</p>
      {pause ? <p className="text-xs tabular-nums text-muted-foreground">Intervalo {pause}</p> : null}
      <ScheduleEntryAbsenceControl activeAbsence={activeAbsence ? { ...activeAbsence, replacementWorkerName: activeReplacement?.replacement_assignment.worker.full_name } : null} canCreate={canCreateAbsence} scheduleEntryId={entry.id} scheduleId={scheduleId} />
      {editable ? <>
        <Button aria-label={`Gerenciar jornada de ${workerName}`} className="mt-1 h-8 gap-1.5 px-2 text-xs" onClick={() => { setMode("edit"); setCopyTargets([]); setCopyAttempted(false); setOpen(true); }} size="sm" type="button" variant="ghost">
          <Pencil aria-hidden="true" className="size-3.5" />Gerenciar
        </Button>
        {open ? <Dialog className="max-w-xl" description={`${workerName} · ${days.find((day) => day.key === entryDay)?.label ?? entryDay} · ${start}–${end}`} onOpenChange={setOpen} open={open} title="Gerenciar jornada">
          <div className="mb-5 flex flex-wrap gap-2 border-b border-border-default pb-4">
            <Button aria-pressed={mode === "edit"} onClick={() => setMode("edit")} size="sm" type="button" variant={mode === "edit" ? "default" : "outline"}>Editar horários</Button>
            {targetDays.length ? <Button aria-pressed={mode === "copy"} onClick={() => setMode("copy")} size="sm" type="button" variant={mode === "copy" ? "default" : "outline"}>Copiar para dias</Button> : null}
          </div>
          {mode === "edit" ? <EntryForm assignments={[]} date={entryDay} entry={entry} revisionId={revisionId} scheduleId={scheduleId} timeZone={timeZone} /> : <form action={copyAction} className="space-y-4 text-sm" onSubmit={() => setCopyAttempted(true)}>
            <p className="text-muted-foreground">Escolha os dias desta semana que receberão a mesma jornada.</p>
            <div className="grid gap-2 sm:grid-cols-2">{targetDays.map((day) => <label className="flex min-h-11 items-center gap-3 rounded-control border border-border-default px-3 py-2 capitalize hover:bg-hover" key={day.key}><input checked={copyTargets.includes(day.key)} className="size-4 accent-primary" name="target_dates" onChange={(event) => setCopyTargets((current) => event.target.checked ? [...current, day.key] : current.filter((key) => key !== day.key))} type="checkbox" value={day.key} />{day.label}</label>)}</div>
            <Button disabled={copying || !copyTargets.length} type="submit">{copying ? "Copiando…" : "Copiar jornada"}</Button>
            {copyAttempted && !copying && copyResult ? <FeedbackMessage variant={copyResultVariant}>{copyResult}</FeedbackMessage> : null}
          </form>}
          <div className="mt-6 border-t border-border-default pt-4">
            <Button disabled={deleting} onClick={() => setConfirmRemove(true)} size="sm" type="button" variant="ghost">{deleting ? "Removendo…" : "Remover jornada"}</Button>
            <form action={deleteAction} ref={deleteFormRef} />
            {deleteState.error ? <FeedbackMessage className="mt-2" variant="danger">{deleteState.error}</FeedbackMessage> : null}
          </div>
          <AlertDialog cancelLabel="Manter jornada" confirmLabel="Remover jornada" description="A jornada será removida desta revisão em rascunho." onConfirm={() => { setConfirmRemove(false); deleteFormRef.current?.requestSubmit(); }} onOpenChange={setConfirmRemove} open={confirmRemove} title="Remover esta jornada?" />
        </Dialog> : null}
      </> : null}
    </div>
  );
}

export function ScheduleWeekEditor({ scheduleId, revisionId, status, entries, assignments, canCreateAbsence, weekStart, previousHref, nextHref, initialHref, periodStart, periodEnd, days: providedDays, title = "Programação semanal", previousLabel = "Semana anterior", nextLabel = "Próxima semana", initialLabel = "Semana inicial" }: { scheduleId: string; revisionId: string; status: ScheduleRevisionStatus; entries: ScheduleEntryWithContext[]; assignments: AssignmentWithContext[]; canCreateAbsence: boolean; weekStart: string; previousHref: string | null; nextHref: string | null; initialHref: string; periodStart: string; periodEnd: string; days?: ScheduleWeekDay[]; title?: string; previousLabel?: string; nextLabel?: string; initialLabel?: string }) {
  const editable = isScheduleRevisionEditable(status);
  const days = providedDays ?? scheduleWeekDays(weekStart);
  const groups = buildSchedulePositionGroups(entries, assignments, weekStart);
  const [selected, setSelected] = useState<string[]>([]);
  const [bulkError, setBulkError] = useState<string | null>(null);
  const [confirmRemoval, setConfirmRemoval] = useState(false);
  const [removing, startRemoving] = useTransition();
  const selectEntry = (id: string, checked: boolean) => setSelected((current) => checked ? [...new Set([...current, id])] : current.filter((item) => item !== id));
  const removeSelected = () => { if (!selected.length) return; startRemoving(async () => { const result = await deleteScheduleEntriesAction(scheduleId, selected); setBulkError(result.error); if (!result.error) setSelected([]); }); };
  return <section className="py-6">
    <header className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div><h2 className="font-semibold">{title}</h2><p className="mt-1 text-sm leading-6 text-muted-foreground">Horários apresentados no fuso de cada unidade.</p></div>
      {previousHref || nextHref ? <nav aria-label="Navegação do período" className="flex flex-wrap gap-2">
        {previousHref ? <Button asChild size="sm" variant="outline"><Link href={previousHref}>{previousLabel}</Link></Button> : null}
        {previousHref && previousHref !== initialHref ? <Button asChild size="sm" variant="outline"><Link href={initialHref}>{initialLabel}</Link></Button> : null}
        {nextHref ? <Button asChild size="sm" variant="outline"><Link href={nextHref}>{nextLabel}</Link></Button> : null}
      </nav> : null}
    </header>
    {editable && selected.length ? <div className="mt-3 flex items-center gap-3"><Button disabled={removing} onClick={() => setConfirmRemoval(true)} size="sm" type="button" variant="outline">{removing ? "Removendo…" : `Remover selecionadas (${selected.length})`}</Button>{bulkError ? <FeedbackMessage variant="danger">{bulkError}</FeedbackMessage> : null}</div> : null}
    <AlertDialog cancelLabel="Manter jornadas" confirmLabel="Remover jornadas" description={`${selected.length} ${selected.length === 1 ? "jornada será removida" : "jornadas serão removidas"} desta revisão em rascunho.`} onConfirm={() => { setConfirmRemoval(false); removeSelected(); }} onOpenChange={setConfirmRemoval} open={confirmRemoval} title="Remover jornadas selecionadas?" />
    <div className="mt-5 hidden overflow-x-auto border border-border-default lg:block"><table className="w-full min-w-[1100px] border-collapse text-sm"><thead><tr className="bg-muted/40"><th className="w-52 p-3 text-left font-medium">Unidade / Posto</th>{days.map((day) => <th className={`p-3 text-left font-medium capitalize ${day.key < periodStart || day.key > periodEnd ? "bg-muted/70 text-muted-foreground" : ""}`} key={day.key}>{day.label}</th>)}</tr></thead><tbody>{groups.map((group) => <tr className="border-t border-border-default" key={group.position.id}><td className="align-top p-3"><p className="font-medium">{group.position.name}</p><p className="text-xs text-muted-foreground">{group.unit.name}</p></td>{days.map((day) => { const available = day.key >= periodStart && day.key <= periodEnd; return <td className={`min-w-36 align-top p-2 ${available ? "" : "bg-muted/50 text-muted-foreground"}`} key={day.key}>{(group.entriesByDay[day.key] ?? []).map((entry) => <EntryItem canCreateAbsence={canCreateAbsence} days={days} editable={editable} periodStart={periodStart} periodEnd={periodEnd} entry={entry} key={entry.id} onSelect={selectEntry} revisionId={revisionId} scheduleId={scheduleId} selected={selected.includes(entry.id)} />)}{editable && available ? <AddEntryDialog assignments={group.assignments} date={day.key} revisionId={revisionId} scheduleId={scheduleId} timeZone={group.unit.timezone} /> : null}</td>})}</tr>)}</tbody></table></div>
    <div className="mt-5 space-y-5 lg:hidden">
      {days.filter((day) => day.key >= periodStart && day.key <= periodEnd).map((day) => (
        <section className="border-t border-border-default pt-4" key={day.key}>
          <h3 className="font-medium capitalize">{day.label}</h3>
          {groups.map((group) => <div className="mt-3" key={group.position.id}>
            <p className="text-sm font-medium">{group.unit.name} · {group.position.name}</p>
            {(group.entriesByDay[day.key] ?? []).map((entry) => <EntryItem canCreateAbsence={canCreateAbsence} days={days} editable={editable} periodStart={periodStart} periodEnd={periodEnd} entry={entry} key={entry.id} onSelect={selectEntry} revisionId={revisionId} scheduleId={scheduleId} selected={selected.includes(entry.id)} />)}
            {editable ? <AddEntryDialog assignments={group.assignments} date={day.key} revisionId={revisionId} scheduleId={scheduleId} timeZone={group.unit.timezone} /> : null}
          </div>)}
        </section>
      ))}
    </div>
  </section>;
}
