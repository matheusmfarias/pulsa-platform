"use client";

import Link from "next/link";
import { useActionState } from "react";

import { Button } from "@/components/ui/button";
import { FeedbackMessage } from "@/components/ui/feedback-message";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import type { JobRole } from "@/modules/job-roles";
import type { UnitWithContext } from "@/modules/units";

import type { Position } from "../domain/position";
import {
  createPositionAction,
  type PositionActionState,
  updatePositionAction,
} from "../actions";

const initialState: PositionActionState = { error: null };

export function PositionForm({
  unitId,
  units,
  jobRoles,
  position,
  cancelHref,
  redirectToPosition = false,
}: {
  unitId?: string;
  units?: UnitWithContext[];
  jobRoles: JobRole[];
  position?: Position;
  cancelHref: string;
  redirectToPosition?: boolean;
}) {
  const handler = position
    ? updatePositionAction.bind(null, position.id)
    : createPositionAction;

  const [state, action, pending] = useActionState(handler, initialState);

  return (
    <form action={action} className="space-y-8" noValidate>
      {unitId ? <input type="hidden" name="unit_id" value={unitId} /> : null}
      {redirectToPosition ? (
        <input type="hidden" name="redirect_to" value="position" />
      ) : null}

      <section aria-labelledby="position-structure-heading">
        <div>
          <h2 className="font-semibold" id="position-structure-heading">
            Estrutura do posto
          </h2>
          <p className="mt-1 text-sm leading-6 text-muted-foreground">
            Defina o cargo associado e o efetivo base necessário para este
            posto.
          </p>
        </div>

        <div className="mt-5 space-y-5">
          {!unitId ? (
            <Field
              id="unit_id"
              label="Unidade"
              error={state.fieldErrors?.unit_id}
              required
            >
              <Select defaultValue="" name="unit_id">
                <option disabled value="">
                  Selecione uma unidade
                </option>

                {units?.map((unit) => (
                  <option key={unit.id} value={unit.id}>
                    {unit.name} · {unit.operation.name}
                  </option>
                ))}
              </Select>
            </Field>
          ) : null}

          <Field
            id="job_role_id"
            label="Cargo"
            error={state.fieldErrors?.job_role_id}
            required
          >
            <Select
              defaultValue={position?.job_role_id ?? ""}
              name="job_role_id"
            >
              <option disabled value="">
                Selecione um cargo
              </option>

              {jobRoles.map((jobRole) => (
                <option key={jobRole.id} value={jobRole.id}>
                  {jobRole.name}
                  {jobRole.status === "inactive" ? " (inativo)" : ""}
                </option>
              ))}
            </Select>
          </Field>

          <Field
            id="base_required_headcount"
            label="Efetivo base necessário"
            error={state.fieldErrors?.base_required_headcount}
            required
          >
            <Input
              defaultValue={position?.base_required_headcount ?? 0}
              min={0}
              name="base_required_headcount"
              step={1}
              type="number"
            />
          </Field>
        </div>
      </section>

      <section
        aria-labelledby="position-details-heading"
        className="border-t border-border-default pt-8"
      >
        <div>
          <h2 className="font-semibold" id="position-details-heading">
            Informações adicionais
          </h2>
          <p className="mt-1 text-sm leading-6 text-muted-foreground">
            Acrescente uma descrição quando houver orientação específica sobre o
            posto.
          </p>
        </div>

        <div className="mt-5">
          <Field
            id="description"
            label="Descrição"
            error={state.fieldErrors?.description}
            optional
          >
            <Textarea
              defaultValue={position?.description ?? ""}
              maxLength={2000}
              name="description"
              rows={5}
            />
          </Field>
        </div>
      </section>

      {state.error ? (
        <FeedbackMessage variant="danger">{state.error}</FeedbackMessage>
      ) : null}

      <div className="flex flex-col-reverse gap-3 border-t border-border-default pt-6 sm:flex-row sm:justify-end">
        <Button asChild variant="ghost">
          <Link href={cancelHref}>Cancelar</Link>
        </Button>

        <Button disabled={pending} type="submit">
          {pending
            ? "Salvando…"
            : position
              ? "Salvar alterações"
              : "Cadastrar posto"}
        </Button>
      </div>
    </form>
  );
}
