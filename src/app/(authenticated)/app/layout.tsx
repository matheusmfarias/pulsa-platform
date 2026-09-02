import { redirect } from "next/navigation";

import {
  DesktopNavigation,
  MobileNavigation,
} from "@/components/shared/authenticated-navigation";
import { getAuthenticatedUser } from "@/modules/auth";
import { can, getAuthorizationContext } from "@/modules/authorization";

export const dynamic = "force-dynamic";

export default async function AuthenticatedLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const user = await getAuthenticatedUser();

  if (!user) redirect("/");

  const email = user.email ?? "Usuário autenticado";
  const authorization = await getAuthorizationContext();
  const showAdministration = can(authorization, "organization_member:read");

  return (
    <div className="min-h-screen overflow-x-hidden bg-muted/50">
      <DesktopNavigation email={email} showAdministration={showAdministration} />
      <div className="min-w-0 lg:pl-64">
        <div className="flex h-16 items-center px-4 sm:px-6 lg:hidden">
          <MobileNavigation email={email} showAdministration={showAdministration} />
        </div>
        {children}
      </div>
    </div>
  );
}
