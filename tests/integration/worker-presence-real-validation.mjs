import { randomUUID } from "node:crypto";

import { createClient } from "@supabase/supabase-js";

import { requireIntegrationTestEnv } from "./helpers/integration-test-env.mjs";

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function failAt(step, error) {
  throw new Error(
    `Worker Presence real validation failed at ${step}: ${error.code ?? "unknown"} ${error.message ?? String(error)}`,
    { cause: error },
  );
}

function localDate(value, timezone) {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: timezone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(value);
}

function interval(hours, durationHours = 1) {
  const startsAt = new Date(Date.now() + hours * 3_600_000);
  return {
    starts_at: startsAt.toISOString(),
    ends_at: new Date(startsAt.getTime() + durationHours * 3_600_000).toISOString(),
  };
}

const { supabaseUrl, publishableKey, serviceRoleKey } = requireIntegrationTestEnv();
const options = { auth: { autoRefreshToken: false, persistSession: false } };
const admin = createClient(supabaseUrl, serviceRoleKey, options);
const anonymous = createClient(supabaseUrl, publishableKey, options);
const marker = `${Date.now()}-${randomUUID()}`;
const utcHour = new Date().getUTCHours();
const targetOffset = 12 - utcHour;
const timezone = targetOffset === 0
  ? "UTC"
  : targetOffset > 0
    ? `Etc/GMT-${targetOffset}`
    : `Etc/GMT+${Math.abs(targetOffset)}`;
const organizationIds = [];
const userIds = [];

async function insert(table, values, columns = "*") {
  const { data, error } = await admin.from(table).insert(values).select(columns).single();
  if (error) failAt(`insert ${table}`, error);
  return data;
}

async function authenticate(email) {
  const { data: link, error: linkError } = await admin.auth.admin.generateLink({
    type: "magiclink",
    email,
  });
  if (linkError) failAt(`generate link ${email}`, linkError);
  const client = createClient(supabaseUrl, publishableKey, options);
  const { error } = await client.auth.verifyOtp({
    type: "magiclink",
    token_hash: link.properties.hashed_token,
  });
  if (error) failAt(`authenticate ${email}`, error);
  return client;
}

async function createUser(label, membership = null) {
  const email = `worker-presence-${label}-${marker}@example.invalid`;
  const { data, error } = await admin.auth.admin.createUser({
    email,
    password: randomUUID(),
    email_confirm: true,
  });
  if (error) failAt(`create user ${label}`, error);
  userIds.push(data.user.id);
  await insert("profiles", { id: data.user.id, display_name: label });
  if (membership) {
    await insert("organization_members", {
      organization_id: membership.organizationId,
      profile_id: data.user.id,
      role: membership.role,
      status: "active",
    });
  }
  return {
    id: data.user.id,
    email,
    client: await authenticate(email),
  };
}

let documentSequence = 0;
async function createWorkerAccess(organizationId, label) {
  const user = await createUser(label);
  documentSequence += 1;
  const documentNumber = `${Date.now()}${documentSequence}`.slice(-11).padStart(11, "0");
  const worker = await insert("workers", {
    organization_id: organizationId,
    full_name: `Worker ${label}`,
    document_number: documentNumber,
    status: "active",
    engagement_start_date: "2020-01-01",
    engagement_end_date: "2099-12-31",
  });
  const invitation = await insert("worker_access_invitations", {
    worker_id: worker.id,
    auth_user_id: user.id,
    invitation_email: user.email,
    invitation_token_hash: randomUUID().replaceAll("-", "").padEnd(64, "0"),
    status: "claimed",
    created_by: user.id,
    claimed_at: new Date().toISOString(),
    claimed_by: user.id,
  });
  const access = await insert("worker_access_links", {
    invitation_id: invitation.id,
    worker_id: worker.id,
    profile_id: user.id,
    status: "active",
    activated_by: user.id,
  });
  return { ...user, worker, access };
}

async function rpc(client, name, args, step) {
  const { data, error } = await client.rpc(name, args);
  if (error) failAt(step, error);
  return data;
}

async function expectRpcError(client, name, args, codes, message) {
  const { error } = await client.rpc(name, args);
  assert(error && codes.includes(error.code), `${message}: ${error?.code ?? "no error"}`);
  return error;
}

async function createRevision(scheduleId, version, actorId) {
  return insert("schedule_revisions", {
    schedule_id: scheduleId,
    version,
    status: "draft",
    created_by: actorId,
  });
}

