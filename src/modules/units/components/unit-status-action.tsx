"use client";

import { useActionState } from "react";

import { Button } from "@/components/ui/button";

import { changeUnitStatusAction, type UnitActionState } from "../actions";
import type { UnitStatus } from "../domain/unit";

const initialState: UnitActionState = { error: null };

export function UnitStatusAction({ unitId, currentStatus }: { unitId: string; currentStatus: UnitStatus }) {
  const target = currentStatus === "active" ? "inactive" : "active";
  const [state, action, pending] = useActionState(changeUnitStatusAction.bind(null, unitId, target), initialState);
  return <div><form action={action}><Button type="submit" variant="outline" disabled={pending}>{pending ? "Atualizando…" : target === "active" ? "Ativar unidade" : "Desativar unidade"}</Button></form>{state.error ? <p className="mt-2 text-sm text-destructive" role="alert">{state.error}</p> : null}</div>;
}
