import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";

import {
  getWorkerScheduleEntry,
  WorkerScheduleEntryDetail,
} from "@/modules/worker-schedule";
import { isAppError } from "@/shared/errors";
import {
  getWorkerPresenceAction,
  WorkerPresenceControl,
} from "@/modules/worker-presence";

export default async function WorkerScheduleEntryPage({
  params,
}: PageProps<"/worker/schedule/[entryId]">) {
  const { entryId } = await params;
  let entry;
  let action;
  try {
    [entry, action] = await Promise.all([
      getWorkerScheduleEntry(entryId),
      getWorkerPresenceAction(entryId),
    ]);
  } catch (error) {
    if (isAppError(error) && error.code === "NOT_FOUND") notFound();
    throw error;
  }

  return (
    <main className="mx-auto max-w-3xl px-4 pb-28 pt-8 sm:px-6 sm:pt-12">
      <Link className="mb-6 inline-flex min-h-10 items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground" href="/worker/schedule">
        <ArrowLeft aria-hidden="true" className="size-4" />
        Voltar para minha escala
      </Link>
      <WorkerScheduleEntryDetail
        entry={entry}
        presenceControl={(
          <WorkerPresenceControl action={action} scheduleEntryId={entryId} />
        )}
      />
    </main>
  );
}
