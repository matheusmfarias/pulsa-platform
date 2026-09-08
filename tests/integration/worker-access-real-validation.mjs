import { createHash, randomBytes, randomUUID } from "node:crypto";

import { createClient } from "@supabase/supabase-js";

import { requireIntegrationTestEnv } from "./helpers/integration-test-env.mjs";

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function cpfFromSeed(seed) {
  const base = String(seed).padStart(9, "0").slice(-9).split("").map(Number);
  const digit = (digits, weight) => {
    const remainder = digits.reduce((sum, value, index) => sum + value * (weight - index), 0) % 11;
    return remainder < 2 ? 0 : 11 - remainder;
  };
  base.push(digit(base, 10));
  base.push(digit(base, 11));
  return base.join("");
}

const { supabaseUrl, publishableKey, serviceRoleKey } = requireIntegrationTestEnv();
const options = { auth: { autoRefreshToken: false, persistSession: false } };
const admin = createClient(supabaseUrl, serviceRoleKey, options);
const userIds = [];
const workerIds = [];
const organizationIds = [];
const marker = `${Date.now()}-${randomUUID()}`;
let cpfSeed = Number(String(Date.now()).slice(-8));

async function createOrganization(label) {
  const { data, error } = await admin
    .from("organizations")
    .insert({ legal_name: `${label} Ltda`, trade_name: label, status: "active" })
    .select("id")
    .single();
  if (error) throw error;
  organizationIds.push(data.id);
  return data.id;
}

async function createUser(label, membership) {
  const email = `worker-access-${label}-${marker}@example.invalid`;
  const { data, error } = await admin.auth.admin.createUser({
    email,
    password: randomUUID(),
    email_confirm: true,
  });
  if (error) throw error;
  const userId = data.user.id;
  userIds.push(userId);

  if (membership) {
    const { error: profileError } = await admin
      .from("profiles")
      .insert({ id: userId, display_name: label });
    if (profileError) throw profileError;
    const { error: membershipError } = await admin
      .from("organization_members")
      .insert({
        organization_id: membership.organizationId,
        profile_id: userId,
        role: membership.role,
        status: "active",
      });
    if (membershipError) throw membershipError;
  }

  const { data: link, error: linkError } = await admin.auth.admin.generateLink({
    type: "magiclink",
    email,
  });
  if (linkError) throw linkError;
  const client = createClient(supabaseUrl, publishableKey, options);
  const { error: verifyError } = await client.auth.verifyOtp({
    type: "magiclink",
    token_hash: link.properties.hashed_token,
  });
  if (verifyError) throw verifyError;
  return { client, email, userId };
}

async function createWorker(organizationId, label) {
  cpfSeed += 1;
  const { data, error } = await admin
    .from("workers")
    .insert({
      organization_id: organizationId,
      full_name: `Worker ${label}`,
      document_number: cpfFromSeed(cpfSeed),
      status: "active",
      engagement_start_date: "2026-01-01",
    })
    .select("id")
    .single();
  if (error) throw error;
  workerIds.push(data.id);
  return data.id;
}

async function invite(director, organizationId, workerId, target) {
  const token = randomBytes(32).toString("hex");
  const result = await director.client.rpc("invite_worker_access", {
    organization_id: organizationId,
    worker_id: workerId,
    target_auth_user_id: target.userId,
    target_email: target.email,
    invitation_token_hash: createHash("sha256").update(token).digest("hex"),
  });
  return { ...result, token };
}

async function setWorkerStatus(director, organizationId, workerId, status) {
  const { error } = await director.client.rpc("mutate_worker_with_audit", {
    operation: "status_change",
    entity_id: workerId,
    organization_id: organizationId,
    target_status: status,
  });
  if (error) throw error;
}

