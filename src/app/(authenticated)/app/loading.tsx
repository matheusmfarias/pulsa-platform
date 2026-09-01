export default function InternalLoading() {
  return (
    <main className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="h-48 max-w-2xl animate-pulse rounded-lg border bg-card" role="status">
        <span className="sr-only">Carregando área interna…</span>
      </div>
    </main>
  );
}
