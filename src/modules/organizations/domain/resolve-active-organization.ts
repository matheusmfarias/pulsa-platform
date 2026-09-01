import { AppError } from "@/shared/errors";

type Membership = { organization_id: string };

export function resolveSingleActiveOrganization(
  memberships: Membership[],
): string {
  if (memberships.length === 0) {
    throw new AppError(
      "AUTHORIZATION",
      "Seu usuário não possui uma organização ativa.",
    );
  }

  if (memberships.length > 1) {
    throw new AppError(
      "CONFLICT",
      "Seu usuário possui mais de uma organização ativa. Contate o administrador.",
    );
  }

  return memberships[0].organization_id;
}