try {
  const unknownLoginEmail = `worker-access-unknown-${marker}@example.invalid`;
  const unknownLoginClient = createClient(supabaseUrl, publishableKey, options);
  await unknownLoginClient.auth.signInWithOtp({
    email: unknownLoginEmail,
    options: { shouldCreateUser: false },
  });
  const { data: authUsersAfterUnknownLogin, error: authUsersListError } =
    await admin.auth.admin.listUsers({ page: 1, perPage: 1000 });
  if (authUsersListError) throw authUsersListError;
  assert(
    !authUsersAfterUnknownLogin.users.some((user) => user.email === unknownLoginEmail),
    "Recurring Worker login created an arbitrary Auth User",
  );

  const provisionedEmail = `worker-access-provisioned-${marker}@example.invalid`;
  const { data: provisionedAuth, error: provisionedAuthError } =
    await admin.auth.admin.createUser({
      email: provisionedEmail,
      email_confirm: false,
    });
  if (provisionedAuthError) throw provisionedAuthError;
  userIds.push(provisionedAuth.user.id);
  const provisionedLoginClient = createClient(supabaseUrl, publishableKey, options);
  const { error: provisionedOtpError } =
    await provisionedLoginClient.auth.signInWithOtp({
      email: provisionedEmail,
      options: {
        shouldCreateUser: false,
        emailRedirectTo: "http://localhost:3000/worker/sign-in?invitation=test",
      },
    });
  if (provisionedOtpError) throw provisionedOtpError;

  const organizationA = await createOrganization(`Worker Access A ${marker}`);
  const organizationB = await createOrganization(`Worker Access B ${marker}`);
  const director = await createUser("director", {
    organizationId: organizationA,
    role: "DIRECTOR",
  });
  const hr = await createUser("hr", { organizationId: organizationA, role: "HR" });
  const internalOnly = await createUser("internal", {
    organizationId: organizationA,
    role: "ADMINISTRATIVE",
  });

  const primary = await createUser("primary");
  const second = await createUser("second");
  const terminatedUser = await createUser("terminated");
  const stranger = await createUser("stranger");

  const primaryWorker = await createWorker(organizationA, "Primary");
  const secondWorker = await createWorker(organizationA, "Second");
  const thirdWorker = await createWorker(organizationA, "Third");
  const terminatedWorker = await createWorker(organizationA, "Terminated");
  const foreignWorker = await createWorker(organizationB, "Foreign");

  const { error: hrInviteError } = await invite(hr, organizationA, primaryWorker, primary);
  assert(hrInviteError?.code === "42501", "HR administered Worker access despite the documented matrix");

  const invitationResult = await invite(
    director,
    organizationA,
    primaryWorker,
    primary,
  );
  const { data: invitation, error: invitationError } = invitationResult;
  if (invitationError) throw invitationError;
  assert(invitation.worker_id === primaryWorker, "Invitation was not bound to the chosen Worker");
  assert(invitation.auth_user_id === primary.userId, "Invitation was not bound to the chosen Auth User");
  const { count: profileBeforeClaim, error: profileBeforeClaimError } = await admin
    .from("profiles")
    .select("id", { count: "exact", head: true })
    .eq("id", primary.userId);
  if (profileBeforeClaimError) throw profileBeforeClaimError;
  assert(profileBeforeClaim === 0, "Invitation prematurely created a Worker profile");

  const { count: memberCount, error: memberCountError } = await admin
    .from("organization_members")
    .select("profile_id", { count: "exact", head: true })
    .eq("profile_id", primary.userId);
  if (memberCountError) throw memberCountError;
  assert(memberCount === 0, "Worker invitation created organization_members");

  const { error: strangerClaimError } = await stranger.client.rpc("claim_worker_access", {
    invitation_token: invitationResult.token,
  });
  assert(strangerClaimError?.code === "42501", "A different Auth User claimed another account's link");
  const { data: strangerClaim } = await stranger.client.rpc("get_worker_access_claim", {
    invitation_token: invitationResult.token,
  });
  assert(strangerClaim.length === 0, "An unrelated account enumerated a Worker invitation");

  const firstClaim = await primary.client.rpc("claim_worker_access", {
    invitation_token: invitationResult.token,
  });
  if (firstClaim.error) throw firstClaim.error;
  const { count: profileAfterClaim, error: profileAfterClaimError } = await admin
    .from("profiles")
    .select("id", { count: "exact", head: true })
    .eq("id", primary.userId);
  if (profileAfterClaimError) throw profileAfterClaimError;
  assert(profileAfterClaim === 1, "Claim did not create the neutral Worker profile");
  const secondClaim = await primary.client.rpc("claim_worker_access", {
    invitation_token: invitationResult.token,
  });
  if (secondClaim.error) throw secondClaim.error;
  assert(firstClaim.data.id === secondClaim.data.id, "Claim was not idempotent");

  const { data: resolvedPrimary, error: resolvedPrimaryError } =
    await primary.client.rpc("resolve_worker_access");
  if (resolvedPrimaryError) throw resolvedPrimaryError;
  assert(resolvedPrimary[0].user_id === primary.userId, "Resolved the wrong Auth User");
  assert(resolvedPrimary[0].worker_id === primaryWorker, "Resolved the wrong Worker");
  assert(resolvedPrimary[0].organization_id === organizationA, "Derived the wrong Organization");

  const { data: workerMembers, error: workerMembersError } = await primary.client
    .from("organization_members")
    .select("profile_id");
  if (workerMembersError) throw workerMembersError;
  assert(workerMembers.length === 0, "Worker acquired Backoffice membership visibility");
  const { data: backofficePermission, error: backofficePermissionError } =
    await primary.client.rpc("has_organization_permission", {
      target_organization_id: organizationA,
      required_permission: "worker:read",
    });
  if (backofficePermissionError) throw backofficePermissionError;
  assert(backofficePermission === false, "Worker Auth session acquired Backoffice permission");

  const { error: internalResolveError } = await internalOnly.client.rpc("resolve_worker_access");
  assert(internalResolveError?.code === "42501", "Backoffice membership alone granted Worker access");

  const duplicateWorker = await invite(director, organizationA, primaryWorker, second);
  assert(duplicateWorker.error?.code === "23505", "A Worker received two current links");
  const duplicateProfile = await invite(director, organizationA, thirdWorker, primary);
  assert(duplicateProfile.error?.code === "23505", "An Auth User received two current Worker links");

  const crossOrganization = await invite(director, organizationA, foreignWorker, second);
  assert(crossOrganization.error?.code === "P0002", "Cross-Organization Worker UUID was accepted");

  const directInsert = await primary.client.from("worker_access_links").insert({
    worker_id: thirdWorker,
    profile_id: primary.userId,
    activated_by: primary.userId,
  });
  assert(directInsert.error, "Direct Worker access DML bypassed the RPC boundary");
  const directRead = await primary.client.from("worker_access_links").select("id");
  assert(directRead.error, "Worker read worker_access_links directly");
  const unsafeRpc = await primary.client.rpc("invite_worker_access", {
    organization_id: organizationA,
    worker_id: thirdWorker,
    target_auth_user_id: stranger.userId,
    target_email: stranger.email,
    invitation_token_hash: createHash("sha256").update(randomUUID()).digest("hex"),
  });
  assert(unsafeRpc.error?.code === "42501", "Direct administrative RPC call bypassed RBAC");

  const suspended = await director.client.rpc("suspend_worker_access", {
    organization_id: organizationA,
    worker_id: primaryWorker,
    reason: "integration suspension",
  });
  if (suspended.error) throw suspended.error;
  const suspendedResolve = await primary.client.rpc("resolve_worker_access");
  assert(suspendedResolve.error?.code === "42501", "Suspended link passed the Worker boundary");
  const suspendedRow = await admin.from("worker_access_links").select("status").eq("id", firstClaim.data.id).single();
  if (suspendedRow.error) throw suspendedRow.error;
  assert(suspendedRow.data.status === "suspended", "Suspension deleted or rewrote link history");

  const resumed = await director.client.rpc("resume_worker_access", {
    organization_id: organizationA,
    worker_id: primaryWorker,
  });
  if (resumed.error) throw resumed.error;
  const revoked = await director.client.rpc("revoke_worker_access", {
    organization_id: organizationA,
    worker_id: primaryWorker,
    reason: "integration revocation",
  });
  if (revoked.error) throw revoked.error;
  const revokedResolve = await primary.client.rpc("resolve_worker_access");
  assert(revokedResolve.error?.code === "42501", "Revoked link passed the Worker boundary");
  const revokedRow = await admin.from("worker_access_links").select("status").eq("id", firstClaim.data.id).single();
  if (revokedRow.error) throw revokedRow.error;
  assert(revokedRow.data.status === "revoked", "Revocation did not preserve historical link");

  const secondInvitation = await invite(director, organizationA, secondWorker, second);
  if (secondInvitation.error) throw secondInvitation.error;
  const secondClaimResult = await second.client.rpc("claim_worker_access", {
    invitation_token: secondInvitation.token,
  });
  if (secondClaimResult.error) throw secondClaimResult.error;
  await setWorkerStatus(director, organizationA, secondWorker, "inactive");
  const inactiveResolve = await second.client.rpc("resolve_worker_access");
  assert(inactiveResolve.error?.code === "42501", "Inactive Worker passed the boundary");

  const terminatedInvitation = await invite(
    director,
    organizationA,
    terminatedWorker,
    terminatedUser,
  );
  if (terminatedInvitation.error) throw terminatedInvitation.error;
  const terminatedClaim = await terminatedUser.client.rpc("claim_worker_access", {
    invitation_token: terminatedInvitation.token,
  });
  if (terminatedClaim.error) throw terminatedClaim.error;
  await setWorkerStatus(director, organizationA, terminatedWorker, "terminated");
  const terminatedResolve = await terminatedUser.client.rpc("resolve_worker_access");
  assert(terminatedResolve.error?.code === "42501", "Terminated Worker passed the boundary");
  const terminatedLink = await admin
    .from("worker_access_links")
    .select("status, revocation_reason")
    .eq("id", terminatedClaim.data.id)
    .single();
  if (terminatedLink.error) throw terminatedLink.error;
  assert(
    terminatedLink.data.status === "revoked" &&
      terminatedLink.data.revocation_reason === "worker_terminated",
    "Termination did not revoke access atomically",
  );

  const { data: audits, error: auditError } = await admin
    .from("audit_events")
    .select("action, actor_user_id, entity_type, metadata")
    .eq("organization_id", organizationA)
    .in("entity_type", ["worker_access_invitation", "worker_access_link"]);
  if (auditError) throw auditError;
  for (const action of ["invite", "claim", "suspend", "resume", "revoke"]) {
    assert(audits.some((event) => event.action === action), `Missing ${action} audit event`);
  }
  assert(
    audits.some(
      (event) =>
        event.action === "claim" &&
        event.actor_user_id === primary.userId &&
        event.metadata.actor_worker_id === primaryWorker &&
        event.metadata.actor_surface === "worker_app",
    ),
    "Worker claim audit did not preserve Auth and Worker actor identity",
  );

  console.log(
    JSON.stringify({
      explicitProvisioning: true,
      recurringLoginDoesNotCreateUsers: true,
      provisionedAccountReceivesOtp: true,
      organizationMemberIsolation: true,
      oneToOneCurrentLinks: true,
      claimOwnershipAndIdempotency: true,
      workerBoundary: true,
      suspendedRevokedInactiveTerminatedBlocked: true,
      crossOrganizationBlocked: true,
      directDmlAndUnsafeRpcBlocked: true,
      historyPreserved: true,
      atomicAudit: true,
    }),
  );
} finally {
  if (organizationIds.length) {
    await admin.from("audit_events").delete().in("organization_id", organizationIds);
  }
  if (workerIds.length) {
    await admin.from("worker_access_links").delete().in("worker_id", workerIds);
    await admin.from("worker_access_invitations").delete().in("worker_id", workerIds);
    await admin.from("workers").delete().in("id", workerIds);
  }
  if (userIds.length) {
    await admin.from("organization_members").delete().in("profile_id", userIds);
    await admin.from("profiles").delete().in("id", userIds);
  }
  for (const userId of userIds) await admin.auth.admin.deleteUser(userId);
  if (organizationIds.length) {
    await admin.from("organizations").delete().in("id", organizationIds);
  }
}
