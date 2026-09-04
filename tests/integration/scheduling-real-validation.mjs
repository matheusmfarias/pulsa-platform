import { randomUUID } from "node:crypto";

import { createClient } from "@supabase/supabase-js";

import { requireIntegrationTestEnv } from "./helpers/integration-test-env.mjs";

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function failAt(step, error) {
  throw new Error(
    `Scheduling real validation failed at ${step}: ${error.code ?? "unknown"} ${error.message ?? String(error)}`,
    { cause: error },
  );
}

function documentNumber(offset) {
  return String((Date.now() + offset) % 10 ** 11).padStart(11, "0");
}

const { supabaseUrl, publishableKey, serviceRoleKey } = requireIntegrationTestEnv();
const options = { auth: { autoRefreshToken: false, persistSession: false } };
const admin = createClient(supabaseUrl, serviceRoleKey, options);

async function authenticatedClientFor(user) {
  const { data: link, error: linkError } = await admin.auth.admin.generateLink({ type: "magiclink", email: user.email });
  if (linkError) failAt("generate authentication link", linkError);

  const client = createClient(supabaseUrl, publishableKey, options);
  const { error } = await client.auth.verifyOtp({ type: "magiclink", token_hash: link.properties.hashed_token });
  if (error) failAt("authenticate test user", error);
  return client;
}

async function createScheduleWithDraft(actor, organizationId, operationId, periodStart, periodEnd) {
  const { data: schedule, error: scheduleError } = await actor.rpc("create_schedule", {
    organization_id: organizationId,
    operation_id: operationId,
    period_start: periodStart,
    period_end: periodEnd,
  });
  if (scheduleError) failAt("create Schedule", scheduleError);

  const { data: revision, error: revisionError } = await actor
    .from("schedule_revisions")
    .select("id, version, status")
    .eq("schedule_id", schedule.id)
    .single();
  if (revisionError) failAt("load initial draft ScheduleRevision", revisionError);
  return { schedule, revision };
}

const suffix = String(Date.now()).slice(-6);
const { data: organization, error: organizationError } = await admin
  .from("organizations")
  .insert({
    legal_name: `Scheduling Validation ${suffix} Ltda`,
    trade_name: `Scheduling ${suffix}`,
    status: "active",
  })
  .select("id")
  .single();
if (organizationError) failAt("create isolated Organization fixture", organizationError);

const actorEmail = `scheduling-director-${suffix}-${randomUUID()}@example.invalid`;
const { data: actorUserData, error: actorUserError } = await admin.auth.admin.createUser({
  email: actorEmail,
  password: randomUUID(),
  email_confirm: true,
});
if (actorUserError) failAt("create DIRECTOR fixture user", actorUserError);
const actorUser = actorUserData.user;
const { error: actorProfileError } = await admin.from("profiles").insert({
  id: actorUser.id,
  display_name: "Scheduling Validation Director",
});
if (actorProfileError) failAt("create DIRECTOR fixture profile", actorProfileError);
const { error: actorMembershipError } = await admin.from("organization_members").insert({
  organization_id: organization.id,
  profile_id: actorUser.id,
  role: "DIRECTOR",
  status: "active",
});
if (actorMembershipError) failAt("create active DIRECTOR fixture membership", actorMembershipError);
const actor = await authenticatedClientFor(actorUser);

async function actorRpc(name, args, step) {
  const { data, error } = await actor.rpc(name, args);
  if (error) failAt(step, error);
  return data;
}

const client = await actorRpc("mutate_client_with_audit", {
  operation: "create",
  organization_id: organization.id,
  legal_name: `Scheduling Client ${suffix} Ltda`,
  trade_name: `Scheduling Client ${suffix}`,
  document_number: documentNumber(1).padStart(14, "0"),
}, "create Client fixture");
const contract = await actorRpc("mutate_contract_with_audit", {
  operation: "create",
  client_id: client.id,
  name: `Scheduling Contract ${suffix}`,
  start_date: "2199-01-01",
  end_date: "2199-12-31",
  external_reference: `SCHED-${suffix}`,
}, "create Contract fixture");
await actorRpc("mutate_contract_with_audit", {
  operation: "status_change",
  entity_id: contract.id,
  target_status: "active",
}, "activate Contract fixture");
const operation = await actorRpc("mutate_operation_with_audit", {
  operation: "create",
  contract_id: contract.id,
  name: `Scheduling Operation ${suffix}`,
  start_date: "2199-01-01",
  end_date: "2199-12-31",
  manager_user_id: actorUser.id,
}, "create Operation fixture");
const unit = await actorRpc("mutate_unit_with_audit", {
  operation: "create",
  operation_id: operation.id,
  name: `Scheduling Unit ${suffix}`,
  code: `SCHED-${suffix}`,
  timezone: "America/Sao_Paulo",
}, "create Unit fixture");
const jobRole = await actorRpc("mutate_job_role_with_audit", {
  operation: "create",
  organization_id: organization.id,
  name: `Scheduling Job Role ${suffix}`,
}, "create JobRole fixture");
const position = await actorRpc("mutate_position_with_audit", {
  operation: "create",
  unit_id: unit.id,
  job_role_id: jobRole.id,
  base_required_headcount: 1,
}, "create Position fixture");
const worker = await actorRpc("mutate_worker_with_audit", {
  operation: "create",
  organization_id: organization.id,
  full_name: `Scheduling Worker ${suffix}`,
  document_number: documentNumber(2),
  engagement_start_date: "2199-01-01",
  engagement_end_date: "2199-12-31",
}, "create Worker fixture");
await actorRpc("mutate_worker_with_audit", {
  operation: "status_change",
  entity_id: worker.id,
  target_status: "active",
}, "activate Worker fixture");
const assignment = await actorRpc("mutate_assignment_with_audit", {
  operation: "create",
  worker_id: worker.id,
  position_id: position.id,
  start_date: "2199-01-01",
  end_date: "2199-12-31",
}, "create Assignment fixture");
await actorRpc("mutate_assignment_with_audit", {
  operation: "status_change",
  entity_id: assignment.id,
  target_status: "active",
}, "activate Assignment fixture");

