export const WORKER_ACCESS_LINK_STATUSES = [
  "active",
  "suspended",
  "revoked",
] as const;

export type WorkerAccessLinkStatus =
  (typeof WORKER_ACCESS_LINK_STATUSES)[number];

export const WORKER_ACCESS_INVITATION_STATUSES = [
  "pending",
  "claimed",
  "revoked",
  "expired",
] as const;

export type WorkerAccessInvitationStatus =
  (typeof WORKER_ACCESS_INVITATION_STATUSES)[number];

export type WorkerAccessContext = {
  userId: string;
  workerId: string;
  organizationId: string;
  workerName: string;
};

export type WorkerAccessClaim = {
  workerName: string;
  invitationEmail: string;
  expiresAt: string;
};

export type WorkerAccessAdministration = {
  linkId: string | null;
  linkStatus: WorkerAccessLinkStatus | null;
  linkProfileId: string | null;
  invitationId: string | null;
  invitationStatus: WorkerAccessInvitationStatus | null;
  invitationEmail: string | null;
  invitationExpiresAt: string | null;
};
