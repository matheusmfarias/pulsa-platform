import Link from "next/link";
import { redirect } from "next/navigation";

import { BrandMark } from "@/components/shared/brand-mark";
import { getAuthenticatedUser } from "@/modules/auth";
import {
  handleWorkerRouteError,
  requireWorkerAccess,
} from "@/modules/worker-access";
import { WorkerNavigation } from "@/modules/worker-schedule/components/worker-navigation";

export const dynamic = "force-dynamic";

export default async function WorkerLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const user = await getAuthenticatedUser();
  if (!user) redirect("/worker/sign-in");

  try {
    await requireWorkerAccess();
  } catch (error) {
    handleWorkerRouteError(error);
  }

  return (
    <div className="min-h-dvh bg-muted/40">
      <header className="border-b bg-card/95 backdrop-blur">
        <div className="mx-auto flex h-14 max-w-3xl items-center justify-between px-4 sm:px-6">
          <Link
            aria-label="Pulsa Worker — ir para Hoje"
            className="flex min-h-11 items-center gap-3 rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus-ring focus-visible:ring-offset-2"
            href="/worker"
          >
            <BrandMark />
            <span className="border-l pl-3 text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">
              Worker
            </span>
          </Link>
          <div className="hidden sm:block">
            <WorkerNavigation />
          </div>
        </div>
      </header>
      <div className="pb-[calc(4rem+env(safe-area-inset-bottom))] sm:pb-0">
        {children}
      </div>
      <div className="sm:hidden">
        <WorkerNavigation />
      </div>
    </div>
  );
}
