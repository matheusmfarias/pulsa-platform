import Link from "next/link";
import { redirect } from "next/navigation";

import { getAuthenticatedUser } from "@/modules/auth";
import { requireWorkerAccess } from "@/modules/worker-access";
import { WorkerNavigation } from "@/modules/worker-schedule/components/worker-navigation";
import { isAppError } from "@/shared/errors";

export const dynamic = "force-dynamic";

export default async function WorkerLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const user = await getAuthenticatedUser();
  if (!user) redirect("/worker/sign-in");

  try {
    await requireWorkerAccess();
  } catch (error) {
    if (isAppError(error) && error.code === "AUTHORIZATION") {
      redirect("/worker/claim");
    }
    throw error;
  }

  return (
    <div className="min-h-screen bg-muted/40">
      <header className="border-b bg-card">
        <div className="mx-auto flex h-16 max-w-3xl items-center justify-between px-5">
          <Link className="font-semibold tracking-tight" href="/worker">
            Pulsa Worker
          </Link>
          <div className="hidden sm:block">
            <WorkerNavigation />
          </div>
        </div>
      </header>
      {children}
      <div className="sm:hidden">
        <WorkerNavigation />
      </div>
    </div>
  );
}
