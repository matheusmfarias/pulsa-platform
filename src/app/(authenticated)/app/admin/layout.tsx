import type { ReactNode } from "react";

import { requirePermission } from "@/modules/authorization";

export default async function AdministrationLayout({ children }: { children: ReactNode }) {
  await requirePermission("organization_member:read");
  return children;
}
