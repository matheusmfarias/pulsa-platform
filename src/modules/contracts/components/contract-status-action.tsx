"use client";

import { useActionState } from "react";

import { Button } from "@/components/ui/button";

import {
  changeContractStatusAction,
  type ContractActionState,
} from "../actions";
import {
  CONTRACT_STATUS_LABELS,
  CONTRACT_STATUS_TRANSITIONS,
  type ContractStatus,
} from "../domain/contract";

const initialState: ContractActionState = { error: null };

function ContractTransitionButton({
  contractId,
  targetStatus,
}: {
  contractId: string;
  targetStatus: ContractStatus;
}) {
  const action = changeContractStatusAction.bind(
    null,
    contractId,
    targetStatus,
  );
  const [state, formAction, pending] = useActionState(action, initialState);

  return (
    <div>
      <form action={formAction}>
        <Button type="submit" variant="outline" disabled={pending}>
          {pending ? "Atualizando…" : CONTRACT_STATUS_LABELS[targetStatus]}
        </Button>
      </form>
      {state.error ? (
        <p className="mt-2 max-w-sm text-sm text-destructive" role="alert">
          {state.error}
        </p>
      ) : null}
    </div>
  );
}

export function ContractStatusAction({
  contractId,
  currentStatus,
}: {
  contractId: string;
  currentStatus: ContractStatus;
}) {
  const transitions = CONTRACT_STATUS_TRANSITIONS[currentStatus];

  if (transitions.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        Este é um estado final e não possui novas transições.
      </p>
    );
  }

  return (
    <div className="flex flex-wrap gap-2">
      {transitions.map((targetStatus) => (
        <ContractTransitionButton
          key={targetStatus}
          contractId={contractId}
          targetStatus={targetStatus}
        />
      ))}
    </div>
  );
}
