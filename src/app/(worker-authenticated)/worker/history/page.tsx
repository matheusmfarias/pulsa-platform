import {
  listWorkerPresenceHistory,
  WorkerPresenceHistory,
} from "@/modules/worker-presence";

export default async function WorkerHistoryPage({
  searchParams,
}: PageProps<"/worker/history">) {
  const query = await searchParams;
  const beforeArrivedAt = typeof query.before === "string" ? query.before : null;
  const beforeScheduleEntryId = typeof query.entry === "string"
    ? query.entry
    : null;
  const page = await listWorkerPresenceHistory({
    limit: 20,
    beforeArrivedAt,
    beforeScheduleEntryId,
  });

  return (
    <main className="mx-auto max-w-3xl px-4 py-8 sm:px-6 sm:py-12">
      <p className="text-sm text-muted-foreground">Realização própria</p>
      <h1 className="mt-1 text-2xl font-semibold tracking-tight">Histórico</h1>
      <section aria-label="Histórico de presença" className="mt-6">
        <WorkerPresenceHistory page={page} />
      </section>
    </main>
  );
}
