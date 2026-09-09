import {
  getWorkerPresenceAction,
  WorkerPresenceControl,
} from "@/modules/worker-presence";
import { withWorkerRouteAccess } from "@/modules/worker-access";
import { getWorkerHome, WorkerHomeContent } from "@/modules/worker-schedule";

export default async function WorkerHomePage() {
  const home = await withWorkerRouteAccess(() => getWorkerHome());
  const primary = home.current ?? home.today;
  const action = primary
    ? await withWorkerRouteAccess(() =>
        getWorkerPresenceAction(primary.scheduleEntryId),
      )
    : null;
  return (
    <WorkerHomeContent
      home={home}
      presenceControl={primary && action ? (
        <WorkerPresenceControl
          action={action}
          scheduleEntryId={primary.scheduleEntryId}
        />
      ) : null}
    />
  );
}
