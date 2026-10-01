"use client";

import { CalendarX2, ExternalLink } from "lucide-react";
import Link from "next/link";
import { useId, useState } from "react";

import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { FeedbackMessage } from "@/components/ui/feedback-message";
import { Field } from "@/components/ui/field";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { usePreservedActionState } from "@/shared/forms/use-preserved-action-state";

import { createAbsenceAction, type AbsenceActionState } from "../actions";
import {
  ABSENCE_REASONS,
  ABSENCE_REASON_LABELS,
  type AbsenceReason,
} from "../domain/absence";

const initialState: AbsenceActionState = { error: null };

export type ActiveEntryAbsence = {
  id: string;
  reason: AbsenceReason;
  replacementWorkerName?: string | null;
};

export function ScheduleEntryAbsenceControl({
  scheduleId,
  scheduleEntryId,
  activeAbsence,
  canCreate,
}: {
  scheduleId: string;
  scheduleEntryId: string;
  activeAbsence: ActiveEntryAbsence | null;
  canCreate: boolean;
}) {
  const [open, setOpen] = useState(false);
  const reasonId = useId();
  const notesId = useId();
  const [state, formAction, pending, preservationRef, preservationSubmit, preservationReset] = usePreservedActionState(
    createAbsenceAction.bind(null, scheduleId, scheduleEntryId),
    initialState,
  );

  if (activeAbsence) {
    return (
      <div className="mt-2 rounded-control border border-status-warning-border bg-status-warning-background/55 px-2.5 py-2">
        <p className="flex items-center gap-1.5 text-xs font-medium text-status-warning-foreground">
          <CalendarX2 aria-hidden="true" className="size-3.5" />
          Ausência registrada
        </p>
        <div className="mt-1 flex flex-wrap items-center justify-between gap-2">
          <span className="text-xs text-muted-foreground">
            {ABSENCE_REASON_LABELS[activeAbsence.reason]}
          </span>
          <Link
            className="inline-flex items-center gap-1 text-xs font-medium text-foreground underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus-ring"
            href={`/app/absences/${activeAbsence.id}`}
          >
            Ver detalhes
            <ExternalLink aria-hidden="true" className="size-3" />
          </Link>
        </div>
        {activeAbsence.replacementWorkerName ? (
          <p className="mt-1 text-xs text-muted-foreground">
            Substituído por: {activeAbsence.replacementWorkerName}
          </p>
        ) : null}
      </div>
    );
  }

  if (!canCreate || state.success) return null;

  return (
    <>
      <Button
        className="mt-1 h-auto px-0 py-1 text-xs text-muted-foreground"
        onClick={() => setOpen(true)}
        type="button"
        variant="ghost"
      >
        Registrar ausência
      </Button>
      {open ? (
        <Dialog description="A jornada continuará visível na escala planejada." onOpenChange={setOpen} open={open} title="Registrar ausência">
            <form action={formAction} className="space-y-4" onReset={preservationReset} onSubmit={preservationSubmit} ref={preservationRef}>
              <Field id={reasonId} label="Motivo" required>
                <Select name="reason">
                  {ABSENCE_REASONS.map((reason) => (
                    <option key={reason} value={reason}>
                      {ABSENCE_REASON_LABELS[reason]}
                    </option>
                  ))}
                </Select>
              </Field>
              <Field id={notesId} label="Observação" optional>
                <Textarea
                  maxLength={2000}
                  name="notes"
                  placeholder="Inclua apenas informações necessárias."
                />
              </Field>
              {state.error ? (
                <FeedbackMessage variant="danger">{state.error}</FeedbackMessage>
              ) : null}
              <div className="flex justify-end gap-2">
                <Button
                  disabled={pending}
                  onClick={() => setOpen(false)}
                  type="button"
                  variant="ghost"
                >
                  Voltar
                </Button>
                <Button disabled={pending} type="submit">
                  {pending ? "Registrando…" : "Registrar ausência"}
                </Button>
              </div>
            </form>
        </Dialog>
      ) : null}
    </>
  );
}
