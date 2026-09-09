import { randomUUID } from "node:crypto";

import { createClient } from "@supabase/supabase-js";

import { requireIntegrationTestEnv } from "./helpers/integration-test-env.mjs";

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function isoDate(value) {
  return value.toISOString().slice(0, 10);
}

function atOffset(hours, durationHours = 4) {
  const startsAt = new Date(Date.now() + hours * 60 * 60 * 1000);
  return {
    starts_at: startsAt.toISOString(),
    ends_at: new Date(startsAt.getTime() + durationHours * 60 * 60 * 1000).toISOString(),
  };
}

function localDate(value, timezone) {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: timezone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(value);
}

const { supabaseUrl, publishableKey, serviceRoleKey } = requireIntegrationTestEnv();
const options = { auth: { autoRefreshToken: false, persistSession: false } };
const admin = createClient(supabaseUrl, serviceRoleKey, options);
const marker = `${Date.now()}-${randomUUID()}`;
const timezone = "Pacific/Kiritimati";
const organizationIds = [];
const userIds = [];

async function insert(table, values, columns = "*") {
  const { data, error } = await admin.from(table).insert(values).select(columns).single();
  if (error) throw new Error(`Fixture ${table}: ${error.code} ${error.message}`, { cause: error });
  return data;
}

async function createUser(label, organizationId = null) {
  const email = `worker-schedule-${label}-${marker}@example.invalid`;
  const { data, error } = await admin.auth.admin.createUser({
    email,
    password: randomUUID(),
    email_confirm: true,
  });
  if (error) throw error;
  userIds.push(data.user.id);
  await insert("profiles", { id: data.user.id, display_name: label });
  if (organizationId) {
    await insert("organization_members", {
      organization_id: organizationId,
      profile_id: data.user.id,
      role: "DIRECTOR",
      status: "active",
    });
  }
  const { data: link, error: linkError } = await admin.auth.admin.generateLink({
    type: "magiclink",
    email,
  });
  if (linkError) throw linkError;
  const client = createClient(supabaseUrl, publishableKey, options);
  const { error: authError } = await client.auth.verifyOtp({
    type: "magiclink",
    token_hash: link.properties.hashed_token,
  });
  if (authError) throw authError;
  return { client, email, id: data.user.id };
}

