"use client";

import { useActionState } from "react";

import { Button } from "@/components/ui/button";

import { changeAssignmentStatusAction, type AssignmentActionState } from "../actions";
import {
  ASSIGNMENT_STATUS_LABELS,
  ASSIGNMENT_STATUS_TRANSITIONS,
  type AssignmentStatus,
} from "../domain/assignment";

const initialState: AssignmentActionState = { error: null };

function TransitionButton({ assignmentId, target }: { assignmentId: string; target: AssignmentStatus }) {
  const [state, action, pending] = useActionState(
    changeAssignmentStatusAction.bind(null, assignmentId, target),
    initialState,
  );
  return (
    <div>
      <form action={action}>
        <Button type="submit" variant="outline" disabled={pending}>
          {pending ? "Atualizando…" : ASSIGNMENT_STATUS_LABELS[target]}
        </Button>
      </form>
      {state.error ? <p className="mt-2 text-sm text-destructive">{state.error}</p> : null}
    </div>
  );
}

export function AssignmentStatusAction({
  assignmentId,
  currentStatus,
}: {
  assignmentId: string;
  currentStatus: AssignmentStatus;
}) {
  const transitions = ASSIGNMENT_STATUS_TRANSITIONS[currentStatus];
  if (!transitions.length) {
    return <p className="text-sm text-muted-foreground">Estado final sem novas transições.</p>;
  }
  return (
    <div className="flex flex-wrap gap-2">
      {transitions.map((target) => (
        <TransitionButton key={target} assignmentId={assignmentId} target={target} />
      ))}
    </div>
  );
}
