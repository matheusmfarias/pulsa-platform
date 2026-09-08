import { Button } from "@/components/ui/button";

import { claimWorkerAccessAction } from "../actions";

export function WorkerClaimForm({ invitationToken }: { invitationToken: string }) {
  return (
    <form action={claimWorkerAccessAction.bind(null, invitationToken)}>
      <Button className="w-full" type="submit">
        Ativar meu acesso
      </Button>
    </form>
  );
}
