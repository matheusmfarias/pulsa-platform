import { randomUUID } from "node:crypto";

import { createClient } from "@supabase/supabase-js";

import { requireIntegrationTestEnv } from "./helpers/integration-test-env.mjs";

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function makeCpf(seed) {
  const base = seed.padStart(9, "0").slice(-9).split("").map(Number);
  const digit = (values, factor) => {
    const remainder = values.reduce((sum, value) => sum + value * factor--, 0) % 11;
    return remainder < 2 ? 0 : 11 - remainder;
  };
  const first = digit(base, 10);
  return [...base, first, digit([...base, first], 11)].join("");
}

const { supabaseUrl, publishableKey, serviceRoleKey } = requireIntegrationTestEnv();

const options = { auth: { autoRefreshToken: false, persistSession: false } };
const admin = createClient(supabaseUrl, serviceRoleKey, options);
const { data: membership, error: membershipError } = await admin
  .from("organization_members")
  .select("organization_id, profile_id")
  .eq("status", "active")
  .eq("role", "DIRECTOR")
  .limit(1)
  .single();
if (membershipError) throw membershipError;

async function authenticatedClientFor(user) {
  const { data: link, error: linkError } = await admin.auth.admin.generateLink({ type: "magiclink", email: user.email });
  if (linkError) throw linkError;
  const client = createClient(supabaseUrl, publishableKey, options);
  const { error } = await client.auth.verifyOtp({ type: "magiclink", token_hash: link.properties.hashed_token });
  if (error) throw error;
  return client;
}

const { data: users, error: usersError } = await admin.auth.admin.listUsers();
if (usersError) throw usersError;
const director = users.users.find((user) => user.id === membership.profile_id);
assert(director?.email, "Director Auth user unavailable");
const actor = await authenticatedClientFor(director);

const { data: worker, error: workerError } = await admin
  .from("workers")
  .select("id")
  .eq("organization_id", membership.organization_id)
  .eq("status", "active")
  .limit(1)
  .single();
if (workerError) throw workerError;
const { data: position, error: positionError } = await admin
  .from("positions")
  .select("id, unit_id, job_role_id")
  .eq("status", "active")
  .limit(1)
  .single();
if (positionError) throw positionError;

const suffix = String(Date.now()).slice(-9);
let assignmentId;
let noMembershipUserId;
let incompatibleWorkerId;
let inactivePositionId;
let otherOrganizationId;
let otherWorkerId;

