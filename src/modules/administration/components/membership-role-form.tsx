"use client";

import { useActionState } from "react";

import { Button } from "@/components/ui/button";
import {
  organizationRoleSchema,
  type OrganizationRole,
} from "@/modules/organizations/schemas/organization-role-schema";

import {
  changeMembershipRoleAction,
  type AdministrationActionState,
} from "../actions";
import { ORGANIZATION_ROLE_LABELS } from "../domain/organization-member";

const initialState: AdministrationActionState = { error: null };

export function MembershipRoleForm({
  profileId,
  currentRole,
}: {
  profileId: string;
  currentRole: OrganizationRole;
}) {
  const action = changeMembershipRoleAction.bind(null, profileId);
  const [state, formAction, pending] = useActionState(action, initialState);

  return (
    <form action={formAction} className="space-y-3">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <select
          name="role"
          defaultValue={currentRole}
          aria-label="Papel da membership"
          className="h-10 min-w-64 rounded-md border border-input bg-background px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          {organizationRoleSchema.options.map((role) => (
            <option key={role} value={role}>
              {ORGANIZATION_ROLE_LABELS[role]}
            </option>
          ))}
        </select>
        <Button type="submit" variant="outline" disabled={pending}>
          {pending ? "Salvando…" : "Alterar papel"}
        </Button>
      </div>
      {state.error ? <p className="text-sm text-destructive" role="alert">{state.error}</p> : null}
      {state.success ? <p className="text-sm text-emerald-700" role="status">{state.success}</p> : null}
    </form>
  );
}
