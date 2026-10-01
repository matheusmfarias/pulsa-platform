"use client";

import { useActionState, useCallback, useEffect, useRef, type FormEvent, type FormEventHandler } from "react";

type ActionState = { error: string | null };
type FormAction<State extends ActionState> = (
  previousState: State,
  formData: FormData,
) => Promise<State>;

type SubmittedValues = Map<string, string[]>;

function snapshotForm(form: HTMLFormElement): SubmittedValues {
  const values = new Map<string, string[]>();
  for (const [name, value] of new FormData(form).entries()) {
    if (typeof value !== "string") continue;
    const entries = values.get(name) ?? [];
    entries.push(value);
    values.set(name, entries);
  }
  return values;
}

function restoreForm(form: HTMLFormElement, values: SubmittedValues): void {
  for (const control of Array.from(form.elements)) {
    if (!(control instanceof HTMLInputElement || control instanceof HTMLSelectElement || control instanceof HTMLTextAreaElement)) continue;
    if (!control.name || control.disabled || control instanceof HTMLInputElement && ["button", "submit", "reset", "image", "file"].includes(control.type)) continue;

    const submitted = values.get(control.name) ?? [];
    if (control instanceof HTMLInputElement && ["checkbox", "radio"].includes(control.type)) {
      control.checked = submitted.includes(control.value);
    } else if (control instanceof HTMLSelectElement && control.multiple) {
      for (const option of Array.from(control.options)) option.selected = submitted.includes(option.value);
    } else {
      control.value = submitted[0] ?? "";
    }
  }
}

/** Preserves submitted values when an action returns an error state and React resets the form. */
export function usePreservedActionState<State extends ActionState>(
  action: FormAction<State>,
  initialState: State,
) {
  const formRef = useRef<HTMLFormElement>(null);
  const submittedValues = useRef<SubmittedValues | null>(null);
  const preserveNextReset = useRef(false);
  const wrappedAction = useCallback(async (previousState: State, formData: FormData) => {
    const result = await action(previousState, formData);
    preserveNextReset.current = Boolean(result.error);
    return result;
  }, [action]);
  const [state, formAction, pending] = useActionState(
    wrappedAction as unknown as (
      previousState: Awaited<State>,
      formData: FormData,
    ) => Awaited<State> | Promise<Awaited<State>>,
    initialState as unknown as Awaited<Awaited<State>>,
  );

  const onSubmit = useCallback((event: FormEvent<HTMLFormElement>) => {
    submittedValues.current = snapshotForm(event.currentTarget);
  }, []);
  const onReset: FormEventHandler<HTMLFormElement> = useCallback((event) => {
    if (!preserveNextReset.current) return;
    event.preventDefault();
    preserveNextReset.current = false;
  }, []);

  useEffect(() => {
    if (!state.error || !submittedValues.current || !formRef.current) return;
    const values = submittedValues.current;
    submittedValues.current = null;
    restoreForm(formRef.current, values);
  }, [state]);

  return [state, formAction, pending, formRef, onSubmit, onReset] as const;
}