async function createEntry(revisionId, assignmentId, values, actorId) {
  return insert("schedule_entries", {
    schedule_revision_id: revisionId,
    assignment_id: assignmentId,
    ...values,
    created_by: actorId,
  });
}

async function publishRevision(revisionId, actorId) {
  const now = new Date().toISOString();
  for (const values of [
    { status: "pending_approval", submitted_at: now, submitted_by: actorId },
    { status: "approved", approved_at: now, approved_by: actorId },
    { status: "published", published_at: now, published_by: actorId },
  ]) {
    const { error } = await admin.from("schedule_revisions").update(values).eq("id", revisionId);
    if (error) failAt(`publish revision ${values.status}`, error);
  }
}

function assertMinimalResult(result, expectedStatus) {
  assert(result.status === expectedStatus, `Expected ${expectedStatus} result`);
  const keys = Object.keys(result).sort();
  assert(
    JSON.stringify(keys) === JSON.stringify([
      "arrived_at", "departed_at", "schedule_entry_id", "status",
    ]),
    `Worker Presence result leaked fields: ${keys.join(",")}`,
  );
}

async function cleanupOrganization(organizationId) {
  await admin.from("audit_events").delete().eq("organization_id", organizationId);
  await admin.from("presences").delete().eq("organization_id", organizationId);
  await admin.from("replacements").delete().eq("organization_id", organizationId);
  await admin.from("absences").delete().eq("organization_id", organizationId);
  const { data: schedules } = await admin.from("schedules").select("id").eq("organization_id", organizationId);
  const scheduleIds = schedules?.map(({ id }) => id) ?? [];
  if (scheduleIds.length) {
    const { data: revisions } = await admin.from("schedule_revisions").select("id").in("schedule_id", scheduleIds);
    const revisionIds = revisions?.map(({ id }) => id) ?? [];
    if (revisionIds.length) await admin.from("schedule_entries").delete().in("schedule_revision_id", revisionIds);
    await admin.from("schedule_revisions").delete().in("schedule_id", scheduleIds);
    await admin.from("schedules").delete().in("id", scheduleIds);
  }
  const { data: workers } = await admin.from("workers").select("id").eq("organization_id", organizationId);
  const workerIds = workers?.map(({ id }) => id) ?? [];
  if (workerIds.length) {
    await admin.from("worker_access_links").delete().in("worker_id", workerIds);
    await admin.from("worker_access_invitations").delete().in("worker_id", workerIds);
    await admin.from("assignments").delete().in("worker_id", workerIds);
    await admin.from("workers").delete().in("id", workerIds);
  }
  const { data: clients } = await admin.from("clients").select("id").eq("organization_id", organizationId);
  const clientIds = clients?.map(({ id }) => id) ?? [];
  if (clientIds.length) {
    const { data: contracts } = await admin.from("contracts").select("id").in("client_id", clientIds);
    const contractIds = contracts?.map(({ id }) => id) ?? [];
    if (contractIds.length) {
      const { data: operations } = await admin.from("operations").select("id").in("contract_id", contractIds);
      const operationIds = operations?.map(({ id }) => id) ?? [];
      if (operationIds.length) {
        const { data: units } = await admin.from("units").select("id").in("operation_id", operationIds);
        const unitIds = units?.map(({ id }) => id) ?? [];
        if (unitIds.length) await admin.from("positions").delete().in("unit_id", unitIds);
        await admin.from("units").delete().in("operation_id", operationIds);
        await admin.from("operations").delete().in("id", operationIds);
      }
      await admin.from("contracts").delete().in("id", contractIds);
    }
    await admin.from("clients").delete().in("id", clientIds);
  }
  await admin.from("job_roles").delete().eq("organization_id", organizationId);
}

