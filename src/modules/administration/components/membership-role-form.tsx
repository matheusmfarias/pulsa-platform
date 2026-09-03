"use client";

import { useActionState } from "react";

import { Button } from "@/components/ui/button";
import { FeedbackMessage } from "@/components/ui/feedback-message";
import { Select } from "@/components/ui/select";
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
        <Select
          name="role"
          defaultValue={currentRole}
          aria-label="Papel da membership"
          className="min-w-64"
        >
          {organizationRoleSchema.options.map((role) => (
            <option key={role} value={role}>
              {ORGANIZATION_ROLE_LABELS[role]}
            </option>
          ))}
        </Select>
        <Button type="submit" variant="outline" disabled={pending}>
          {pending ? "Salvando…" : "Alterar papel"}
        </Button>
      </div>
      {state.error ? (
        <FeedbackMessage variant="danger">{state.error}</FeedbackMessage>
      ) : null}
      {state.success ? (
        <FeedbackMessage variant="success">{state.success}</FeedbackMessage>
      ) : null}
    </form>
  );
}
