"use client";

import { Plus } from "lucide-react";
import { useId, useState } from "react";

import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { FeedbackMessage } from "@/components/ui/feedback-message";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { organizationRoleSchema } from "@/modules/organizations/schemas/organization-role-schema";
import { usePreservedActionState } from "@/shared/forms/use-preserved-action-state";

import { inviteOrganizationUserAction, type AdministrationActionState } from "../actions";
import { ORGANIZATION_ROLE_LABELS } from "../domain/organization-member";

export function InviteOrganizationUser() {
  const [open, setOpen] = useState(false);
  const [state, formAction, pending, preservationRef, preservationSubmit, preservationReset] = usePreservedActionState(
    async (previous: AdministrationActionState, formData: FormData) => {
      const result = await inviteOrganizationUserAction(previous, formData);
      if (result.success) setOpen(false);
      return result;
    },
    { error: null },
  );
  const id = useId();

  return (
    <div>
      <Button onClick={() => setOpen(true)} type="button"><Plus aria-hidden="true" className="size-4" /> Convidar usuário</Button>
      {open ? (
        <Dialog
          description="Escolha o papel de acesso. A pessoa receberá um código por e-mail e definirá a própria senha."
          onOpenChange={setOpen}
          open={open}
          title="Convidar usuário"
        >
          <form action={formAction} className="space-y-4" onReset={preservationReset} onSubmit={preservationSubmit} ref={preservationRef}>
            <Field id={`${id}-name`} label="Nome completo" required>
              <Input autoComplete="name" maxLength={120} name="displayName" placeholder="Nome da pessoa" />
            </Field>
            <Field id={`${id}-email`} label="E-mail" required>
              <Input autoComplete="email" name="email" placeholder="nome@empresa.com.br" type="email" />
            </Field>
            <Field id={`${id}-role`} label="Papel de acesso" required>
              <Select defaultValue="" name="role">
                <option disabled value="">Selecione um papel</option>
                {organizationRoleSchema.options.map((role) => (
                  <option key={role} value={role}>{ORGANIZATION_ROLE_LABELS[role]}</option>
                ))}
              </Select>
            </Field>
            {state.error ? <FeedbackMessage variant="danger">{state.error}</FeedbackMessage> : null}
            <div className="flex flex-col-reverse gap-2 pt-2 sm:flex-row sm:justify-end">
              <Button disabled={pending} onClick={() => setOpen(false)} type="button" variant="ghost">Cancelar</Button>
              <Button disabled={pending} type="submit">{pending ? "Enviando convite…" : "Criar e enviar convite"}</Button>
            </div>
          </form>
        </Dialog>
      ) : null}
      {!open && state.success ? <FeedbackMessage className="mt-3" variant="success">{state.success}</FeedbackMessage> : null}
    </div>
  );
}
