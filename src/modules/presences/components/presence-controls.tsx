"use client";

import { Eye, LogIn, LogOut, X } from "lucide-react";
import { useActionState, useState } from "react";

import { Button } from "@/components/ui/button";
import { FeedbackMessage } from "@/components/ui/feedback-message";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

import {
  cancelPresenceAction,
  completePresenceAction,
  correctPresenceAction,
  startPresenceAction,
  type PresenceActionState,
} from "../actions";
import type { OperationalPresenceRow } from "../domain/operational-presence";

const initialState: PresenceActionState = { error: null };

function formatDateTime(value: string | null, timeZone: string) {
  if (!value) return "—";
  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short",
    timeStyle: "short",
    timeZone,
  }).format(new Date(value));
}

function dateTimeLocalValue(value: string | null, timeZone: string) {
  if (!value) return "";
  const parts = new Intl.DateTimeFormat("en-CA", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
    timeZone,
  }).formatToParts(new Date(value));
  const part = (type: Intl.DateTimeFormatPartTypes) =>
    parts.find((item) => item.type === type)?.value ?? "";
  return `${part("year")}-${part("month")}-${part("day")}T${part("hour")}:${part("minute")}`;
}

function toZonedIso(value: string, timeZone: string) {
  const [date, time] = value.split("T");
  const [year, month, day] = date.split("-").map(Number);
  const [hour, minute] = time.split(":").map(Number);
  const desired = Date.UTC(year, month - 1, day, hour, minute);
  let instant = desired;
  for (let attempt = 0; attempt < 3; attempt += 1) {
    const parts = new Intl.DateTimeFormat("en-US", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hourCycle: "h23",
      timeZone,
    }).formatToParts(new Date(instant));
    const part = (type: Intl.DateTimeFormatPartTypes) =>
      Number(parts.find((item) => item.type === type)?.value);
    const observed = Date.UTC(
      part("year"),
      part("month") - 1,
      part("day"),
      part("hour"),
      part("minute"),
      part("second"),
    );
    instant += desired - observed;
  }
  return new Date(instant).toISOString();
}

function QuickAction({ row }: { row: OperationalPresenceRow }) {
  const isStart = row.operational_status === "awaiting_confirmation" ||
    row.operational_status === "replacement_expected";
  const action = isStart
    ? startPresenceAction.bind(null, row.schedule_entry_id)
    : completePresenceAction.bind(null, row.presence_id!);
  const [state, formAction, pending] = useActionState(action, initialState);
  return (
    <div>
      <form action={formAction}>
        <Button disabled={pending} size="sm" type="submit">
          {isStart ? <LogIn aria-hidden="true" className="size-4" /> : <LogOut aria-hidden="true" className="size-4" />}
          {pending ? "Registrando…" : isStart ? "Registrar chegada" : "Registrar saída"}
        </Button>
      </form>
      {state.error ? <p className="mt-1 max-w-48 text-xs text-status-danger-foreground">{state.error}</p> : null}
    </div>
  );
}

