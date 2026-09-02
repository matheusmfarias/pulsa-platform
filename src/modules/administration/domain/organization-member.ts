import { z } from "zod";

import {
  organizationRoleSchema,
  type OrganizationRole,
} from "@/modules/organizations/schemas/organization-role-schema";

export const membershipStatusSchema = z.enum(["active", "inactive"]);

export type MembershipStatus = z.infer<typeof membershipStatusSchema>;

export type OrganizationMember = {
  organization_id: string;
  profile_id: string;
  role: OrganizationRole;
  status: MembershipStatus;
  created_at: string;
  updated_at: string;
  profile: {
    id: string;
    display_name: string | null;
  } | null;
};

const organizationMemberSchema = z.object({
  organization_id: z.string().uuid(),
  profile_id: z.string().uuid(),
  role: organizationRoleSchema,
  status: membershipStatusSchema,
  created_at: z.string(),
  updated_at: z.string(),
  profile: z
    .object({ id: z.string().uuid(), display_name: z.string().nullable() })
    .nullable(),
});

export function parseOrganizationMember(value: unknown): OrganizationMember {
  return organizationMemberSchema.parse(value);
}

export const ORGANIZATION_ROLE_LABELS: Record<OrganizationRole, string> = {
  DIRECTOR: "Diretor",
  OPERATIONS_MANAGER: "Gerente de Operações",
  SUPERVISOR: "Supervisor",
  HR: "RH",
  RECRUITER: "Recrutador",
  ADMINISTRATIVE: "Administrativo",
};

export const MEMBERSHIP_STATUS_LABELS: Record<MembershipStatus, string> = {
  active: "Ativa",
  inactive: "Inativa",
};
