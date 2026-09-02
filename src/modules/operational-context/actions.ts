"use server";

import { cookies } from "next/headers";

import {
  operationalContextSchema,
  resolveOperationalContextSelection,
  serializeOperationalContext,
} from "./domain/operational-context";
import {
  listOperationalContextOptions,
  OPERATIONAL_CONTEXT_COOKIE,
} from "./services/resolve-operational-context";

export type SetOperationalContextResult =
  | { ok: true }
  | { ok: false; message: string };

export async function setOperationalContextAction(
  input: unknown,
): Promise<SetOperationalContextResult> {
  const parsed = operationalContextSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, message: "Selecione um contexto válido." };
  }

  const options = await listOperationalContextOptions();
  const resolved = resolveOperationalContextSelection(parsed.data, options);
  if (
    serializeOperationalContext(resolved) !==
    serializeOperationalContext(parsed.data)
  ) {
    return { ok: false, message: "Esse contexto não está mais disponível." };
  }

  const cookieStore = await cookies();
  cookieStore.set(OPERATIONAL_CONTEXT_COOKIE, serializeOperationalContext(resolved), {
    httpOnly: true,
    maxAge: 60 * 60 * 24 * 365,
    path: "/app",
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
  });
  return { ok: true };
}
