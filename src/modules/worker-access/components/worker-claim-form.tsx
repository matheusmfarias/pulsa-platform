"use client";

import { useFormStatus } from "react-dom";

import { Button } from "@/components/ui/button";

import {
  claimMyWorkerAccessAction,
  claimWorkerAccessAction,
} from "../actions";
import { getWorkerClaimExperience } from "../domain/worker-access";

function ClaimButton({ hasPriorAccess }: { hasPriorAccess: boolean }) {
  const { pending } = useFormStatus();
  const experience = getWorkerClaimExperience(hasPriorAccess);

  return (
    <Button className="h-12 w-full" disabled={pending} type="submit">
      {pending ? experience.pendingLabel : experience.submitLabel}
    </Button>
  );
}

export function WorkerClaimForm({
  hasPriorAccess,
  invitationToken,
}: {
  hasPriorAccess: boolean;
  invitationToken?: string;
}) {
  return (
    <form
      action={invitationToken
        ? claimWorkerAccessAction.bind(null, invitationToken)
        : claimMyWorkerAccessAction}
    >
      <ClaimButton hasPriorAccess={hasPriorAccess} />
    </form>
  );
}
