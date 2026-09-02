import { redirect } from "next/navigation";

import {
  DesktopNavigation,
  MobileNavigation,
} from "@/components/shared/authenticated-navigation";
import { getAuthenticatedUser } from "@/modules/auth";
import { can, getAuthorizationContext } from "@/modules/authorization";
import { resolveOperationalContext } from "@/modules/operational-context";

export const dynamic = "force-dynamic";

export default async function AuthenticatedLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const user = await getAuthenticatedUser();

  if (!user) redirect("/");

  const email = user.email ?? "Usuário autenticado";
  const [authorization, operationalContextState] = await Promise.all([
    getAuthorizationContext(),
    resolveOperationalContext(),
  ]);
  const showAdministration = can(authorization, "organization_member:read");

  return (
    <div className="min-h-screen overflow-x-hidden bg-muted/50">
      <DesktopNavigation email={email} operationalContextState={operationalContextState} showAdministration={showAdministration} />
      <div className="min-w-0 lg:pl-64">
        <div className="flex h-16 items-center px-4 sm:px-6 lg:hidden">
          <MobileNavigation email={email} operationalContextState={operationalContextState} showAdministration={showAdministration} />
        </div>
        {children}
      </div>
    </div>
  );
}
