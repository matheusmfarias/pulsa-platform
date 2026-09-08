import { randomUUID } from "node:crypto";

import { createClient } from "@supabase/supabase-js";

import { requireIntegrationTestEnv } from "./helpers/integration-test-env.mjs";

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function failAt(step, error) {
  throw new Error(
    `Presence real validation failed at ${step}: ${error.code ?? "unknown"} ${error.message ?? String(error)}`,
    { cause: error },
  );
}

const { supabaseUrl, publishableKey, serviceRoleKey } = requireIntegrationTestEnv();
const options = { auth: { autoRefreshToken: false, persistSession: false } };
const admin = createClient(supabaseUrl, serviceRoleKey, options);

const primaryOrganizationId = "00000000-0000-4000-8000-000000000001";
const operationId = "00000000-0000-4000-8000-000000000301";
const originalAssignmentId = "00000000-0000-4000-8000-000000000701";
const originalPositionId = "00000000-0000-4000-8000-000000000501";
const suffix = `${Date.now()}-${randomUUID().slice(0, 8)}`;
const fixtureDayOffset = Number.parseInt(randomUUID().replaceAll("-", "").slice(0, 8), 16) % 1_000_000;
const originalDate = new Date(Date.UTC(2200, 0, fixtureDayOffset + 1))
  .toISOString()
  .slice(0, 10);
const replacementDate = new Date(Date.UTC(2200, 0, fixtureDayOffset + 2))
  .toISOString()
  .slice(0, 10);

const userIds = [];
const presenceIds = [];
const absenceIds = [];
const replacementIds = [];
let otherOrganizationId;
let replacementAssignmentId;
let replacementWorkerId;

async function createActor(role, organizationId, label) {
  const email = `presence-${label}-${suffix}@example.invalid`;
  const { data: userData, error: userError } = await admin.auth.admin.createUser({
    email,
    password: randomUUID(),
    email_confirm: true,
  });
  if (userError) failAt(`create ${role} user`, userError);
  const userId = userData.user.id;
  userIds.push(userId);

  const { error: profileError } = await admin.from("profiles").insert({
    id: userId,
    display_name: `Presence ${role}`,
  });
  if (profileError) failAt(`create ${role} profile`, profileError);
  const { error: membershipError } = await admin.from("organization_members").insert({
    organization_id: organizationId,
    profile_id: userId,
    role,
    status: "active",
  });
  if (membershipError) failAt(`create ${role} membership`, membershipError);

  const { data: link, error: linkError } = await admin.auth.admin.generateLink({
    type: "magiclink",
    email,
  });
  if (linkError) failAt(`generate ${role} authentication link`, linkError);
  const client = createClient(supabaseUrl, publishableKey, options);
  const { error: authError } = await client.auth.verifyOtp({
    type: "magiclink",
    token_hash: link.properties.hashed_token,
  });
  if (authError) failAt(`authenticate ${role}`, authError);
  return { client, userId };
}

async function rpc(actor, name, args, step) {
  const { data, error } = await actor.rpc(name, args);
  if (error) failAt(step, error);
  return data;
}

const cleanupErrors = [];

async function cleanup(step, operation) {
  try {
    const { error } = await operation();
    if (error) throw error;
  } catch (error) {
    cleanupErrors.push(
      `${step}: ${error.code ?? "unknown"} ${error.message ?? String(error)}`,
    );
  }
}

async function cleanupAuditEvents(entityType, entityIds) {
  if (entityIds.length === 0) return;
  await cleanup(`delete ${entityType} audit events`, () =>
    admin
      .from("audit_events")
      .delete()
      .eq("entity_type", entityType)
      .in("entity_id", entityIds),
  );
}

async function createScheduleEntry(actor, date, publish = true) {
  const schedule = await rpc(actor, "create_schedule", {
    organization_id: primaryOrganizationId,
    operation_id: operationId,
    period_start: date,
    period_end: date,
  }, `create Schedule ${date}`);

  const { data: revision, error: revisionError } = await actor
    .from("schedule_revisions")
    .select("id")
    .eq("schedule_id", schedule.id)
    .single();
  if (revisionError) failAt(`read ScheduleRevision ${date}`, revisionError);

  const entry = await rpc(actor, "create_schedule_entry", {
    schedule_revision_id: revision.id,
    assignment_id: originalAssignmentId,
    starts_at: `${date}T11:00:00Z`,
    ends_at: `${date}T19:00:00Z`,
  }, `create ScheduleEntry ${date}`);

  if (publish) {
    for (const command of [
      "submit_schedule_revision",
      "approve_schedule_revision",
      "publish_schedule_revision",
    ]) {
      await rpc(actor, command, { schedule_revision_id: revision.id }, `${command} ${date}`);
    }
  }
  return { schedule, revision, entry };
}

