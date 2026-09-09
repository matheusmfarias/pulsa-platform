import type { PostgrestError } from "@supabase/supabase-js";

import { createServerSupabaseClient } from "@/shared/db/supabase";

export async function resolveWorkerAccessRecord() {
  const supabase = await createServerSupabaseClient();
  return supabase.rpc("resolve_worker_access").maybeSingle();
}

export async function findWorkerAccessClaimRecord(invitationToken: string) {
  const supabase = await createServerSupabaseClient();
  return supabase
    .rpc("get_worker_access_claim", { invitation_token: invitationToken })
    .maybeSingle();
}

export async function claimWorkerAccessRecord(invitationToken: string) {
  const supabase = await createServerSupabaseClient();
  return supabase.rpc("claim_worker_access", {
    invitation_token: invitationToken,
  });
}

export async function findMyPendingWorkerAccessClaimRecord() {
  const supabase = await createServerSupabaseClient();
  return supabase.rpc("get_my_pending_worker_access_claim").maybeSingle();
}

export async function claimMyWorkerAccessRecord() {
  const supabase = await createServerSupabaseClient();
  return supabase.rpc("claim_my_worker_access");
}

export async function getMyWorkerAccessHistoryStateRecord() {
  const supabase = await createServerSupabaseClient();
  return supabase.rpc("get_my_worker_access_history_state").single();
}

export async function findWorkerAccessAdministrationRecord(
  organizationId: string,
  workerId: string,
) {
  const supabase = await createServerSupabaseClient();
  return supabase
    .rpc("get_worker_access_administration", {
      organization_id: organizationId,
      worker_id: workerId,
    })
    .single();
}

export async function inviteWorkerAccessRecord(input: {
  organizationId: string;
  workerId: string;
  authUserId: string;
  email: string;
  invitationTokenHash: string;
}) {
  const supabase = await createServerSupabaseClient();
  return supabase.rpc("invite_worker_access", {
    organization_id: input.organizationId,
    worker_id: input.workerId,
    target_auth_user_id: input.authUserId,
    target_email: input.email,
    invitation_token_hash: input.invitationTokenHash,
  });
}

export async function suspendWorkerAccessRecord(input: {
  organizationId: string;
  workerId: string;
  reason: string;
}) {
  const supabase = await createServerSupabaseClient();
  return supabase.rpc("suspend_worker_access", {
    organization_id: input.organizationId,
    worker_id: input.workerId,
    reason: input.reason,
  });
}

export async function resumeWorkerAccessRecord(
  organizationId: string,
  workerId: string,
) {
  const supabase = await createServerSupabaseClient();
  return supabase.rpc("resume_worker_access", {
    organization_id: organizationId,
    worker_id: workerId,
  });
}

export async function revokeWorkerAccessRecord(input: {
  organizationId: string;
  workerId: string;
  reason: string;
}) {
  const supabase = await createServerSupabaseClient();
  return supabase.rpc("revoke_worker_access", {
    organization_id: input.organizationId,
    worker_id: input.workerId,
    reason: input.reason,
  });
}

export async function revokeWorkerAccessInvitationRecord(input: {
  organizationId: string;
  invitationId: string;
  reason: string;
}) {
  const supabase = await createServerSupabaseClient();
  return supabase.rpc("revoke_worker_access_invitation", {
    organization_id: input.organizationId,
    invitation_id: input.invitationId,
    reason: input.reason,
  });
}

export async function requestWorkerOtpRecord(
  email: string,
  emailRedirectTo?: string,
) {
  const supabase = await createServerSupabaseClient();
  return supabase.auth.signInWithOtp({
    email,
    options: { shouldCreateUser: false, emailRedirectTo },
  });
}

export async function verifyWorkerOtpRecord(email: string, token: string) {
  const supabase = await createServerSupabaseClient();
  return supabase.auth.verifyOtp({ email, token, type: "email" });
}

export async function requestWorkerPasswordResetRecord(
  email: string,
  redirectTo: string,
) {
  const supabase = await createServerSupabaseClient();
  return supabase.auth.resetPasswordForEmail(email, { redirectTo });
}

export type WorkerAccessRepositoryError = Pick<
  PostgrestError,
  "code" | "message"
>;
