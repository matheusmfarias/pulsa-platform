"use client";

import { useActionState, useId } from "react";

import { Button } from "@/components/ui/button";
import { FeedbackMessage } from "@/components/ui/feedback-message";
import { Field } from "@/components/ui/field";
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
  const roleId = useId();

  return (
    <form action={formAction} className="max-w-sm space-y-4">
      <Field id={roleId} label="Novo papel">
        <Select name="role" defaultValue={currentRole}>
          {organizationRoleSchema.options.map((role) => (
            <option key={role} value={role}>{ORGANIZATION_ROLE_LABELS[role]}</option>
          ))}
        </Select>
      </Field>
      <Button type="submit" variant="outline" disabled={pending}>
        {pending ? "Salvando…" : "Salvar papel"}
      </Button>
      {state.error ? (
        <FeedbackMessage variant="danger">{state.error}</FeedbackMessage>
      ) : null}
      {state.success ? (
        <FeedbackMessage variant="success">{state.success}</FeedbackMessage>
      ) : null}
    </form>
  );
}
