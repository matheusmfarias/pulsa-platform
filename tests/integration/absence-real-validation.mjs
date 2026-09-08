import { randomUUID } from "node:crypto";

import { createClient } from "@supabase/supabase-js";

import { requireIntegrationTestEnv } from "./helpers/integration-test-env.mjs";

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function failAt(step, error) {
  throw new Error(
    `Absence real validation failed at ${step}: ${error.code ?? "unknown"} ${error.message ?? String(error)}`,
    { cause: error },
  );
}

const { supabaseUrl, publishableKey, serviceRoleKey } = requireIntegrationTestEnv();
const options = { auth: { autoRefreshToken: false, persistSession: false } };
const admin = createClient(supabaseUrl, serviceRoleKey, options);

async function createUserWithMembership(role, organizationIds, label) {
  const email = `absence-${label}-${randomUUID()}@example.invalid`;
  const { data: userData, error: userError } = await admin.auth.admin.createUser({
    email,
    password: randomUUID(),
    email_confirm: true,
  });
  if (userError) failAt(`create ${role} user`, userError);
  const user = userData.user;

  const { error: profileError } = await admin.from("profiles").insert({
    id: user.id,
    display_name: `Absence ${role}`,
  });
  if (profileError) failAt(`create ${role} profile`, profileError);

  const { error: membershipError } = await admin.from("organization_members").insert(
    organizationIds.map((organizationId) => ({
      organization_id: organizationId,
      profile_id: user.id,
      role,
      status: "active",
    })),
  );
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
  return { user, client };
}

const primaryOrganizationId = "00000000-0000-4000-8000-000000000001";
const suffix = String(Date.now()).slice(-6);
const { data: otherOrganization, error: otherOrganizationError } = await admin
  .from("organizations")
  .insert({
    legal_name: `Absence Cross Organization ${suffix} Ltda.`,
    trade_name: `Absence Cross ${suffix}`,
    status: "active",
  })
  .select("id")
  .single();
if (otherOrganizationError) failAt("create cross-organization fixture", otherOrganizationError);

const directorFixture = await createUserWithMembership(
  "DIRECTOR",
  [primaryOrganizationId, otherOrganization.id],
  "director",
);
const recruiterFixture = await createUserWithMembership(
  "RECRUITER",
  [primaryOrganizationId],
  "recruiter",
);
const director = directorFixture.client;
const recruiter = recruiterFixture.client;

let schedule;
let revision;
let entry;
let absence;

