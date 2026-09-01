export default function ContractsLoading() {
  return (
    <main className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8" role="status">
      <span className="sr-only">Carregando contratos…</span>
      <div className="h-20 max-w-lg animate-pulse rounded-lg bg-muted" />
      <div className="mt-8 h-72 animate-pulse rounded-lg border bg-card" />
    </main>
  );
}
