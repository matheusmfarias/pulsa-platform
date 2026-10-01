import type { ReactNode } from "react";
import { Suspense } from "react";

import { DataRouteSkeleton } from "@/components/ui/data-route-skeleton";
import { requirePermission } from "@/modules/authorization";

export default function AdministrationLayout({ children }: { children: ReactNode }) {
  return (
    <Suspense fallback={<DataRouteSkeleton kind="collection" label="Carregando administração" />}>
      <AdministrationPermissionGate>{children}</AdministrationPermissionGate>
    </Suspense>
  );
}

async function AdministrationPermissionGate({ children }: { children: ReactNode }) {
  await requirePermission("organization_member:read");
  return children;
}
