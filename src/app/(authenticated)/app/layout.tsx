import { LogOut } from "lucide-react";
import { redirect } from "next/navigation";

import { DesktopNavigation, MobileNavigation } from "@/components/shared/authenticated-navigation";
import { Button } from "@/components/ui/button";
import { logoutAction } from "@/modules/auth/actions";
import { getAuthenticatedUser } from "@/modules/auth";

export const dynamic = "force-dynamic";

export default async function AuthenticatedLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const user = await getAuthenticatedUser();

  if (!user) redirect("/");

  return (
    <div className="min-h-screen overflow-x-hidden bg-muted/50">
      <DesktopNavigation />
      <div className="min-w-0 lg:pl-64">
        <header className="sticky top-0 z-30 border-b bg-background/95 backdrop-blur">
          <div className="flex h-16 items-center justify-between px-4 sm:px-6 lg:px-8">
            <MobileNavigation />
            <div className="flex items-center gap-4">
              <p className="hidden max-w-64 truncate text-sm text-muted-foreground sm:block">
                {user.email ?? "Usuário autenticado"}
              </p>
              <form action={logoutAction}>
                <Button type="submit" variant="outline" size="sm">
                  <LogOut className="size-4" aria-hidden="true" />
                  Sair
                </Button>
              </form>
            </div>
          </div>
        </header>
        {children}
      </div>
    </div>
  );
}
