"use client";

import { useFormStatus } from "react-dom";

import { Button } from "@/components/ui/button";

import { claimWorkerAccessAction } from "../actions";

function ClaimButton() {
  const { pending } = useFormStatus();

  return (
    <Button className="h-12 w-full" disabled={pending} type="submit">
      {pending ? "Ativando acesso…" : "Ativar meu acesso"}
    </Button>
  );
}

export function WorkerClaimForm({ invitationToken }: { invitationToken: string }) {
  return (
    <form action={claimWorkerAccessAction.bind(null, invitationToken)}>
      <ClaimButton />
    </form>
  );
}
