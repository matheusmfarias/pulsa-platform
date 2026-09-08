"use client";

import { useActionState } from "react";

import { Button } from "@/components/ui/button";
import type { Permission } from "@/modules/authorization";

import { transitionScheduleRevisionAction, type ScheduleActionState } from "../actions";
import type { ScheduleRevisionStatus } from "../domain/scheduling";

const initialState: ScheduleActionState = { error: null };
const actionsByStatus: Record<ScheduleRevisionStatus, Array<{ action: "submit" | "approve" | "return" | "publish" | "copy"; label: string; permission: Permission }>> = {
  draft: [{ action: "submit", label: "Enviar para aprovação", permission: "schedule:submit" }],
  pending_approval: [{ action: "approve", label: "Aprovar", permission: "schedule:approve" }, { action: "return", label: "Devolver para rascunho", permission: "schedule:update" }],
  approved: [{ action: "publish", label: "Publicar", permission: "schedule:publish" }, { action: "return", label: "Devolver para rascunho", permission: "schedule:update" }],
  published: [{ action: "copy", label: "Criar nova revisão", permission: "schedule:create" }],
};

export function scheduleRevisionActionsFor(status: ScheduleRevisionStatus, permissions: ReadonlySet<Permission>) {
  return actionsByStatus[status].filter((item) => permissions.has(item.permission));
}

export function ScheduleRevisionActions({ scheduleId, revisionId, status, permissions }: { scheduleId: string; revisionId: string; status: ScheduleRevisionStatus; permissions: ReadonlySet<Permission> }) {
  const actions = scheduleRevisionActionsFor(status, permissions);
  if (!actions.length) return null;
  return <div className="flex flex-wrap gap-2">{actions.map((item) => <RevisionActionButton key={item.action} scheduleId={scheduleId} revisionId={revisionId} action={item.action} label={item.label} />)}</div>;
}

function RevisionActionButton({ scheduleId, revisionId, action, label }: { scheduleId: string; revisionId: string; action: "submit" | "approve" | "return" | "publish" | "copy"; label: string }) {
  const [state, formAction, pending] = useActionState(transitionScheduleRevisionAction.bind(null, scheduleId, revisionId, action), initialState);
  return <div><form action={formAction}><Button disabled={pending} size="sm" type="submit" variant="outline">{pending ? "Atualizando…" : label}</Button></form>{state.error ? <p className="mt-2 text-sm text-destructive">{state.error}</p> : null}</div>;
}