async function createWorkerAccess(organizationId, label) {
  const user = await createUser(label);
  const digits = `${Date.now()}${Math.floor(Math.random() * 1000)}`.slice(-11);
  const worker = await insert("workers", {
    organization_id: organizationId,
    full_name: `Worker ${label}`,
    document_number: digits,
    status: "active",
    engagement_start_date: "2020-01-01",
    engagement_end_date: "2099-12-31",
  });
  const invitation = await insert("worker_access_invitations", {
    worker_id: worker.id,
    auth_user_id: user.id,
    invitation_email: user.email,
    invitation_token_hash: crypto.randomUUID().replaceAll("-", "").padEnd(64, "0"),
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

async function createRevision(scheduleId, version, actorId) {
  return insert("schedule_revisions", {
    schedule_id: scheduleId,
    version,
    status: "draft",
    created_by: actorId,
  });
}

async function createEntry(revisionId, assignmentId, interval, actorId) {
  return insert("schedule_entries", {
    schedule_revision_id: revisionId,
    assignment_id: assignmentId,
    ...interval,
    break_starts_at: new Date(new Date(interval.starts_at).getTime() + 2 * 60 * 60 * 1000).toISOString(),
    break_ends_at: new Date(new Date(interval.starts_at).getTime() + 2.5 * 60 * 60 * 1000).toISOString(),
    created_by: actorId,
  });
}

async function moveRevision(revisionId, status, actorId) {
  const now = new Date().toISOString();
  const metadata = {
    pending_approval: { submitted_at: now, submitted_by: actorId },
    approved: { approved_at: now, approved_by: actorId },
    published: { published_at: now, published_by: actorId },
  }[status];
  const { error } = await admin.from("schedule_revisions").update({ status, ...metadata }).eq("id", revisionId);
  if (error) throw new Error(`Transition ${status}: ${error.code} ${error.message}`, { cause: error });
}

async function publish(revisionId, actorId) {
  await moveRevision(revisionId, "pending_approval", actorId);
  await moveRevision(revisionId, "approved", actorId);
  await moveRevision(revisionId, "published", actorId);
}

function assertMinimized(entry) {
  const forbidden = [
    "worker_id", "assignment_id", "organization_id", "client_id", "contract_id",
    "absence_id", "replacement_id", "notes", "document_number", "full_name",
  ];
  for (const key of forbidden) assert(!(key in entry), `Read model leaked ${key}`);
}

try {
  const organization = await insert("organizations", {
    legal_name: `Worker Schedule ${marker} Ltda`,
    trade_name: `Worker Schedule ${marker}`,
    status: "active",
  });
  organizationIds.push(organization.id);
  const foreignOrganization = await insert("organizations", {
    legal_name: `Worker Schedule Foreign ${marker} Ltda`,
    trade_name: `Worker Schedule Foreign ${marker}`,
    status: "active",
  });
  organizationIds.push(foreignOrganization.id);

  const director = await createUser("director", organization.id);
  const original = await createWorkerAccess(organization.id, "original");
  const replacement = await createWorkerAccess(organization.id, "replacement");
  const withoutJourney = await createWorkerAccess(organization.id, "without-journey");
  const foreign = await createWorkerAccess(foreignOrganization.id, "foreign");

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
    code: `WS-${Date.now()}`,
    address: "Safe address",
    city: "Kiritimati",
    state: "Line Islands",
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
    base_required_headcount: 2,
    status: "active",
  });
  const originalAssignment = await insert("assignments", {
    worker_id: original.worker.id,
    position_id: position.id,
    start_date: "2020-01-01",
    end_date: "2099-12-31",
    status: "active",
  });
  const replacementAssignment = await insert("assignments", {
    worker_id: replacement.worker.id,
    position_id: position.id,
    start_date: "2020-01-01",
    end_date: "2099-12-31",
    status: "active",
  });
  const schedule = await insert("schedules", {
    organization_id: organization.id,
    operation_id: operation.id,
    period_start: isoDate(new Date(Date.now() - 15 * 86400000)),
    period_end: isoDate(new Date(Date.now() + 15 * 86400000)),
    created_by: director.id,
  });

  const oldRevision = await createRevision(schedule.id, 1, director.id);
  const oldRealized = await createEntry(oldRevision.id, originalAssignment.id, atOffset(-96), director.id);
  const oldUnrealized = await createEntry(oldRevision.id, originalAssignment.id, atOffset(-72), director.id);
  await publish(oldRevision.id, director.id);

  const oldPresence = await insert("presences", {
    organization_id: organization.id,
    schedule_entry_id: oldRealized.id,
    actual_assignment_id: originalAssignment.id,
    status: "completed",
    arrived_at: oldRealized.starts_at,
    departed_at: oldRealized.ends_at,
    source: "manual",
    created_by: director.id,
    completed_at: new Date().toISOString(),
    completed_by: director.id,
  });
  assert(oldPresence.status === "completed", "Historical Presence fixture failed");

  const hiddenEntries = [];
  for (const [version, targetStatus, offset] of [
    [2, "draft", 120],
    [3, "pending_approval", 128],
    [4, "approved", 136],
  ]) {
    const revision = await createRevision(schedule.id, version, director.id);
    hiddenEntries.push(await createEntry(revision.id, originalAssignment.id, atOffset(offset), director.id));
    if (targetStatus === "pending_approval") await moveRevision(revision.id, targetStatus, director.id);
    if (targetStatus === "approved") {
      await moveRevision(revision.id, "pending_approval", director.id);
      await moveRevision(revision.id, "approved", director.id);
    }
  }

  const currentRevision = await createRevision(schedule.id, 5, director.id);
  const current = await createEntry(currentRevision.id, originalAssignment.id, atOffset(-1, 4), director.id);
  const completed = await createEntry(currentRevision.id, originalAssignment.id, atOffset(-48), director.id);
  const expected = await createEntry(currentRevision.id, originalAssignment.id, atOffset(24), director.id);
  const absent = await createEntry(currentRevision.id, originalAssignment.id, atOffset(48), director.id);
  const replaced = await createEntry(currentRevision.id, originalAssignment.id, atOffset(72), director.id);
  const cancelledPresenceEntry = await createEntry(currentRevision.id, originalAssignment.id, atOffset(96), director.id);

  const boundaryInstant = new Date();
  boundaryInstant.setUTCDate(boundaryInstant.getUTCDate() + 6);
  boundaryInstant.setUTCHours(12, 30, 0, 0);
  const timezoneBoundary = await createEntry(
    currentRevision.id,
    originalAssignment.id,
    { starts_at: boundaryInstant.toISOString(), ends_at: new Date(boundaryInstant.getTime() + 4 * 3600000).toISOString() },
    director.id,
  );
  await publish(currentRevision.id, director.id);

  await insert("presences", {
    organization_id: organization.id,
    schedule_entry_id: current.id,
    actual_assignment_id: originalAssignment.id,
    status: "present",
    arrived_at: current.starts_at,
    source: "manual",
    created_by: director.id,
  });
  await insert("presences", {
    organization_id: organization.id,
    schedule_entry_id: completed.id,
    actual_assignment_id: originalAssignment.id,
    status: "completed",
    arrived_at: completed.starts_at,
    departed_at: completed.ends_at,
    source: "manual",
    created_by: director.id,
    completed_at: new Date().toISOString(),
    completed_by: director.id,
  });
  const cancelledPresence = await insert("presences", {
    organization_id: organization.id,
    schedule_entry_id: cancelledPresenceEntry.id,
    actual_assignment_id: originalAssignment.id,
    status: "cancelled",
    arrived_at: cancelledPresenceEntry.starts_at,
    source: "manual",
    created_by: director.id,
    cancelled_at: new Date().toISOString(),
    cancelled_by: director.id,
    cancellation_reason: "Fixture cancellation",
  });
  assert(cancelledPresence.status === "cancelled", "Cancelled Presence fixture failed");

  await insert("absences", {
    organization_id: organization.id,
    schedule_entry_id: absent.id,
    reason: "other",
    status: "reported",
    reported_by: director.id,
  });
  const replacedAbsence = await insert("absences", {
    organization_id: organization.id,
    schedule_entry_id: replaced.id,
    reason: "other",
    status: "reported",
    reported_by: director.id,
  });
  await insert("replacements", {
    organization_id: organization.id,
    absence_id: replacedAbsence.id,
    replacement_assignment_id: replacementAssignment.id,
    status: "active",
    created_by: director.id,
  });

  const fromDate = isoDate(new Date(Date.now() - 14 * 86400000));
  const toDate = isoDate(new Date(Date.now() + 14 * 86400000));
  const { data: originalRows, error: originalError } = await original.client.rpc("list_worker_schedule", {
    from_date: fromDate,
    to_date: toDate,
  });
  if (originalError) throw originalError;
  originalRows.forEach(assertMinimized);
  const byId = new Map(originalRows.map((entry) => [entry.schedule_entry_id, entry]));
  assert(byId.get(current.id)?.journey_status === "in_progress", "Current Presence was not in progress");
  assert(byId.get(completed.id)?.journey_status === "completed", "Completed Presence was not completed");
  assert(byId.get(expected.id)?.journey_status === "original_expected", "Original journey was not expected");
  assert(byId.get(absent.id)?.journey_status === "original_absent", "Reported Absence was not classified");
  assert(byId.get(replaced.id)?.journey_status === "original_replaced", "Covered Absence was not classified");
  assert(byId.get(cancelledPresenceEntry.id)?.journey_status === "original_expected", "Cancelled Presence changed the plan");
  assert(byId.get(cancelledPresenceEntry.id)?.presence_status === null, "Cancelled Presence was exposed as realization");
  assert(!byId.has(oldRealized.id) && !byId.has(oldUnrealized.id), "Superseded publication leaked into the official list");
  for (const entry of hiddenEntries) assert(!byId.has(entry.id), "Non-published revision leaked");
  assert(byId.get(current.id)?.was_republished === true, "Republication was not signaled");

  const { data: replacementRows, error: replacementError } = await replacement.client.rpc("list_worker_schedule", {
    from_date: fromDate,
    to_date: toDate,
  });
  if (replacementError) throw replacementError;
  assert(replacementRows.length === 1, "Replacement saw unrelated original journeys");
  assert(replacementRows[0].schedule_entry_id === replaced.id, "Replacement did not see its journey");
  assert(replacementRows[0].journey_status === "replacement_expected", "Replacement status was incorrect");
  assertMinimized(replacementRows[0]);

  const { data: historical, error: historicalError } = await original.client.rpc("get_worker_schedule_entry", {
    target_schedule_entry_id: oldRealized.id,
  });
  if (historicalError) throw historicalError;
  assert(historical[0]?.journey_status === "completed", "Own historical realization was not retained");
  const oldUnrealizedResult = await original.client.rpc("get_worker_schedule_entry", {
    target_schedule_entry_id: oldUnrealized.id,
  });
  assert(oldUnrealizedResult.error?.code === "P0002", "Unrealized superseded entry remained addressable");

  const foreignRead = await foreign.client.rpc("get_worker_schedule_entry", {
    target_schedule_entry_id: current.id,
  });
  assert(foreignRead.error?.code === "P0002", "Cross-Organization entry UUID was enumerable");
  const otherWorkerRead = await replacement.client.rpc("get_worker_schedule_entry", {
    target_schedule_entry_id: expected.id,
  });
  assert(otherWorkerRead.error?.code === "P0002", "Another Worker's entry UUID was enumerable");

  const localBoundaryDate = localDate(boundaryInstant, timezone);
  const utcBoundaryDate = isoDate(boundaryInstant);
  assert(localBoundaryDate !== utcBoundaryDate, "Timezone boundary fixture did not cross a civil date");
  const localBoundaryResult = await original.client.rpc("list_worker_schedule", {
    from_date: localBoundaryDate,
    to_date: localBoundaryDate,
  });
  if (localBoundaryResult.error) throw localBoundaryResult.error;
  assert(localBoundaryResult.data.some((entry) => entry.schedule_entry_id === timezoneBoundary.id), "Unit civil date did not include the entry");
  const utcBoundaryResult = await original.client.rpc("list_worker_schedule", {
    from_date: utcBoundaryDate,
    to_date: utcBoundaryDate,
  });
  if (utcBoundaryResult.error) throw utcBoundaryResult.error;
  assert(!utcBoundaryResult.data.some((entry) => entry.schedule_entry_id === timezoneBoundary.id), "UTC date was trusted over Unit timezone");

  const oversized = await original.client.rpc("list_worker_schedule", {
    from_date: "2026-01-01",
    to_date: "2026-02-01",
  });
  assert(oversized.error?.code === "22023", "Read model accepted more than 31 civil days");
  const { data: home, error: homeError } = await original.client.rpc("get_worker_home");
  if (homeError) throw homeError;
  assert(home.some((entry) => entry.home_slot === "current" && entry.schedule_entry_id === current.id), "Today did not select the current journey");
  const emptyHome = await withoutJourney.client.rpc("get_worker_home");
  if (emptyHome.error) throw emptyHome.error;
  assert(emptyHome.data.length === 0, "Worker without journeys received another Worker's Home");

  const internalOnly = await director.client.rpc("get_worker_home");
  assert(internalOnly.error?.code === "42501", "Backoffice membership alone crossed the Worker boundary");
  const { error: suspendError } = await admin
    .from("worker_access_links")
    .update({
      status: "suspended",
      suspended_at: new Date().toISOString(),
      suspended_by: director.id,
      suspension_reason: "Fixture suspension",
    })
    .eq("id", original.access.id);
  if (suspendError) throw suspendError;
  const suspendedRead = await original.client.rpc("get_worker_home");
  assert(suspendedRead.error?.code === "42501", "Suspended Worker read the schedule");

  console.log(JSON.stringify({
    latestPublishedOnly: true,
    ownHistoricalPresence: true,
    originalAndReplacementStatuses: true,
    cancelledPresenceIgnored: true,
    timezoneCivilDate: true,
    minimizedProjection: true,
    idEnumerationBlocked: true,
    workerBoundaryEnforced: true,
    emptyStateIsolated: true,
  }));
} finally {
  if (organizationIds.length) {
    await admin.from("audit_events").delete().in("organization_id", organizationIds);
    await admin.from("presences").delete().in("organization_id", organizationIds);
    await admin.from("replacements").delete().in("organization_id", organizationIds);
    await admin.from("absences").delete().in("organization_id", organizationIds);
    const { data: schedules } = await admin.from("schedules").select("id").in("organization_id", organizationIds);
    const scheduleIds = schedules?.map((item) => item.id) ?? [];
    if (scheduleIds.length) {
      const { data: revisions } = await admin.from("schedule_revisions").select("id").in("schedule_id", scheduleIds);
      const revisionIds = revisions?.map((item) => item.id) ?? [];
      if (revisionIds.length) await admin.from("schedule_entries").delete().in("schedule_revision_id", revisionIds);
      await admin.from("schedule_revisions").delete().in("schedule_id", scheduleIds);
      await admin.from("schedules").delete().in("id", scheduleIds);
    }
    const { data: workers } = await admin.from("workers").select("id").in("organization_id", organizationIds);
    const workerIds = workers?.map((item) => item.id) ?? [];
    if (workerIds.length) {
      await admin.from("worker_access_links").delete().in("worker_id", workerIds);
      await admin.from("worker_access_invitations").delete().in("worker_id", workerIds);
      await admin.from("assignments").delete().in("worker_id", workerIds);
      await admin.from("workers").delete().in("id", workerIds);
    }
    const { data: clients } = await admin.from("clients").select("id").in("organization_id", organizationIds);
    const clientIds = clients?.map((item) => item.id) ?? [];
    if (clientIds.length) {
      const { data: contracts } = await admin.from("contracts").select("id").in("client_id", clientIds);
      const contractIds = contracts?.map((item) => item.id) ?? [];
      if (contractIds.length) {
        const { data: operations } = await admin.from("operations").select("id").in("contract_id", contractIds);
        const operationIds = operations?.map((item) => item.id) ?? [];
        if (operationIds.length) {
          const { data: units } = await admin.from("units").select("id").in("operation_id", operationIds);
          const unitIds = units?.map((item) => item.id) ?? [];
          if (unitIds.length) await admin.from("positions").delete().in("unit_id", unitIds);
          await admin.from("units").delete().in("operation_id", operationIds);
          await admin.from("operations").delete().in("id", operationIds);
        }
        await admin.from("contracts").delete().in("id", contractIds);
      }
      await admin.from("clients").delete().in("id", clientIds);
    }
    await admin.from("job_roles").delete().in("organization_id", organizationIds);
  }
  if (userIds.length) {
    await admin.from("organization_members").delete().in("profile_id", userIds);
    await admin.from("profiles").delete().in("id", userIds);
    for (const userId of userIds) await admin.auth.admin.deleteUser(userId);
  }
  if (organizationIds.length) await admin.from("organizations").delete().in("id", organizationIds);
}
