import { redirect } from "next/navigation";

import { BrandMark } from "@/components/shared/brand-mark";
import { getAuthenticatedUser } from "@/modules/auth";
import {
  handleWorkerRouteError,
  requireWorkerAccess,
} from "@/modules/worker-access";

export const dynamic = "force-dynamic";

export default async function WorkerPasswordLayout({
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
      <header className="border-b bg-card/95">
        <div className="mx-auto flex h-14 max-w-md items-center px-4 sm:px-6">
          <div className="flex items-center gap-3">
            <BrandMark />
            <span className="border-l pl-3 text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">
              Worker
            </span>
          </div>
        </div>
      </header>
      {children}
    </div>
  );
}