try {
  const { data: assignment, error: createError } = await actor.rpc("mutate_assignment_with_audit", {
    operation: "create",
    worker_id: worker.id,
    position_id: position.id,
    start_date: "2199-01-01",
    end_date: "2199-01-10",
  });
  if (createError) throw createError;
  assignmentId = assignment.id;

  const { data: audit, error: auditError } = await admin
    .from("audit_events")
    .select("actor_user_id, organization_id, action, metadata")
    .eq("entity_type", "assignment")
    .eq("entity_id", assignmentId)
    .single();
  if (auditError) throw auditError;
  assert(audit.actor_user_id === membership.profile_id, "Wrong Assignment audit actor");
  assert(audit.organization_id === membership.organization_id, "Wrong Assignment audit organization");
  assert(audit.action === "create", "Wrong Assignment audit action");

  const { error: updateError } = await actor.rpc("mutate_assignment_with_audit", {
    operation: "update",
    entity_id: assignmentId,
    worker_id: worker.id,
    position_id: position.id,
    start_date: "2199-01-01",
    end_date: "2199-01-12",
  });
  if (updateError) throw updateError;
  const { data: updateAudit, error: updateAuditError } = await admin
    .from("audit_events")
    .select("metadata")
    .eq("entity_id", assignmentId)
    .eq("action", "update")
    .single();
  if (updateAuditError) throw updateAuditError;
  assert(updateAudit.metadata.changes.includes("end_date"), "Assignment update was not audited");

  const { error: statusError } = await actor.rpc("mutate_assignment_with_audit", {
    operation: "status_change",
    entity_id: assignmentId,
    target_status: "active",
  });
  if (statusError) throw statusError;
  const { data: statusAudit, error: statusAuditError } = await admin
    .from("audit_events")
    .select("metadata")
    .eq("entity_id", assignmentId)
    .eq("action", "status_change")
    .single();
  if (statusAuditError) throw statusAuditError;
  assert(statusAudit.metadata.previous_state.status === "pending", "Wrong previous Assignment status");
  assert(statusAudit.metadata.new_state.status === "active", "Wrong new Assignment status");

  const { count: beforeOverlap } = await admin.from("audit_events").select("id", { count: "exact", head: true }).eq("entity_type", "assignment");
  const { error: overlapError } = await actor.rpc("mutate_assignment_with_audit", {
    operation: "create",
    worker_id: worker.id,
    position_id: position.id,
    start_date: "2199-01-05",
    end_date: "2199-01-20",
  });
  assert(overlapError?.code === "23P01", "Overlapping pending Assignment was not rejected");
  const { count: afterOverlap } = await admin.from("audit_events").select("id", { count: "exact", head: true }).eq("entity_type", "assignment");
  assert(beforeOverlap === afterOverlap, "Failed overlap created an audit event");

  const { data: incompatibleWorker, error: incompatibleWorkerError } = await admin
    .from("workers")
    .insert({
      organization_id: membership.organization_id,
      full_name: `Assignment Incompatible ${suffix}`,
      document_number: makeCpf(String(Number(suffix) + 1)),
      status: "onboarding",
    })
    .select("id")
    .single();
  if (incompatibleWorkerError) throw incompatibleWorkerError;
  incompatibleWorkerId = incompatibleWorker.id;
  const { error: incompatibleError } = await actor.rpc("mutate_assignment_with_audit", {
    operation: "create",
    worker_id: incompatibleWorkerId,
    position_id: position.id,
    start_date: "2199-02-01",
  });
  assert(incompatibleError?.code === "23514", "Incompatible Worker was accepted");

  const { data: inactivePosition, error: inactivePositionError } = await admin
    .from("positions")
    .insert({ unit_id: position.unit_id, job_role_id: position.job_role_id, base_required_headcount: 0, status: "inactive" })
    .select("id")
    .single();
  if (inactivePositionError) throw inactivePositionError;
  inactivePositionId = inactivePosition.id;
  const { error: inactivePositionAssignmentError } = await actor.rpc("mutate_assignment_with_audit", {
    operation: "create",
    worker_id: worker.id,
    position_id: inactivePositionId,
    start_date: "2199-02-01",
  });
  assert(inactivePositionAssignmentError?.code === "23514", "Inactive Position was accepted");

  const { data: otherOrganization, error: otherOrganizationError } = await admin
    .from("organizations")
    .insert({ legal_name: `Assignment Other ${suffix}`, trade_name: `Other ${suffix}`, status: "active" })
    .select("id")
    .single();
  if (otherOrganizationError) throw otherOrganizationError;
  otherOrganizationId = otherOrganization.id;
  const { data: otherWorker, error: otherWorkerError } = await admin
    .from("workers")
    .insert({ organization_id: otherOrganizationId, full_name: `Other Worker ${suffix}`, document_number: makeCpf(String(Number(suffix) + 2)), status: "active" })
    .select("id")
    .single();
  if (otherWorkerError) throw otherWorkerError;
  otherWorkerId = otherWorker.id;
  const { error: crossOrganizationError } = await actor.rpc("mutate_assignment_with_audit", {
    operation: "create",
    worker_id: otherWorkerId,
    position_id: position.id,
    start_date: "2199-03-01",
  });
  assert(crossOrganizationError?.code === "23514", "Cross-organization Assignment was accepted");

  const temporaryEmail = `assignment-rls-${suffix}@example.invalid`;
  const { data: temporaryUser, error: temporaryUserError } = await admin.auth.admin.createUser({ email: temporaryEmail, password: randomUUID(), email_confirm: true });
  if (temporaryUserError) throw temporaryUserError;
  noMembershipUserId = temporaryUser.user.id;
  const { error: profileError } = await admin.from("profiles").insert({ id: noMembershipUserId, display_name: "Assignment RLS Validation" });
  if (profileError) throw profileError;
  const noMembershipClient = await authenticatedClientFor(temporaryUser.user);
  const { data: noMembershipRows, error: noMembershipReadError } = await noMembershipClient.from("assignments").select("id").eq("id", assignmentId);
  if (noMembershipReadError) throw noMembershipReadError;
  assert(noMembershipRows.length === 0, "User without membership read Assignment");
  const { error: noMembershipWriteError } = await noMembershipClient.rpc("mutate_assignment_with_audit", {
    operation: "create", worker_id: worker.id, position_id: position.id, start_date: "2199-04-01",
  });
  assert(noMembershipWriteError?.code === "42501", "User without membership mutated Assignment");

  const { error: inactiveMembershipError } = await admin.from("organization_members").insert({ organization_id: membership.organization_id, profile_id: noMembershipUserId, role: "ADMINISTRATIVE", status: "inactive" });
  if (inactiveMembershipError) throw inactiveMembershipError;
  const { data: inactiveRows, error: inactiveReadError } = await noMembershipClient.from("assignments").select("id").eq("id", assignmentId);
  if (inactiveReadError) throw inactiveReadError;
  assert(inactiveRows.length === 0, "Inactive member read Assignment");

  const { data: activeRows, error: activeReadError } = await actor.from("assignments").select("id").eq("id", assignmentId);
  if (activeReadError) throw activeReadError;
  assert(activeRows.length === 1, "Active member could not read Assignment");

  console.log(JSON.stringify({
    auditAtomic: true,
    updateAudited: true,
    statusChangeAudited: true,
    overlapBlocked: true,
    workerCompatibilityEnforced: true,
    positionCompatibilityEnforced: true,
    crossOrganizationBlocked: true,
    activeMembershipAllowed: true,
    missingMembershipDenied: true,
    inactiveMembershipDenied: true,
  }));
} finally {
  if (assignmentId) {
    await admin.from("audit_events").delete().eq("entity_id", assignmentId);
    await admin.from("assignments").delete().eq("id", assignmentId);
  }
  if (inactivePositionId) await admin.from("positions").delete().eq("id", inactivePositionId);
  if (incompatibleWorkerId) await admin.from("workers").delete().eq("id", incompatibleWorkerId);
  if (otherWorkerId) await admin.from("workers").delete().eq("id", otherWorkerId);
  if (otherOrganizationId) await admin.from("organizations").delete().eq("id", otherOrganizationId);
  if (noMembershipUserId) {
    await admin.from("organization_members").delete().eq("profile_id", noMembershipUserId);
    await admin.from("profiles").delete().eq("id", noMembershipUserId);
    await admin.auth.admin.deleteUser(noMembershipUserId);
  }
}
