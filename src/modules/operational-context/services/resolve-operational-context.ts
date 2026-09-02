import { cache } from "react";
import { cookies } from "next/headers";

import { authorize, getAuthorizationContext } from "@/modules/authorization";
import { AppError } from "@/shared/errors";

import {
  parseOperationalContextCookie,
  resolveOperationalContextSelection,
  type OperationalContextOption,
  type OperationalContextState,
} from "../domain/operational-context";
import { findOperationalContextOptions } from "../repositories/operational-context-repository";

export const OPERATIONAL_CONTEXT_COOKIE = "pulsa-operational-context";

export async function listOperationalContextOptions(): Promise<
  OperationalContextOption[]
> {
  const authorization = await getAuthorizationContext();
  authorize(authorization, "client:read");
  authorize(authorization, "contract:read");

  const { data, error } = await findOperationalContextOptions(
    authorization.organizationId,
  );
  if (error) {
    throw new AppError(
      "INFRASTRUCTURE",
      "Falha ao carregar o contexto operacional.",
    );
  }

  return (data ?? []).map((client) => ({
    id: client.id,
    name: client.trade_name,
    status: client.status,
    contracts: (client.contracts ?? []).map((contract) => ({
      id: contract.id,
      name: contract.name,
      status: contract.status,
    })),
  }));
}

async function resolveOperationalContextUncached(): Promise<OperationalContextState> {
  const [cookieStore, options] = await Promise.all([
    cookies(),
    listOperationalContextOptions(),
  ]);
  const requested = parseOperationalContextCookie(
    cookieStore.get(OPERATIONAL_CONTEXT_COOKIE)?.value,
  );
  return {
    context: resolveOperationalContextSelection(requested, options),
    options,
  };
}

export const resolveOperationalContext = cache(
  resolveOperationalContextUncached,
);
