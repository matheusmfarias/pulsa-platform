import {
  getWorkerPresenceAction,
  WorkerPresenceControl,
} from "@/modules/worker-presence";
import { getWorkerHome, WorkerHomeContent } from "@/modules/worker-schedule";

export default async function WorkerHomePage() {
  const home = await getWorkerHome();
  const primary = home.current ?? home.today;
  const action = primary
    ? await getWorkerPresenceAction(primary.scheduleEntryId)
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