try {
  const { data: createdSchedule, error: scheduleError } = await director.rpc(
    "create_schedule",
    {
      organization_id: primaryOrganizationId,
      operation_id: "00000000-0000-4000-8000-000000000301",
      period_start: "2026-09-10",
      period_end: "2026-09-10",
    },
  );
  if (scheduleError) failAt("create Schedule fixture", scheduleError);
  schedule = createdSchedule;

  const { data: createdRevision, error: revisionError } = await director
    .from("schedule_revisions")
    .select("id")
    .eq("schedule_id", schedule.id)
    .single();
  if (revisionError) failAt("read ScheduleRevision fixture", revisionError);
  revision = createdRevision;

  const { data: createdEntry, error: entryError } = await director.rpc(
    "create_schedule_entry",
    {
      schedule_revision_id: revision.id,
      assignment_id: "00000000-0000-4000-8000-000000000701",
      starts_at: "2026-09-10T11:00:00Z",
      ends_at: "2026-09-10T19:00:00Z",
    },
  );
  if (entryError) failAt("create ScheduleEntry fixture", entryError);
  entry = createdEntry;

  const { error: submitError } = await director.rpc("submit_schedule_revision", {
    schedule_revision_id: revision.id,
  });
  if (submitError) failAt("submit ScheduleRevision fixture", submitError);
  const { error: approveError } = await director.rpc("approve_schedule_revision", {
    schedule_revision_id: revision.id,
  });
  if (approveError) failAt("approve ScheduleRevision fixture", approveError);
  const { error: publishError } = await director.rpc("publish_schedule_revision", {
    schedule_revision_id: revision.id,
  });
  if (publishError) failAt("publish ScheduleRevision fixture", publishError);

  const { data: createdAbsence, error: absenceError } = await director.rpc(
    "create_absence",
    {
      organization_id: primaryOrganizationId,
      schedule_entry_id: entry.id,
      reason: "sick",
      notes: "Validação real",
    },
  );
  if (absenceError) failAt("create valid Absence", absenceError);
  absence = createdAbsence;
  assert(absence.status === "reported", "New Absence is not reported");
  assert(absence.reported_by === directorFixture.user.id, "Absence reporter is wrong");

  const { error: duplicateError } = await director.rpc("create_absence", {
    organization_id: primaryOrganizationId,
    schedule_entry_id: entry.id,
    reason: "personal",
  });
  assert(duplicateError?.code === "23505", "Duplicate reported Absence was accepted");

  const { error: crossOrganizationError } = await director.rpc("create_absence", {
    organization_id: otherOrganization.id,
    schedule_entry_id: entry.id,
    reason: "other",
  });
  assert(
    crossOrganizationError?.code === "23514",
    "Cross-organization Absence was accepted",
  );

  const { error: recruiterCreateError } = await recruiter.rpc("create_absence", {
    organization_id: primaryOrganizationId,
    schedule_entry_id: entry.id,
    reason: "other",
  });
  assert(recruiterCreateError?.code === "42501", "RECRUITER created an Absence");

  const { error: recruiterCancelError } = await recruiter.rpc("cancel_absence", {
    organization_id: primaryOrganizationId,
    absence_id: absence.id,
  });
  assert(recruiterCancelError?.code === "42501", "RECRUITER cancelled an Absence");

  const absenceReadModel =
    "*, reporter:profiles!absences_reported_by_fkey(id, display_name), schedule_entry:schedule_entries!inner(*, assignment:assignments!inner(id, worker:workers!inner(id, full_name), position:positions!inner(id, job_role:job_roles!inner(id, name), unit:units!inner(id, name, timezone, operation:operations!inner(id, name, contract_id)))), schedule_revision:schedule_revisions!inner(id, schedule:schedules!inner(id, operation:operations!inner(id, contract_id, contract:contracts!inner(id, client_id))))))";
  const { data: readableAbsence, error: recruiterReadError } = await recruiter
    .from("absences")
    .select(absenceReadModel)
    .eq("id", absence.id)
    .eq(
      "schedule_entry.schedule_revision.schedule.operation.contract.client_id",
      "00000000-0000-4000-8000-000000000101",
    )
    .eq(
      "schedule_entry.schedule_revision.schedule.operation.contract.id",
      "00000000-0000-4000-8000-000000000201",
    )
    .single();
  if (recruiterReadError) failAt("RECRUITER read Absence", recruiterReadError);
  assert(readableAbsence.id === absence.id, "RECRUITER could not read Absence");
  assert(
    readableAbsence.reporter.display_name === "Absence DIRECTOR",
    "Absence reporter was not available to an absence reader",
  );
  assert(
    readableAbsence.schedule_entry.assignment.worker.full_name === "Mariana Alves",
    "Absence read model did not include the Worker",
  );

  const { error: directInsertError } = await director.from("absences").insert({
    organization_id: primaryOrganizationId,
    schedule_entry_id: entry.id,
    reason: "other",
    reported_by: directorFixture.user.id,
  });
  const { error: directUpdateError } = await director
    .from("absences")
    .update({ status: "cancelled" })
    .eq("id", absence.id);
  const { error: directDeleteError } = await director
    .from("absences")
    .delete()
    .eq("id", absence.id);
  for (const [operation, error] of [
    ["insert", directInsertError],
    ["update", directUpdateError],
    ["delete", directDeleteError],
  ]) {
    assert(error?.code === "42501", `Direct Absence ${operation} was not blocked`);
  }

  const { data: cancelledAbsence, error: cancelError } = await director.rpc(
    "cancel_absence",
    { organization_id: primaryOrganizationId, absence_id: absence.id },
  );
  if (cancelError) failAt("cancel Absence", cancelError);
  assert(cancelledAbsence.status === "cancelled", "Absence was not cancelled");

  const { data: persisted, error: persistedError } = await director
    .from("absences")
    .select("status")
    .eq("id", absence.id)
    .single();
  if (persistedError) failAt("read cancelled Absence", persistedError);
  assert(persisted.status === "cancelled", "Cancelled Absence history was removed");

  const { data: audits, error: auditError } = await admin
    .from("audit_events")
    .select("action")
    .eq("entity_type", "absence")
    .eq("entity_id", absence.id)
    .order("created_at", { ascending: true });
  if (auditError) failAt("read Absence audit", auditError);
  assert(
    audits.map(({ action }) => action).join(",") === "create,cancel",
    "Absence audit history is incomplete",
  );

  console.log("Absence real validation passed.");
} finally {
  if (absence) await admin.from("absences").delete().eq("id", absence.id);
  const auditEntityIds = [absence?.id, entry?.id, revision?.id, schedule?.id].filter(Boolean);
  if (auditEntityIds.length > 0) {
    await admin.from("audit_events").delete().in("entity_id", auditEntityIds);
  }
  if (entry) await admin.from("schedule_entries").delete().eq("id", entry.id);
  if (revision) await admin.from("schedule_revisions").delete().eq("id", revision.id);
  if (schedule) await admin.from("schedules").delete().eq("id", schedule.id);
  await admin
    .from("organization_members")
    .delete()
    .in("profile_id", [directorFixture.user.id, recruiterFixture.user.id]);
  await admin
    .from("profiles")
    .delete()
    .in("id", [directorFixture.user.id, recruiterFixture.user.id]);
  await admin.auth.admin.deleteUser(directorFixture.user.id);
  await admin.auth.admin.deleteUser(recruiterFixture.user.id);
  await admin.from("organizations").delete().eq("id", otherOrganization.id);
}