const operationId = operation.id;
const publishedPeriod = "2199-06-10";
const conflictPeriod = "2199-06-11";
let recruiterUserId;

try {
  const { schedule, revision } = await createScheduleWithDraft(
    actor,
    organization.id,
    operationId,
    publishedPeriod,
    publishedPeriod,
  );
  const entryPayload = {
    schedule_revision_id: revision.id,
    assignment_id: assignment.id,
    starts_at: `${publishedPeriod}T11:00:00Z`,
    ends_at: `${publishedPeriod}T19:00:00Z`,
  };
  const { data: entry, error: entryError } = await actor.rpc("create_schedule_entry", entryPayload);
  if (entryError) failAt("create ScheduleEntry", entryError);

  for (const rpc of ["submit_schedule_revision", "approve_schedule_revision", "publish_schedule_revision"]) {
    const { error } = await actor.rpc(rpc, { schedule_revision_id: revision.id });
    if (error) failAt(`transition ScheduleRevision via ${rpc}`, error);
  }

  const { error: immutableError } = await actor.rpc("update_schedule_entry", {
    entry_id: entry.id,
    assignment_id: assignment.id,
    starts_at: `${publishedPeriod}T11:00:00Z`,
    ends_at: `${publishedPeriod}T19:00:00Z`,
  });
  assert(immutableError?.code === "23514", "Published ScheduleEntry accepted direct editing");

  const { data: successor, error: successorError } = await actor.rpc("create_schedule_revision_from_published", {
    schedule_revision_id: revision.id,
  });
  if (successorError) failAt("create draft from published ScheduleRevision", successorError);
  assert(successor.status === "draft", "Revision copied from published is not a draft");
  assert(successor.version === revision.version + 1, "Copied revision has wrong version");
  assert(successor.based_on_revision_id === revision.id, "Copied revision lost its source");

  const { count: copiedEntries, error: copiedEntriesError } = await actor
    .from("schedule_entries")
    .select("id", { count: "exact", head: true })
    .eq("schedule_revision_id", successor.id);
  if (copiedEntriesError) failAt("count copied ScheduleEntries", copiedEntriesError);
  assert(copiedEntries === 1, "Copied revision did not preserve its entries");

  const { data: source, error: sourceError } = await actor
    .from("schedule_revisions")
    .select("status")
    .eq("id", revision.id)
    .single();
  if (sourceError) failAt("load source published ScheduleRevision", sourceError);
  assert(source.status === "published", "Source published revision was changed");

  const { revision: conflictingRevision } = await createScheduleWithDraft(
    actor,
    organization.id,
    operationId,
    conflictPeriod,
    conflictPeriod,
  );
  for (const [starts_at, ends_at] of [
    [`${conflictPeriod}T11:00:00Z`, `${conflictPeriod}T19:00:00Z`],
    [`${conflictPeriod}T15:00:00Z`, `${conflictPeriod}T23:00:00Z`],
  ]) {
    const { error } = await actor.rpc("create_schedule_entry", {
      schedule_revision_id: conflictingRevision.id,
      assignment_id: assignment.id,
      starts_at,
      ends_at,
    });
    if (error) failAt("create conflicting ScheduleEntry fixture", error);
  }
  const { error: workerOverlapError } = await actor.rpc("submit_schedule_revision", {
    schedule_revision_id: conflictingRevision.id,
  });
  assert(workerOverlapError?.code === "23P01", "Worker overlap did not block ScheduleRevision submission");

  const temporaryEmail = `scheduling-permission-${suffix}@example.invalid`;
  const { data: recruiter, error: recruiterError } = await admin.auth.admin.createUser({
    email: temporaryEmail,
    password: randomUUID(),
    email_confirm: true,
  });
  if (recruiterError) failAt("create RECRUITER fixture user", recruiterError);
  recruiterUserId = recruiter.user.id;
  const { error: profileError } = await admin.from("profiles").insert({
    id: recruiterUserId,
    display_name: "Scheduling Permission Validation",
  });
  if (profileError) failAt("create RECRUITER fixture profile", profileError);
  const { error: memberError } = await admin.from("organization_members").insert({
    organization_id: organization.id,
    profile_id: recruiterUserId,
    role: "RECRUITER",
    status: "active",
  });
  if (memberError) failAt("create RECRUITER fixture membership", memberError);
  const recruiterClient = await authenticatedClientFor(recruiter.user);
  const { error: deniedError } = await recruiterClient.rpc("create_schedule", {
    organization_id: organization.id,
    operation_id: operationId,
    period_start: "2199-06-12",
    period_end: "2199-06-12",
  });
  assert(deniedError?.code === "42501", "User without schedule:create mutated Scheduling");

  console.log(JSON.stringify({
    lifecyclePublished: true,
    publishedEntryImmutable: true,
    publishedRevisionPreserved: true,
    workerOverlapBlocked: true,
    mutationPermissionDenied: true,
    scheduleId: schedule.id,
  }));
} finally {
  if (recruiterUserId) {
    await admin.from("organization_members").delete().eq("profile_id", recruiterUserId);
    await admin.from("profiles").delete().eq("id", recruiterUserId);
    await admin.auth.admin.deleteUser(recruiterUserId);
  }
}
