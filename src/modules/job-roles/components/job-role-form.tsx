"use client";

import { useActionState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

import {
  createJobRoleAction,
  type JobRoleActionState,
  updateJobRoleAction,
} from "../actions";
import type { JobRole } from "../domain/job-role";

const initialState: JobRoleActionState = { error: null };

function ErrorText({ errors }: { errors?: string[] }) {
  return errors?.[0] ? <p className="text-sm text-destructive">{errors[0]}</p> : null;
}

export function JobRoleForm({ jobRole }: { jobRole?: JobRole }) {
  const handler = jobRole
    ? updateJobRoleAction.bind(null, jobRole.id)
    : createJobRoleAction;
  const [state, action, pending] = useActionState(handler, initialState);
  return (
    <form action={action} className="space-y-6" noValidate>
      <div className="space-y-2">
        <Label htmlFor="name">Nome</Label>
        <Input
          id="name"
          name="name"
          defaultValue={jobRole?.name}
          maxLength={160}
          required
        />
        <ErrorText errors={state.fieldErrors?.name} />
      </div>
      <div className="space-y-2">
        <Label htmlFor="description">Descrição</Label>
        <textarea
          id="description"
          name="description"
          defaultValue={jobRole?.description ?? ""}
          maxLength={2000}
          rows={5}
          className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
        />
        <ErrorText errors={state.fieldErrors?.description} />
      </div>
      {state.error ? (
        <p className="rounded-md border border-destructive/25 bg-destructive/5 px-3 py-2 text-sm text-destructive" role="alert">
          {state.error}
        </p>
      ) : null}
      <div className="flex justify-end">
        <Button type="submit" disabled={pending}>
          {pending ? "Salvando…" : jobRole ? "Salvar alterações" : "Cadastrar cargo"}
        </Button>
      </div>
    </form>
  );
}
