import { randomUUID } from "node:crypto";

import { createClient } from "@supabase/supabase-js";

import { requireIntegrationTestEnv } from "./helpers/integration-test-env.mjs";

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

const { supabaseUrl, publishableKey, serviceRoleKey } = requireIntegrationTestEnv();
const options = { auth: { autoRefreshToken: false, persistSession: false } };
const admin = createClient(supabaseUrl, serviceRoleKey, options);
const userIds = [];
const organizationIds = [];

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

async function createActor(organizationId, role, status, label) {
  const email = `admin-${label}-${Date.now()}-${randomUUID()}@example.invalid`;
  const { data: userData, error: userError } = await admin.auth.admin.createUser({
    email,
    password: randomUUID(),
    email_confirm: true,
  });
  if (userError) throw userError;
  const userId = userData.user.id;
  userIds.push(userId);

  const { error: profileError } = await admin
    .from("profiles")
    .insert({ id: userId, display_name: `Admin ${label}` });
  if (profileError) throw profileError;
  const { error: membershipError } = await admin.from("organization_members").insert({
    organization_id: organizationId,
    profile_id: userId,
    role,
    status,
  });
  if (membershipError) throw membershipError;

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
  return { client, userId };
}

try {
  const organizationA = await createOrganization(`Administration A ${Date.now()}`);
  const organizationB = await createOrganization(`Administration B ${Date.now()}`);
  const organizationLastDirector = await createOrganization(`Administration Last ${Date.now()}`);

  const directorA = await createActor(organizationA, "DIRECTOR", "active", "director-a");
  const targetA = await createActor(organizationA, "ADMINISTRATIVE", "active", "target-a");
  const unauthorizedA = await createActor(organizationA, "ADMINISTRATIVE", "active", "unauthorized-a");
  const inactiveA = await createActor(organizationA, "DIRECTOR", "inactive", "inactive-a");
  const directorB = await createActor(organizationB, "DIRECTOR", "active", "director-b");
  const targetB = await createActor(organizationB, "ADMINISTRATIVE", "active", "target-b");
  const lastDirector = await createActor(
    organizationLastDirector,
    "DIRECTOR",
    "active",
    "last-director",
  );

  const { error: roleChangeError } = await directorA.client.rpc(
    "change_organization_membership_with_audit",
    {
      organization_id: organizationA,
      target_profile_id: targetA.userId,
      target_role: "HR",
      target_status: "active",
    },
  );
  if (roleChangeError) throw roleChangeError;

  const { error: statusChangeError } = await directorA.client.rpc(
    "change_organization_membership_with_audit",
    {
      organization_id: organizationA,
      target_profile_id: targetA.userId,
      target_role: "HR",
      target_status: "inactive",
    },
  );
  if (statusChangeError) throw statusChangeError;

  const { data: membershipAudits, error: membershipAuditError } = await admin
    .from("audit_events")
    .select("actor_user_id, organization_id, metadata")
    .eq("entity_type", "organization_member")
    .eq("entity_id", targetA.userId)
    .eq("action", "membership_change")
    .order("created_at", { ascending: true });
  if (membershipAuditError) throw membershipAuditError;
  assert(membershipAudits.length === 2, "Role/status changes did not create two audit events");
  assert(membershipAudits[0].metadata.changes.includes("role"), "Role change was not audited");
  assert(membershipAudits[1].metadata.changes.includes("status"), "Status change was not audited");
  assert(
    membershipAudits.every(
      (event) =>
        event.actor_user_id === directorA.userId && event.organization_id === organizationA,
    ),
    "Administrative audit actor or Organization is incorrect",
  );

  const deniedInput = {
    organization_id: organizationA,
    target_profile_id: unauthorizedA.userId,
    target_role: "HR",
    target_status: "active",
  };
  const { error: unauthorizedError } = await unauthorizedA.client.rpc(
    "change_organization_membership_with_audit",
    deniedInput,
  );
  assert(unauthorizedError?.code === "42501", "Role without permission changed membership");

  const { error: crossOrganizationError } = await directorB.client.rpc(
    "change_organization_membership_with_audit",
    deniedInput,
  );
  assert(crossOrganizationError?.code === "42501", "Cross-Organization actor changed membership");

  const { error: inactiveError } = await inactiveA.client.rpc(
    "change_organization_membership_with_audit",
    deniedInput,
  );
  assert(inactiveError?.code === "42501", "Inactive membership changed membership");

  const { error: directDmlError } = await directorA.client
    .from("organization_members")
    .update({ role: "DIRECTOR" })
    .eq("organization_id", organizationA)
    .eq("profile_id", unauthorizedA.userId);
  assert(directDmlError, "Direct organization_members UPDATE bypassed the RPC");

  const { error: lastDirectorError } = await lastDirector.client.rpc(
    "change_organization_membership_with_audit",
    {
      organization_id: organizationLastDirector,
      target_profile_id: lastDirector.userId,
      target_role: "ADMINISTRATIVE",
      target_status: "active",
    },
  );
  assert(lastDirectorError?.code === "P0001", "Last active DIRECTOR was demoted");

  const { error: auditBError } = await directorB.client.rpc(
    "change_organization_membership_with_audit",
    {
      organization_id: organizationB,
      target_profile_id: targetB.userId,
      target_role: "HR",
      target_status: "active",
    },
  );
  if (auditBError) throw auditBError;

  const { data: visibleAuditA, error: visibleAuditAError } = await directorA.client
    .from("audit_events")
    .select("organization_id");
  if (visibleAuditAError) throw visibleAuditAError;
  assert(visibleAuditA.length >= 2, "Authorized DIRECTOR could not read audit events");
  assert(
    visibleAuditA.every((event) => event.organization_id === organizationA),
    "Audit RLS leaked events from another Organization",
  );

  const { data: unauthorizedAudit, error: unauthorizedAuditError } =
    await unauthorizedA.client.from("audit_events").select("id");
  if (unauthorizedAuditError) throw unauthorizedAuditError;
  assert(unauthorizedAudit.length === 0, "Role without audit:read accessed audit events");

  console.log(
    JSON.stringify({
      roleChangeAudited: true,
      statusChangeAudited: true,
      roleWithoutPermissionDenied: true,
      crossOrganizationDenied: true,
      inactiveMembershipDenied: true,
      directDmlDenied: true,
      lastDirectorProtected: true,
      auditRlsIsolated: true,
    }),
  );
} finally {
  if (userIds.length) {
    await admin.from("audit_events").delete().in("entity_id", userIds);
    await admin.from("organization_members").delete().in("profile_id", userIds);
    await admin.from("profiles").delete().in("id", userIds);
  }
  for (const userId of userIds) await admin.auth.admin.deleteUser(userId);
  if (organizationIds.length) await admin.from("organizations").delete().in("id", organizationIds);
}
