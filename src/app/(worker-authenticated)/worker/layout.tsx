import Link from "next/link";

export const dynamic = "force-dynamic";

export default function WorkerLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <div className="min-h-screen bg-muted/40">
      <header className="border-b bg-card">
        <div className="mx-auto flex h-16 max-w-3xl items-center px-5">
          <Link className="font-semibold tracking-tight" href="/worker">
            Pulsa Worker
          </Link>
        </div>
      </header>
      {children}
    </div>
  );
}