let directorFixture;
let supervisorFixture;
let hrFixture;
let recruiterFixture;
let otherDirectorFixture;

try {
  const { data: otherOrganization, error: otherOrganizationError } = await admin
    .from("organizations")
    .insert({
      legal_name: `Presence Isolation ${suffix} Ltda`,
      trade_name: `Presence Isolation ${suffix}`,
      status: "active",
    })
    .select("id")
    .single();
  if (otherOrganizationError) failAt("create isolated Organization", otherOrganizationError);
  otherOrganizationId = otherOrganization.id;

  directorFixture = await createActor("DIRECTOR", primaryOrganizationId, "director");
  supervisorFixture = await createActor("SUPERVISOR", primaryOrganizationId, "supervisor");
  hrFixture = await createActor("HR", primaryOrganizationId, "hr");
  recruiterFixture = await createActor("RECRUITER", primaryOrganizationId, "recruiter");
  otherDirectorFixture = await createActor("DIRECTOR", otherOrganizationId, "other-director");
  const director = directorFixture.client;
  const supervisor = supervisorFixture.client;

  const replacementWorker = await rpc(director, "mutate_worker_with_audit", {
    operation: "create",
    organization_id: primaryOrganizationId,
    full_name: `Presence Replacement ${suffix}`,
    document_number: String(Date.now()).slice(-11).padStart(11, "0"),
    engagement_start_date: "2090-01-01",
  }, "create replacement Worker");
  replacementWorkerId = replacementWorker.id;
  await rpc(director, "mutate_worker_with_audit", {
    operation: "status_change",
    entity_id: replacementWorker.id,
    target_status: "active",
  }, "activate replacement Worker");
  const replacementAssignment = await rpc(director, "mutate_assignment_with_audit", {
    operation: "create",
    worker_id: replacementWorker.id,
    position_id: originalPositionId,
    start_date: "2090-01-01",
  }, "create replacement Assignment");
  replacementAssignmentId = replacementAssignment.id;
  await rpc(director, "mutate_assignment_with_audit", {
    operation: "status_change",
    entity_id: replacementAssignment.id,
    target_status: "active",
  }, "activate replacement Assignment");

  const originalFlow = await createScheduleEntry(director, originalDate, false);
  const draftStart = await supervisor.rpc("start_presence", {
    organization_id: primaryOrganizationId,
    schedule_entry_id: originalFlow.entry.id,
    arrived_at: `${originalDate}T11:00:00Z`,
    idempotency_key: `draft-${suffix}`,
  });
  assert(
    draftStart.error?.code === "23514",
    "A draft ScheduleEntry accepted Presence",
  );

  for (const command of [
    "submit_schedule_revision",
    "approve_schedule_revision",
    "publish_schedule_revision",
  ]) {
    await rpc(director, command, { schedule_revision_id: originalFlow.revision.id }, command);
  }

  const originalKey = `original-${suffix}`;
  const originalPresence = await rpc(supervisor, "start_presence", {
    organization_id: primaryOrganizationId,
    schedule_entry_id: originalFlow.entry.id,
    arrived_at: `${originalDate}T11:03:00Z`,
    idempotency_key: originalKey,
  }, "start original Presence");
  presenceIds.push(originalPresence.id);
  assert(
    originalPresence.actual_assignment_id === originalAssignmentId &&
      originalPresence.replacement_id === null,
    "Original Presence did not resolve the ScheduleEntry Assignment",
  );

  const replayedOriginal = await rpc(supervisor, "start_presence", {
    organization_id: primaryOrganizationId,
    schedule_entry_id: originalFlow.entry.id,
    arrived_at: `${originalDate}T11:03:00Z`,
    idempotency_key: originalKey,
  }, "replay original Presence");
  assert(replayedOriginal.id === originalPresence.id, "Idempotent replay created another Presence");

  const divergentReplay = await supervisor.rpc("start_presence", {
    organization_id: primaryOrganizationId,
    schedule_entry_id: originalFlow.entry.id,
    arrived_at: `${originalDate}T11:04:00Z`,
    idempotency_key: originalKey,
  });
  assert(divergentReplay.error?.code === "23505", "Divergent idempotent payload was accepted");

  const duplicatePresence = await supervisor.rpc("start_presence", {
    organization_id: primaryOrganizationId,
    schedule_entry_id: originalFlow.entry.id,
    arrived_at: `${originalDate}T11:05:00Z`,
    idempotency_key: `duplicate-${suffix}`,
  });
  assert(duplicatePresence.error?.code === "23505", "A second valid Presence was accepted");

  const invalidCompletion = await supervisor.rpc("complete_presence", {
    organization_id: primaryOrganizationId,
    presence_id: originalPresence.id,
    departed_at: `${originalDate}T10:59:00Z`,
    idempotency_key: `invalid-completion-${suffix}`,
  });
  assert(invalidCompletion.error?.code === "23514", "Invalid departed_at was accepted");

  const completedPresence = await rpc(supervisor, "complete_presence", {
    organization_id: primaryOrganizationId,
    presence_id: originalPresence.id,
    departed_at: `${originalDate}T19:00:00Z`,
    idempotency_key: `complete-${suffix}`,
  }, "complete Presence");
  assert(completedPresence.status === "completed", "Presence was not completed");

  const correctedPresence = await rpc(supervisor, "correct_presence", {
    organization_id: primaryOrganizationId,
    presence_id: originalPresence.id,
    arrived_at: `${originalDate}T11:01:00Z`,
    departed_at: `${originalDate}T19:02:00Z`,
    reason: "Horários confirmados pelo Supervisor",
    idempotency_key: `correct-${suffix}`,
  }, "correct Presence");
  assert(correctedPresence.corrected_by === supervisorFixture.userId, "Correction actor was lost");

  const identityMutation = await admin
    .from("presences")
    .update({ actual_assignment_id: replacementAssignmentId })
    .eq("id", originalPresence.id);
  assert(identityMutation.error?.code === "23514", "Presence identity was mutable");

  const absenceAfterPresence = await director.rpc("create_absence", {
    organization_id: primaryOrganizationId,
    schedule_entry_id: originalFlow.entry.id,
    reason: "other",
  });
  assert(absenceAfterPresence.error?.code === "23514", "Absence was created after valid Presence");

  const directUpdate = await supervisor
    .from("presences")
    .update({ arrived_at: `${originalDate}T11:02:00Z` })
    .eq("id", originalPresence.id);
  assert(directUpdate.error?.code === "42501", "Authenticated direct Presence DML was accepted");

  const cancelledOriginal = await rpc(supervisor, "cancel_presence", {
    organization_id: primaryOrganizationId,
    presence_id: originalPresence.id,
    reason: "Registro de validação concluído",
    idempotency_key: `cancel-original-${suffix}`,
  }, "cancel original Presence");
  assert(cancelledOriginal.status === "cancelled", "Cancelled Presence history was not preserved");

  const restartedPresence = await rpc(supervisor, "start_presence", {
    organization_id: primaryOrganizationId,
    schedule_entry_id: originalFlow.entry.id,
    arrived_at: `${originalDate}T11:04:00Z`,
    idempotency_key: `restart-${suffix}`,
    source: "integration",
    source_reference: `external-presence-${suffix}`,
  }, "restart Presence after cancellation");
  presenceIds.push(restartedPresence.id);
  assert(restartedPresence.id !== originalPresence.id, "Cancelled Presence was overwritten");

  await rpc(supervisor, "cancel_presence", {
    organization_id: primaryOrganizationId,
    presence_id: restartedPresence.id,
    reason: "Preparar validação concorrente",
    idempotency_key: `cancel-restarted-${suffix}`,
  }, "cancel restarted Presence");

  const concurrentResults = await Promise.all([
    supervisor.rpc("start_presence", {
      organization_id: primaryOrganizationId,
      schedule_entry_id: originalFlow.entry.id,
      arrived_at: `${originalDate}T11:05:00Z`,
      idempotency_key: `concurrent-a-${suffix}`,
    }),
    supervisor.rpc("start_presence", {
      organization_id: primaryOrganizationId,
      schedule_entry_id: originalFlow.entry.id,
      arrived_at: `${originalDate}T11:05:00Z`,
      idempotency_key: `concurrent-b-${suffix}`,
    }),
  ]);
  const concurrentSuccesses = concurrentResults.filter((result) => !result.error);
  const concurrentConflicts = concurrentResults.filter((result) => result.error?.code === "23505");
  assert(
    concurrentSuccesses.length === 1 && concurrentConflicts.length === 1,
    "Concurrent Presence creation was not serialized",
  );
  const concurrentPresence = concurrentSuccesses[0].data;
  presenceIds.push(concurrentPresence.id);
  await rpc(supervisor, "cancel_presence", {
    organization_id: primaryOrganizationId,
    presence_id: concurrentPresence.id,
    reason: "Encerrar validação concorrente",
    idempotency_key: `cancel-concurrent-${suffix}`,
  }, "cancel concurrent Presence");

  const successor = await rpc(director, "create_schedule_revision_from_published", {
    schedule_revision_id: originalFlow.revision.id,
  }, "create successor ScheduleRevision");
  const { data: successorEntry, error: successorEntryError } = await director
    .from("schedule_entries")
    .select("id")
    .eq("schedule_revision_id", successor.id)
    .single();
  if (successorEntryError) failAt("read successor ScheduleEntry", successorEntryError);
  for (const command of [
    "submit_schedule_revision",
    "approve_schedule_revision",
    "publish_schedule_revision",
  ]) {
    await rpc(director, command, { schedule_revision_id: successor.id }, `${command} successor`);
  }
  const supersededStart = await supervisor.rpc("start_presence", {
    organization_id: primaryOrganizationId,
    schedule_entry_id: originalFlow.entry.id,
    arrived_at: `${originalDate}T11:06:00Z`,
    idempotency_key: `superseded-${suffix}`,
  });
  assert(supersededStart.error?.code === "23514", "Superseded ScheduleEntry accepted Presence");

  const replacementFlow = await createScheduleEntry(director, replacementDate);
  const absence = await rpc(director, "create_absence", {
    organization_id: primaryOrganizationId,
    schedule_entry_id: replacementFlow.entry.id,
    reason: "sick",
    notes: "Presence validation",
  }, "create uncovered Absence");
  absenceIds.push(absence.id);

  const uncoveredStart = await supervisor.rpc("start_presence", {
    organization_id: primaryOrganizationId,
    schedule_entry_id: replacementFlow.entry.id,
    arrived_at: `${replacementDate}T11:00:00Z`,
    idempotency_key: `uncovered-${suffix}`,
  });
  assert(uncoveredStart.error?.code === "23514", "Uncovered Absence accepted Presence");

  const replacement = await rpc(director, "create_replacement", {
    organization_id: primaryOrganizationId,
    absence_id: absence.id,
    assignment_id: replacementAssignmentId,
  }, "create active Replacement");
  replacementIds.push(replacement.id);

  const replacementPresence = await rpc(supervisor, "start_presence", {
    organization_id: primaryOrganizationId,
    schedule_entry_id: replacementFlow.entry.id,
    arrived_at: `${replacementDate}T11:00:00Z`,
    idempotency_key: `replacement-${suffix}`,
  }, "start Replacement Presence");
  presenceIds.push(replacementPresence.id);
  assert(
    replacementPresence.actual_assignment_id === replacementAssignmentId &&
      replacementPresence.replacement_id === replacement.id,
    "Presence did not resolve the active Replacement",
  );

  const replacementCancellation = await director.rpc("cancel_replacement", {
    organization_id: primaryOrganizationId,
    replacement_id: replacement.id,
  });
  assert(
    replacementCancellation.error?.code === "23514",
    "Replacement referenced by Presence was cancelled",
  );

  const injectedAssignment = await admin.from("presences").insert({
    organization_id: primaryOrganizationId,
    schedule_entry_id: replacementFlow.entry.id,
    actual_assignment_id: originalAssignmentId,
    replacement_id: replacement.id,
    arrived_at: `${replacementDate}T11:00:00Z`,
    source: "manual",
    created_by: supervisorFixture.userId,
  });
  assert(injectedAssignment.error?.code === "23514", "Incorrect actual Assignment was injected");

  const { data: hrRead, error: hrReadError } = await hrFixture.client
    .from("presences")
    .select("id")
    .eq("id", replacementPresence.id);
  if (hrReadError) failAt("HR read Presence", hrReadError);
  assert(hrRead.length === 1, "HR could not read Presence");
  const hrCreate = await hrFixture.client.rpc("start_presence", {
    organization_id: primaryOrganizationId,
    schedule_entry_id: successorEntry.id,
    arrived_at: `${originalDate}T11:00:00Z`,
    idempotency_key: `hr-${suffix}`,
  });
  assert(hrCreate.error?.code === "42501", "HR created Presence");

  const { data: recruiterRead, error: recruiterReadError } = await recruiterFixture.client
    .from("presences")
    .select("id")
    .eq("id", replacementPresence.id);
  if (recruiterReadError) failAt("RECRUITER Presence RLS query", recruiterReadError);
  assert(recruiterRead.length === 0, "RECRUITER read Presence");

  const { data: crossOrganizationRead, error: crossOrganizationReadError } =
    await otherDirectorFixture.client.from("presences").select("id");
  if (crossOrganizationReadError) failAt("cross-Organization Presence RLS query", crossOrganizationReadError);
  assert(crossOrganizationRead.length === 0, "Presence RLS leaked another Organization");

  const { data: auditRows, error: auditError } = await admin
    .from("audit_events")
    .select("action")
    .eq("entity_type", "presence")
    .eq("entity_id", originalPresence.id)
    .order("created_at", { ascending: true });
  if (auditError) failAt("read Presence audit", auditError);
  assert(
    auditRows.map((row) => row.action).join(",") ===
      "record_arrival,record_departure,correct,cancel",
    "Presence audit or idempotency history is incorrect",
  );

  await rpc(supervisor, "cancel_presence", {
    organization_id: primaryOrganizationId,
    presence_id: replacementPresence.id,
    reason: "Encerrar validação de Replacement",
    idempotency_key: `cancel-replacement-presence-${suffix}`,
  }, "cancel Replacement Presence");
  await rpc(director, "cancel_replacement", {
    organization_id: primaryOrganizationId,
    replacement_id: replacement.id,
  }, "cancel Replacement after Presence cancellation");

  console.log("Presence real validation passed.");
} finally {
  // Published Schedule history is append-only by domain rule. Each run therefore
  // uses an exclusive future period and removes only its mutable operational data.
  await cleanupAuditEvents("presence", presenceIds);
  await cleanupAuditEvents("replacement", replacementIds);
  await cleanupAuditEvents("absence", absenceIds);
  await cleanupAuditEvents(
    "assignment",
    replacementAssignmentId ? [replacementAssignmentId] : [],
  );
  await cleanupAuditEvents("worker", replacementWorkerId ? [replacementWorkerId] : []);
  if (presenceIds.length > 0) {
    await cleanup("delete Presences", () =>
      admin.from("presences").delete().in("id", presenceIds),
    );
  }
  if (replacementIds.length > 0) {
    await cleanup("delete Replacements", () =>
      admin.from("replacements").delete().in("id", replacementIds),
    );
  }
  if (absenceIds.length > 0) {
    await cleanup("delete Absences", () =>
      admin.from("absences").delete().in("id", absenceIds),
    );
  }
  if (replacementAssignmentId) {
    await cleanup("delete replacement Assignment", () =>
      admin.from("assignments").delete().eq("id", replacementAssignmentId),
    );
  }
  if (replacementWorkerId) {
    await cleanup("delete replacement Worker", () =>
      admin.from("workers").delete().eq("id", replacementWorkerId),
    );
  }
  if (userIds.length > 0) {
    await cleanup("delete Organization memberships", () =>
      admin.from("organization_members").delete().in("profile_id", userIds),
    );
  }
  if (otherDirectorFixture) {
    await cleanup("delete isolated Profile", () =>
      admin.from("profiles").delete().eq("id", otherDirectorFixture.userId),
    );
    await cleanup("delete isolated auth user", () =>
      admin.auth.admin.deleteUser(otherDirectorFixture.userId),
    );
  }
  if (otherOrganizationId) {
    await cleanup("delete isolated Organization", () =>
      admin.from("organizations").delete().eq("id", otherOrganizationId),
    );
  }
  if (cleanupErrors.length > 0) {
    throw new Error(`Presence cleanup failed:\n${cleanupErrors.join("\n")}`);
  }
}
