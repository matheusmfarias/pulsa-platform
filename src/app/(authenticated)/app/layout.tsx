import { redirect } from "next/navigation";

import {
  DesktopNavigation,
  MobileNavigation,
} from "@/components/shared/authenticated-navigation";
import { getAuthenticatedUser } from "@/modules/auth";
import { can, getAuthorizationContext } from "@/modules/authorization";
import { resolveOperationalContext } from "@/modules/operational-context";
import { getOptionalWorkerAccess } from "@/modules/worker-access";
import { isAppError } from "@/shared/errors";
import { LayoutPerformanceStagesProvider, type RouteServerStage } from "@/shared/performance/layout-performance-stages";

export const dynamic = "force-dynamic";

export default async function AuthenticatedLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const serverStages: RouteServerStage[] = [];
  // Server Component request timings identify work shared by every authenticated route.
  // eslint-disable-next-line react-hooks/purity
  const identityStartedAt = performance.now();
  const user = await getAuthenticatedUser();
  // eslint-disable-next-line react-hooks/purity
  serverStages.push({ label: "Identidade da sessão", durationMs: Math.round(performance.now() - identityStartedAt) });

  if (!user) redirect("/");

  const email = user.email ?? "Usuário autenticado";
  let authorization;
  // eslint-disable-next-line react-hooks/purity
  const permissionsStartedAt = performance.now();
  try {
    authorization = await getAuthorizationContext();
  } catch (error) {
    if (isAppError(error) && error.code === "AUTHORIZATION") {
      if (await getOptionalWorkerAccess()) redirect("/worker");
      redirect("/");
    }
    throw error;
  }
  // eslint-disable-next-line react-hooks/purity
  serverStages.push({ label: "Permissões e vínculo organizacional", durationMs: Math.round(performance.now() - permissionsStartedAt) });
  // eslint-disable-next-line react-hooks/purity
  const contextStartedAt = performance.now();
  const operationalContextState = await resolveOperationalContext();
  // eslint-disable-next-line react-hooks/purity
  serverStages.push({ label: "Contexto operacional do layout", durationMs: Math.round(performance.now() - contextStartedAt) });
  const showAdministration = can(authorization, "organization_member:read");

  return (
    <LayoutPerformanceStagesProvider serverStages={serverStages}>
    <div className="min-h-screen overflow-x-hidden bg-muted/50">
      <DesktopNavigation
        email={email}
        operationalContextState={operationalContextState}
        showAdministration={showAdministration}
      />
      <div
        className="
    min-w-0
    transition-[padding] duration-300
    ease-[cubic-bezier(0.22,1,0.36,1)]
    lg:pl-64
    peer-data-[collapsed=true]:lg:pl-[4.25rem]
  "
      >
        <div className="flex h-16 items-center px-4 sm:px-6 lg:hidden">
          <MobileNavigation
            email={email}
            operationalContextState={operationalContextState}
            showAdministration={showAdministration}
          />
        </div>
        {children}
      </div>
    </div>
    </LayoutPerformanceStagesProvider>
  );
}