try {
  const organization = await insert("organizations", {
    legal_name: `Worker Presence ${marker} Ltda`,
    trade_name: `Worker Presence ${marker}`,
    status: "active",
  });
  organizationIds.push(organization.id);
  const isolatedOrganization = await insert("organizations", {
    legal_name: `Worker Presence Isolated ${marker} Ltda`,
    trade_name: `Worker Presence Isolated ${marker}`,
    status: "active",
  });
  organizationIds.push(isolatedOrganization.id);

  const director = await createUser("director", {
    organizationId: organization.id,
    role: "DIRECTOR",
  });
  const internalOnly = await createUser("internal", {
    organizationId: organization.id,
    role: "DIRECTOR",
  });
  const original = await createWorkerAccess(organization.id, "original");
  const other = await createWorkerAccess(organization.id, "other");
  const replacement = await createWorkerAccess(organization.id, "replacement");
  const historical = await createWorkerAccess(organization.id, "historical");
  const isolated = await createWorkerAccess(isolatedOrganization.id, "isolated");

  const { count: workerMemberships } = await admin
    .from("organization_members")
    .select("profile_id", { count: "exact", head: true })
    .in("profile_id", [original.id, other.id, replacement.id, historical.id, isolated.id]);
  assert(workerMemberships === 0, "Worker fixture unexpectedly became an organization_member");

  const client = await insert("clients", {
    organization_id: organization.id,
    legal_name: `Client ${marker} Ltda`,
    trade_name: `Client ${marker}`,
    document_number: `${Date.now()}`.padStart(14, "0").slice(-14),
    status: "active",
  });
  const contract = await insert("contracts", {
    client_id: client.id,
    name: `Contract ${marker}`,
    start_date: "2020-01-01",
    end_date: "2099-12-31",
    status: "active",
  });
  const operation = await insert("operations", {
    contract_id: contract.id,
    name: `Operation ${marker}`,
    start_date: "2020-01-01",
    end_date: "2099-12-31",
    status: "active",
    manager_user_id: director.id,
  });
  const unit = await insert("units", {
    operation_id: operation.id,
    name: `Unit ${marker}`,
    code: `WP-${randomUUID().slice(0, 8)}`,
    city: "Test City",
    state: "TS",
    timezone,
    status: "active",
  });
  const jobRole = await insert("job_roles", {
    organization_id: organization.id,
    name: `Role ${marker}`,
    status: "active",
  });
  const position = await insert("positions", {
    unit_id: unit.id,
    job_role_id: jobRole.id,
    base_required_headcount: 10,
    status: "active",
  });
  const coverageStart = localDate(new Date(Date.now() - 3 * 86_400_000), timezone);
  const coverageEnd = localDate(new Date(Date.now() + 3 * 86_400_000), timezone);
  async function assignmentFor(workerId) {
    return insert("assignments", {
      worker_id: workerId,
      position_id: position.id,
      start_date: coverageStart,
      end_date: coverageEnd,
      status: "active",
    });
  }
  const originalAssignment = await assignmentFor(original.worker.id);
  const otherAssignment = await assignmentFor(other.worker.id);
  const replacementAssignment = await assignmentFor(replacement.worker.id);
  const historicalAssignment = await assignmentFor(historical.worker.id);

  const schedule = await insert("schedules", {
    organization_id: organization.id,
    operation_id: operation.id,
    period_start: coverageStart,
    period_end: coverageEnd,
    created_by: director.id,
  });
  const oldRevision = await createRevision(schedule.id, 1, director.id);
  const supersededStart = await createEntry(
    oldRevision.id,
    originalAssignment.id,
    interval(6),
    director.id,
  );
  const historicalOpen = await createEntry(
    oldRevision.id,
    historicalAssignment.id,
    interval(-28),
    director.id,
  );
  await publishRevision(oldRevision.id, director.id);

  const currentRevision = await createRevision(schedule.id, 2, director.id);
  const endedToday = await createEntry(currentRevision.id, originalAssignment.id, interval(-4), director.id);
  const current = await createEntry(currentRevision.id, originalAssignment.id, interval(-1, 2), director.id);
  const beforeToday = await createEntry(currentRevision.id, originalAssignment.id, interval(3), director.id);
  const pastDay = await createEntry(currentRevision.id, originalAssignment.id, interval(-28), director.id);
  const futureDay = await createEntry(currentRevision.id, originalAssignment.id, interval(28), director.id);
  const replacedEntry = await createEntry(currentRevision.id, otherAssignment.id, interval(5), director.id);
  const uncoveredEntry = await createEntry(currentRevision.id, otherAssignment.id, interval(7), director.id);
  const cancelledReplacementEntry = await createEntry(currentRevision.id, otherAssignment.id, interval(9), director.id);
  const replacementRaceEntry = await createEntry(currentRevision.id, otherAssignment.id, interval(11), director.id);
  const absenceRaceEntry = await createEntry(currentRevision.id, originalAssignment.id, interval(12), director.id);
  const ineligibleEntry = await createEntry(currentRevision.id, otherAssignment.id, interval(13), director.id);
  const overnightEntry = await createEntry(currentRevision.id, historicalAssignment.id, interval(-14, 16), director.id);
  await publishRevision(currentRevision.id, director.id);

  const draftRevision = await createRevision(schedule.id, 3, director.id);
  const draftEntry = await createEntry(draftRevision.id, originalAssignment.id, interval(30), director.id);
  const pendingRevision = await createRevision(schedule.id, 4, director.id);
  const pendingEntry = await createEntry(pendingRevision.id, originalAssignment.id, interval(32), director.id);
  const lifecycleAt = new Date().toISOString();
  const { error: pendingTransitionError } = await admin
    .from("schedule_revisions")
    .update({ status: "pending_approval", submitted_at: lifecycleAt, submitted_by: director.id })
    .eq("id", pendingRevision.id);
  if (pendingTransitionError) failAt("prepare pending revision", pendingTransitionError);
  const approvedRevision = await createRevision(schedule.id, 5, director.id);
  const approvedEntry = await createEntry(approvedRevision.id, originalAssignment.id, interval(34), director.id);
  for (const values of [
    { status: "pending_approval", submitted_at: lifecycleAt, submitted_by: director.id },
    { status: "approved", approved_at: lifecycleAt, approved_by: director.id },
  ]) {
    const { error } = await admin.from("schedule_revisions").update(values).eq("id", approvedRevision.id);
    if (error) failAt(`prepare ${values.status} revision`, error);
  }

  const replacedAbsence = await insert("absences", {
    organization_id: organization.id,
    schedule_entry_id: replacedEntry.id,
    reason: "other",
    reported_by: director.id,
  });
  const activeReplacement = await insert("replacements", {
    organization_id: organization.id,
    absence_id: replacedAbsence.id,
    replacement_assignment_id: replacementAssignment.id,
    status: "active",
    created_by: director.id,
  });
  await insert("absences", {
    organization_id: organization.id,
    schedule_entry_id: uncoveredEntry.id,
    reason: "other",
    reported_by: director.id,
  });
  const cancelledAbsence = await insert("absences", {
    organization_id: organization.id,
    schedule_entry_id: cancelledReplacementEntry.id,
    reason: "other",
    reported_by: director.id,
  });
  await insert("replacements", {
    organization_id: organization.id,
    absence_id: cancelledAbsence.id,
    replacement_assignment_id: replacementAssignment.id,
    status: "cancelled",
    created_by: director.id,
    cancelled_at: new Date().toISOString(),
    cancelled_by: director.id,
  });
  const replacementRaceAbsence = await insert("absences", {
    organization_id: organization.id,
    schedule_entry_id: replacementRaceEntry.id,
    reason: "other",
    reported_by: director.id,
  });
  const replacementRace = await insert("replacements", {
    organization_id: organization.id,
    absence_id: replacementRaceAbsence.id,
    replacement_assignment_id: replacementAssignment.id,
    status: "active",
    created_by: director.id,
  });

  const historicalPresence = await insert("presences", {
    organization_id: organization.id,
    schedule_entry_id: historicalOpen.id,
    actual_assignment_id: historicalAssignment.id,
    status: "present",
    arrived_at: new Date(Date.now() - 28 * 3_600_000).toISOString(),
    source: "manual",
    created_by: director.id,
  });

  const originalAction = await rpc(
    original.client,
    "get_worker_presence_action",
    { schedule_entry_id: current.id },
    "read original action",
  );
  assert(originalAction === "start", "Eligible original Worker did not receive start action");
  assert(
    await rpc(original.client, "get_worker_presence_action", { schedule_entry_id: futureDay.id }, "future action") === null,
    "Future civil day exposed a start action",
  );
  assert(
    await rpc(original.client, "get_worker_presence_action", { schedule_entry_id: pastDay.id }, "past action") === null,
    "Past civil day exposed a start action",
  );

  const sourceReference = randomUUID();
  const startKey = randomUUID();
  const beforeStart = Date.now();
  const concurrentStarts = await Promise.all([
    original.client.rpc("worker_start_presence", {
      schedule_entry_id: current.id,
      source_reference: sourceReference,
      idempotency_key: startKey,
    }),
    original.client.rpc("worker_start_presence", {
      schedule_entry_id: current.id,
      source_reference: sourceReference,
      idempotency_key: startKey,
    }),
  ]);
  const afterStart = Date.now();
  for (const result of concurrentStarts) {
    if (result.error) failAt("concurrent Worker start", result.error);
    assertMinimalResult(result.data, "present");
  }
  assert(
    concurrentStarts[0].data.arrived_at === concurrentStarts[1].data.arrived_at,
    "Concurrent same-key start did not replay the stable response",
  );
  const arrivedAt = Date.parse(concurrentStarts[0].data.arrived_at);
  assert(arrivedAt >= beforeStart - 1_000 && arrivedAt <= afterStart + 1_000, "Arrival did not use database current time");

  await new Promise((resolve) => setTimeout(resolve, 25));
  const replayedStart = await rpc(original.client, "worker_start_presence", {
    schedule_entry_id: current.id,
    source_reference: sourceReference,
    idempotency_key: startKey,
  }, "delayed start replay");
  assert(replayedStart.arrived_at === concurrentStarts[0].data.arrived_at, "Delayed retry changed arrived_at");
  await expectRpcError(original.client, "worker_start_presence", {
    schedule_entry_id: beforeToday.id,
    source_reference: randomUUID(),
    idempotency_key: startKey,
  }, ["23505"], "Same key accepted a divergent payload");
  await expectRpcError(original.client, "worker_start_presence", {
    schedule_entry_id: current.id,
    source_reference: randomUUID(),
    idempotency_key: randomUUID(),
  }, ["23505"], "New key created a second current Presence");

  const { data: persistedCurrent, error: persistedCurrentError } = await admin
    .from("presences")
    .select("id,source,source_reference,actual_assignment_id,replacement_id")
    .eq("schedule_entry_id", current.id)
    .single();
  if (persistedCurrentError) failAt("read persisted current Presence", persistedCurrentError);
  assert(persistedCurrent.source === "app", "Worker arrival did not persist source=app");
  assert(persistedCurrent.source_reference === sourceReference, "Worker source reference changed");
  assert(persistedCurrent.actual_assignment_id === originalAssignment.id, "Original Assignment was not resolved");
  assert(persistedCurrent.replacement_id === null, "Original Presence gained a Replacement");

  assert(
    await rpc(original.client, "get_worker_presence_action", { schedule_entry_id: current.id }, "complete action") === "complete",
    "Open own Presence did not expose completion",
  );
  await expectRpcError(other.client, "worker_complete_presence", {
    schedule_entry_id: current.id,
    idempotency_key: randomUUID(),
  }, ["P0002"], "Another Worker completed a known open Presence");
  await expectRpcError(original.client, "worker_complete_presence", {
    schedule_entry_id: current.id,
    idempotency_key: startKey,
  }, ["23505"], "Start idempotency key was accepted for completion");
  const completionKey = randomUUID();
  const concurrentCompletions = await Promise.all([
    original.client.rpc("worker_complete_presence", {
      schedule_entry_id: current.id,
      idempotency_key: completionKey,
    }),
    original.client.rpc("worker_complete_presence", {
      schedule_entry_id: current.id,
      idempotency_key: completionKey,
    }),
  ]);
  for (const result of concurrentCompletions) {
    if (result.error) failAt("concurrent Worker completion", result.error);
    assertMinimalResult(result.data, "completed");
  }
  assert(
    concurrentCompletions[0].data.departed_at === concurrentCompletions[1].data.departed_at,
    "Concurrent same-key completion did not replay the stable response",
  );
  await new Promise((resolve) => setTimeout(resolve, 25));
  const replayedCompletion = await rpc(original.client, "worker_complete_presence", {
    schedule_entry_id: current.id,
    idempotency_key: completionKey,
  }, "delayed completion replay");
  assert(
    replayedCompletion.departed_at === concurrentCompletions[0].data.departed_at,
    "Delayed completion retry changed departed_at",
  );
  assert(
    await rpc(original.client, "get_worker_presence_action", { schedule_entry_id: current.id }, "completed action") === null,
    "Completed Presence remained actionable",
  );

  for (const entry of [endedToday, beforeToday]) {
    const result = await rpc(original.client, "worker_start_presence", {
      schedule_entry_id: entry.id,
      source_reference: randomUUID(),
      idempotency_key: randomUUID(),
    }, "same civil-day arrival");
    assert(result.status === "present", "Same Unit civil-day arrival was blocked");
  }
  await expectRpcError(original.client, "worker_start_presence", {
    schedule_entry_id: pastDay.id,
    source_reference: randomUUID(),
    idempotency_key: randomUUID(),
  }, ["P0002"], "Past out-of-window arrival was accepted");
  await expectRpcError(original.client, "worker_start_presence", {
    schedule_entry_id: futureDay.id,
    source_reference: randomUUID(),
    idempotency_key: randomUUID(),
  }, ["P0002"], "Future civil-day arrival was accepted");
  for (const [entry, label] of [
    [draftEntry, "draft"],
    [pendingEntry, "pending_approval"],
    [approvedEntry, "approved"],
  ]) {
    await expectRpcError(original.client, "worker_start_presence", {
      schedule_entry_id: entry.id,
      source_reference: randomUUID(),
      idempotency_key: randomUUID(),
    }, ["23514"], `${label} ScheduleEntry accepted arrival`);
  }
  const overnightStart = await rpc(historical.client, "worker_start_presence", {
    schedule_entry_id: overnightEntry.id,
    source_reference: randomUUID(),
    idempotency_key: randomUUID(),
  }, "overnight interval arrival");
  assert(overnightStart.status === "present", "Active overnight interval was blocked after midnight");

  await expectRpcError(original.client, "worker_start_presence", {
    schedule_entry_id: supersededStart.id,
    source_reference: randomUUID(),
    idempotency_key: randomUUID(),
  }, ["23514"], "Superseded ScheduleEntry accepted a new arrival");
  const { error: finishAssignmentError } = await admin
    .from("assignments")
    .update({ status: "finished", end_date: localDate(new Date(), timezone) })
    .eq("id", historicalAssignment.id);
  if (finishAssignmentError) failAt("finish historical Assignment", finishAssignmentError);
  const historicalCompletion = await rpc(historical.client, "worker_complete_presence", {
    schedule_entry_id: historicalOpen.id,
    idempotency_key: randomUUID(),
  }, "complete superseded historical Presence");
  assert(historicalCompletion.status === "completed", "Superseded open Presence could not complete");
  assert(historicalCompletion.schedule_entry_id === historicalPresence.schedule_entry_id, "Historical completion changed entry");
  assert(
    Date.parse(historicalCompletion.departed_at) > Date.parse(historicalOpen.ends_at)
      && localDate(new Date(historicalCompletion.departed_at), timezone)
        !== localDate(new Date(historicalOpen.starts_at), timezone),
    "Completion after planned end on another Unit civil day was blocked",
  );

  await expectRpcError(other.client, "worker_start_presence", {
    schedule_entry_id: replacedEntry.id,
    source_reference: randomUUID(),
    idempotency_key: randomUUID(),
  }, ["P0002"], "Replaced original Worker registered arrival");
  const replacementStart = await rpc(replacement.client, "worker_start_presence", {
    schedule_entry_id: replacedEntry.id,
    source_reference: randomUUID(),
    idempotency_key: randomUUID(),
  }, "replacement arrival");
  assert(replacementStart.status === "present", "Active replacement could not register arrival");
  const { data: replacementPresence, error: replacementPresenceError } = await admin
    .from("presences")
    .select("actual_assignment_id,replacement_id")
    .eq("schedule_entry_id", replacedEntry.id)
    .single();
  if (replacementPresenceError) failAt("read replacement Presence", replacementPresenceError);
  assert(replacementPresence.actual_assignment_id === replacementAssignment.id, "Replacement Assignment was not resolved");
  assert(replacementPresence.replacement_id === activeReplacement.id, "Replacement relation was not persisted");
  await expectRpcError(other.client, "worker_start_presence", {
    schedule_entry_id: uncoveredEntry.id,
    source_reference: randomUUID(),
    idempotency_key: randomUUID(),
  }, ["23514"], "Uncovered absence accepted original arrival");
  await expectRpcError(replacement.client, "worker_start_presence", {
    schedule_entry_id: cancelledReplacementEntry.id,
    source_reference: randomUUID(),
    idempotency_key: randomUUID(),
  }, ["23514"], "Cancelled replacement accepted arrival");

  const replacementRaceResults = await Promise.all([
    replacement.client.rpc("worker_start_presence", {
      schedule_entry_id: replacementRaceEntry.id,
      source_reference: randomUUID(),
      idempotency_key: randomUUID(),
    }),
    director.client.rpc("cancel_replacement", {
      organization_id: organization.id,
      replacement_id: replacementRace.id,
    }),
  ]);
  assert(
    replacementRaceResults.filter(({ error }) => !error).length === 1,
    "Replacement cancellation race did not serialize to one winner",
  );
  const { data: racePresences, error: racePresenceError } = await admin
    .from("presences")
    .select("actual_assignment_id,replacement_id,status")
    .eq("schedule_entry_id", replacementRaceEntry.id)
    .in("status", ["present", "completed"]);
  if (racePresenceError) failAt("read Replacement race state", racePresenceError);
  assert(racePresences.length <= 1, "Replacement race created multiple valid Presences");
  if (racePresences.length === 1) {
    assert(
      racePresences[0].actual_assignment_id === replacementAssignment.id
        && racePresences[0].replacement_id === replacementRace.id,
      "Replacement race attributed Presence to the wrong Worker",
    );
  }

  const absenceRaceResults = await Promise.all([
    original.client.rpc("worker_start_presence", {
      schedule_entry_id: absenceRaceEntry.id,
      source_reference: randomUUID(),
      idempotency_key: randomUUID(),
    }),
    director.client.rpc("create_absence", {
      organization_id: organization.id,
      schedule_entry_id: absenceRaceEntry.id,
      reason: "other",
      notes: "Worker Presence serialization fixture",
    }),
  ]);
  assert(
    absenceRaceResults.filter(({ error }) => !error).length === 1,
    "Absence/start race did not serialize to one winner",
  );
  const { data: absenceRacePresences, error: absenceRacePresenceError } = await admin
    .from("presences")
    .select("actual_assignment_id,status")
    .eq("schedule_entry_id", absenceRaceEntry.id)
    .in("status", ["present", "completed"]);
  if (absenceRacePresenceError) failAt("read Absence race state", absenceRacePresenceError);
  assert(absenceRacePresences.length <= 1, "Absence race created multiple valid Presences");
  if (absenceRacePresences.length === 1) {
    assert(
      absenceRacePresences[0].actual_assignment_id === originalAssignment.id,
      "Absence race attributed Presence to the wrong Assignment",
    );
  }

  const { error: suspendAssignmentError } = await admin
    .from("assignments")
    .update({ status: "suspended" })
    .eq("id", otherAssignment.id);
  if (suspendAssignmentError) failAt("suspend ineligible Assignment", suspendAssignmentError);
  await expectRpcError(other.client, "worker_start_presence", {
    schedule_entry_id: ineligibleEntry.id,
    source_reference: randomUUID(),
    idempotency_key: randomUUID(),
  }, ["P0002"], "Suspended Assignment authorized a new arrival");

  await expectRpcError(other.client, "worker_start_presence", {
    schedule_entry_id: endedToday.id,
    source_reference: randomUUID(),
    idempotency_key: randomUUID(),
  }, ["P0002"], "Another Worker used a known ScheduleEntry UUID");
  await expectRpcError(isolated.client, "worker_start_presence", {
    schedule_entry_id: endedToday.id,
    source_reference: randomUUID(),
    idempotency_key: randomUUID(),
  }, ["23514"], "Cross-Organization Worker used a known ScheduleEntry UUID");
  await expectRpcError(internalOnly.client, "worker_start_presence", {
    schedule_entry_id: endedToday.id,
    source_reference: randomUUID(),
    idempotency_key: randomUUID(),
  }, ["42501"], "Backoffice membership crossed the Worker boundary");
  await expectRpcError(original.client, "start_presence", {
    organization_id: organization.id,
    schedule_entry_id: futureDay.id,
    arrived_at: new Date().toISOString(),
    idempotency_key: randomUUID(),
    source: "manual",
    source_reference: null,
  }, ["42501"], "Worker called the Backoffice Presence RPC");
  const anonymousStart = await anonymous.rpc("worker_start_presence", {
    schedule_entry_id: endedToday.id,
    source_reference: randomUUID(),
    idempotency_key: randomUUID(),
  });
  assert(anonymousStart.error, "Anonymous caller executed Worker Presence");

  const directPresenceDml = await original.client.from("presences").insert({
    organization_id: organization.id,
    schedule_entry_id: futureDay.id,
    actual_assignment_id: originalAssignment.id,
    arrived_at: new Date().toISOString(),
    source: "app",
    source_reference: randomUUID(),
    created_by: original.id,
  });
  assert(directPresenceDml.error, "Worker performed direct Presence DML");
  const directAccessRead = await original.client.from("worker_access_links").select("id");
  assert(directAccessRead.error, "Worker read worker_access_links directly");
  const privateCore = await original.client.rpc("start_presence_core", {});
  assert(privateCore.error, "Worker executed a private Presence core");

  const historyPage = await rpc(original.client, "list_worker_presence_history", {
    result_limit: 2,
    before_arrived_at: null,
    before_schedule_entry_id: null,
  }, "read Worker Presence history");
  assert(historyPage.length === 2, "History pagination limit was not applied");
  for (const row of historyPage) {
    for (const forbidden of ["worker_id", "organization_id", "assignment_id", "replacement_id"]) {
      assert(!(forbidden in row), `History leaked ${forbidden}`);
    }
  }
  assert(!historyPage.some((row) => row.schedule_entry_id === replacedEntry.id), "History leaked another Worker's Presence");
  const cursor = historyPage.at(-1);
  const historyNext = await rpc(original.client, "list_worker_presence_history", {
    result_limit: 2,
    before_arrived_at: cursor.arrived_at,
    before_schedule_entry_id: cursor.schedule_entry_id,
  }, "read next Worker Presence history page");
  assert(
    !historyNext.some((row) => historyPage.some((first) => first.schedule_entry_id === row.schedule_entry_id)),
    "History pair cursor repeated an item",
  );

  const { data: auditedPresenceRows, error: auditedPresenceError } = await admin
    .from("audit_events")
    .select("actor_user_id,action,metadata")
    .eq("entity_type", "presence")
    .eq("entity_id", persistedCurrent.id)
    .in("action", ["record_arrival", "record_departure"]);
  if (auditedPresenceError) failAt("read Worker audit", auditedPresenceError);
  assert(auditedPresenceRows.length === 2, "Retries created duplicate Presence audit events");
  for (const event of auditedPresenceRows) {
    assert(event.actor_user_id === original.id, "Audit lost actor_user_id");
    assert(event.metadata.actor_worker_id === original.worker.id, "Audit lost actor_worker_id");
    assert(event.metadata.actor_surface === "worker_app", "Audit lost worker surface");
    assert(event.metadata.command_source === "app", "Audit source was not app");
    assert(event.metadata.command_source_reference === sourceReference, "Audit source reference was inconsistent");
  }

  const { error: inactiveWorkerError } = await admin
    .from("workers")
    .update({ status: "inactive" })
    .eq("id", other.worker.id);
  if (inactiveWorkerError) failAt("inactivate Worker", inactiveWorkerError);
  await expectRpcError(other.client, "get_worker_presence_action", {
    schedule_entry_id: uncoveredEntry.id,
  }, ["42501"], "Inactive Worker retained Presence access");

  await rpc(director.client, "mutate_worker_with_audit", {
    operation: "status_change",
    entity_id: replacement.worker.id,
    target_status: "terminated",
  }, "terminate replacement Worker");
  await expectRpcError(replacement.client, "get_worker_presence_action", {
    schedule_entry_id: replacedEntry.id,
  }, ["42501"], "Terminated Worker retained Presence access");

  await rpc(director.client, "suspend_worker_access", {
    organization_id: organization.id,
    worker_id: original.worker.id,
    reason: "Worker Presence test",
  }, "suspend original Worker access");
  await expectRpcError(original.client, "get_worker_presence_action", {
    schedule_entry_id: endedToday.id,
  }, ["42501"], "Suspended link retained Presence access");
  await rpc(director.client, "revoke_worker_access", {
    organization_id: organization.id,
    worker_id: original.worker.id,
    reason: "Worker Presence test",
  }, "revoke original Worker access");
  await expectRpcError(original.client, "get_worker_presence_action", {
    schedule_entry_id: endedToday.id,
  }, ["42501"], "Revoked link retained Presence access");

  const { error: inactiveOrganizationError } = await admin
    .from("organizations")
    .update({ status: "inactive" })
    .eq("id", isolatedOrganization.id);
  if (inactiveOrganizationError) failAt("inactivate Organization", inactiveOrganizationError);
  await expectRpcError(isolated.client, "get_worker_presence_action", {
    schedule_entry_id: randomUUID(),
  }, ["42501"], "Inactive Organization retained Presence access");

  console.log(JSON.stringify({
    sharedAggregate: true,
    stableStartAndCompleteReplay: true,
    databaseClock: true,
    temporalCivilDayAndOvernight: true,
    nonPublishedStatusesBlocked: true,
    originalAndReplacementResolution: true,
    absenceAndReplacementRacesSerialized: true,
    supersededCompletion: true,
    workerAndTenantIsolation: true,
    directDmlAndPrivateRpcBlocked: true,
    minimizedHistory: true,
    atomicAudit: true,
    suspendedRevokedInactiveTerminatedBlocked: true,
  }));
} finally {
  for (const organizationId of organizationIds) {
    try {
      await cleanupOrganization(organizationId);
    } catch (error) {
      console.error(`Worker Presence cleanup failed for ${organizationId}:`, error);
    }
  }
  if (userIds.length) {
    await admin.from("organization_members").delete().in("profile_id", userIds);
    await admin.from("profiles").delete().in("id", userIds);
    for (const userId of userIds) await admin.auth.admin.deleteUser(userId);
  }
  if (organizationIds.length) await admin.from("organizations").delete().in("id", organizationIds);
}