function PresenceDetails({
  row,
  canCorrect,
  canCancel,
}: {
  row: OperationalPresenceRow;
  canCorrect: boolean;
  canCancel: boolean;
}) {
  const [open, setOpen] = useState(false);
  const correctCommand = correctPresenceAction.bind(null, row.presence_id!);
  const [correctionState, correctionAction, correctionPending] = useActionState(
    async (previousState: PresenceActionState, formData: FormData) => {
      const arrivedAt = String(formData.get("arrived_at") ?? "");
      const departedAt = String(formData.get("departed_at") ?? "");
      if (arrivedAt) {
        formData.set("arrived_at", toZonedIso(arrivedAt, row.unit_timezone));
      }
      if (departedAt) {
        formData.set("departed_at", toZonedIso(departedAt, row.unit_timezone));
      }
      return correctCommand(previousState, formData);
    },
    initialState,
  );
  const [cancellationState, cancellationAction, cancellationPending] = useActionState(
    cancelPresenceAction.bind(null, row.presence_id!),
    initialState,
  );

  return (
    <>
      <Button aria-label="Ver presença" onClick={() => setOpen(true)} size="icon" type="button" variant="ghost">
        <Eye aria-hidden="true" className="size-4" />
      </Button>
      {open ? (
        <div aria-modal="true" className="fixed inset-0 z-50 grid place-items-center overflow-y-auto bg-foreground/20 p-4" role="dialog">
          <div className="my-6 w-full max-w-xl rounded-surface border border-border-default bg-surface p-5 shadow-lg">
            <header className="flex items-start justify-between gap-4">
              <div>
                <h2 className="font-semibold">Planejado × realizado</h2>
                <p className="mt-1 text-sm text-muted-foreground">{row.actual_worker_name}</p>
              </div>
              <Button aria-label="Fechar" onClick={() => setOpen(false)} size="icon" type="button" variant="ghost"><X aria-hidden="true" className="size-4" /></Button>
            </header>
            <dl className="mt-5 grid gap-3 rounded-control bg-subtle p-4 text-sm sm:grid-cols-2">
              <div><dt className="text-muted-foreground">Planejado</dt><dd className="mt-1 font-medium">{formatDateTime(row.starts_at, row.unit_timezone)} — {formatDateTime(row.ends_at, row.unit_timezone)}</dd></div>
              <div><dt className="text-muted-foreground">Realizado</dt><dd className="mt-1 font-medium">{formatDateTime(row.arrived_at, row.unit_timezone)} — {formatDateTime(row.departed_at, row.unit_timezone)}</dd></div>
              <div><dt className="text-muted-foreground">Contexto</dt><dd className="mt-1">{row.operation_name} · {row.unit_name}</dd></div>
              <div><dt className="text-muted-foreground">Posto</dt><dd className="mt-1">{row.job_role_name}</dd></div>
            </dl>
            {canCorrect ? (
              <form action={correctionAction} className="mt-5 space-y-3">
                <h3 className="text-sm font-semibold">Corrigir horários</h3>
                <div className="grid gap-3 sm:grid-cols-2">
                  <label className="grid gap-1.5 text-sm">Chegada<Input defaultValue={dateTimeLocalValue(row.arrived_at, row.unit_timezone)} name="arrived_at" required type="datetime-local" /></label>
                  <label className="grid gap-1.5 text-sm">Saída<Input defaultValue={dateTimeLocalValue(row.departed_at, row.unit_timezone)} disabled={row.presence_status !== "completed"} name="departed_at" required={row.presence_status === "completed"} type="datetime-local" /></label>
                </div>
                <label className="grid gap-1.5 text-sm">Justificativa<Textarea maxLength={1000} name="reason" required /></label>
                {correctionState.error ? <FeedbackMessage variant="danger">{correctionState.error}</FeedbackMessage> : null}
                <Button disabled={correctionPending} size="sm" type="submit">{correctionPending ? "Salvando…" : "Salvar correção"}</Button>
              </form>
            ) : null}
            {canCancel ? (
              <form action={cancellationAction} className="mt-6 space-y-3 border-t border-border-default pt-5">
                <h3 className="text-sm font-semibold">Cancelar presença</h3>
                <label className="grid gap-1.5 text-sm">Justificativa<Textarea maxLength={1000} name="reason" required /></label>
                {cancellationState.error ? <FeedbackMessage variant="danger">{cancellationState.error}</FeedbackMessage> : null}
                <Button disabled={cancellationPending} size="sm" type="submit" variant="destructive">{cancellationPending ? "Cancelando…" : "Cancelar presença"}</Button>
              </form>
            ) : null}
          </div>
        </div>
      ) : null}
    </>
  );
}

export function PresenceControls({
  row,
  canStart,
  canComplete,
  canCorrect,
  canCancel,
}: {
  row: OperationalPresenceRow;
  canStart: boolean;
  canComplete: boolean;
  canCorrect: boolean;
  canCancel: boolean;
}) {
  const startAvailable = canStart && ["awaiting_confirmation", "replacement_expected"].includes(row.operational_status);
  const completeAvailable = canComplete && row.operational_status === "present";
  return (
    <div className="flex items-center justify-end gap-1">
      {startAvailable || completeAvailable ? <QuickAction row={row} /> : null}
      {row.presence_id ? <PresenceDetails canCancel={canCancel} canCorrect={canCorrect} row={row} /> : null}
    </div>
  );
}
