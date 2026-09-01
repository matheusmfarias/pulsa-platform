import { execFileSync } from "node:child_process";
import { randomUUID } from "node:crypto";
import { readFileSync } from "node:fs";

import { createClient } from "@supabase/supabase-js";

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function readEnv() {
  return Object.fromEntries(
    readFileSync(new URL("../../.env", import.meta.url), "utf8")
      .split(/\r?\n/)
      .filter((line) => line && !line.startsWith("#"))
      .map((line) => {
        const separator = line.indexOf("=");
        return [line.slice(0, separator), line.slice(separator + 1)];
      }),
  );
}

function makeCpf(seed) {
  const base = seed.padStart(9, "0").slice(-9).split("").map(Number);
  const digit = (values, factor) => {
    const remainder = values.reduce((sum, value) => sum + value * factor--, 0) % 11;
    return remainder < 2 ? 0 : 11 - remainder;
  };
  const first = digit(base, 10);
  const second = digit([...base, first], 11);
  return [...base, first, second].join("");
}

const env = readEnv();
const projectRef = readFileSync(
  new URL("../../supabase/.temp/project-ref", import.meta.url),
  "utf8",
).trim();
assert(/^[a-z0-9]+$/.test(projectRef), "Invalid linked project ref");
const cliArgs = [
  "supabase",
  "projects",
  "api-keys",
  "--project-ref",
  projectRef,
  "--output",
  "json",
];
const apiKeysOutput =
  process.platform === "win32"
    ? execFileSync(
        "powershell.exe",
        ["-NoProfile", "-NonInteractive", "-Command", `npx ${cliArgs.join(" ")}`],
        { encoding: "utf8", stdio: ["ignore", "pipe", "ignore"] },
      )
    : execFileSync("npx", cliArgs, {
        encoding: "utf8",
        stdio: ["ignore", "pipe", "ignore"],
      });
const apiKeys = JSON.parse(apiKeysOutput);
const serviceKey = apiKeys.find((key) => key.id === "service_role")?.api_key;
assert(serviceKey, "Service-role key was not available through the linked CLI session");

const options = { auth: { autoRefreshToken: false, persistSession: false } };
const admin = createClient(env.NEXT_PUBLIC_SUPABASE_URL, serviceKey, options);
const { data: membership, error: membershipError } = await admin
  .from("organization_members")
  .select("organization_id, profile_id")
  .eq("status", "active")
  .eq("role", "DIRECTOR")
  .limit(1)
  .single();
if (membershipError) throw membershipError;

const { data: usersData, error: usersError } = await admin.auth.admin.listUsers();
if (usersError) throw usersError;
const actorUser = usersData.users.find((user) => user.id === membership.profile_id);
assert(actorUser?.email, "The active Director profile has no Auth email");

const { data: linkData, error: linkError } = await admin.auth.admin.generateLink({
  type: "magiclink",
  email: actorUser.email,
});
if (linkError) throw linkError;
const actor = createClient(
  env.NEXT_PUBLIC_SUPABASE_URL,
  env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
  options,
);
const { error: verifyError } = await actor.auth.verifyOtp({
  type: "magiclink",
  token_hash: linkData.properties.hashed_token,
});
if (verifyError) throw verifyError;

const suffix = String(Date.now()).slice(-9);
const documentNumber = makeCpf(suffix);
const fullName = `Audit Validation ${suffix}`;
const email = `audit-${suffix}@example.invalid`;
let workerId;
let temporaryUserId;
const created = {};

try {
  const createRpc = async (functionName, args) => {
    const { data, error } = await actor.rpc(functionName, args);
    if (error) throw error;
    return data;
  };

  const temporaryEmail = `audit-member-${suffix}@example.invalid`;
  const { data: temporaryUser, error: temporaryUserError } =
    await admin.auth.admin.createUser({
      email: temporaryEmail,
      password: randomUUID(),
      email_confirm: true,
    });
  if (temporaryUserError) throw temporaryUserError;
  temporaryUserId = temporaryUser.user.id;
  const { error: temporaryProfileError } = await admin
    .from("profiles")
    .insert({ id: temporaryUserId, display_name: "Audit Membership Validation" });
  if (temporaryProfileError) throw temporaryProfileError;
  const { error: temporaryMembershipError } = await admin
    .from("organization_members")
    .insert({
      organization_id: membership.organization_id,
      profile_id: temporaryUserId,
      role: "ADMINISTRATIVE",
      status: "active",
    });
  if (temporaryMembershipError) throw temporaryMembershipError;
  const { error: membershipChangeError } = await actor.rpc(
    "change_organization_membership_with_audit",
    {
      organization_id: membership.organization_id,
      target_profile_id: temporaryUserId,
      target_role: "HR",
      target_status: "inactive",
    },
  );
  if (membershipChangeError) throw membershipChangeError;
  const { data: membershipAudit, error: membershipAuditError } = await admin
    .from("audit_events")
    .select("actor_user_id, organization_id, metadata")
    .eq("entity_type", "organization_member")
    .eq("entity_id", temporaryUserId)
    .eq("action", "membership_change")
    .single();
  if (membershipAuditError) throw membershipAuditError;
  assert(membershipAudit.actor_user_id === membership.profile_id, "Wrong membership audit actor");
  assert(
    membershipAudit.organization_id === membership.organization_id,
    "Wrong membership audit organization",
  );
  assert(membershipAudit.metadata.previous_state.role === "ADMINISTRATIVE", "Wrong prior role");
  assert(membershipAudit.metadata.new_state.role === "HR", "Wrong new role");
  assert(membershipAudit.metadata.new_state.status === "inactive", "Wrong membership status");

  const client = await createRpc("mutate_client_with_audit", {
    operation: "create",
    organization_id: membership.organization_id,
    legal_name: `Audit Client ${suffix} Ltda`,
    trade_name: `Audit Client ${suffix}`,
    document_number: suffix.padStart(14, "0"),
  });
  created.client = client.id;
  const contract = await createRpc("mutate_contract_with_audit", {
    operation: "create",
    client_id: client.id,
    name: `Audit Contract ${suffix}`,
    start_date: "2026-01-01",
  });
  created.contract = contract.id;
  await createRpc("mutate_contract_with_audit", {
    operation: "status_change",
    entity_id: contract.id,
    target_status: "active",
  });
  const operation = await createRpc("mutate_operation_with_audit", {
    operation: "create",
    contract_id: contract.id,
    name: `Audit Operation ${suffix}`,
    start_date: "2026-01-01",
  });
  created.operation = operation.id;
  await createRpc("mutate_operation_with_audit", {
    operation: "update",
    entity_id: operation.id,
    contract_id: contract.id,
    name: operation.name,
    start_date: operation.start_date,
    manager_user_id: membership.profile_id,
  });
  const unit = await createRpc("mutate_unit_with_audit", {
    operation: "create",
    operation_id: operation.id,
    name: `Audit Unit ${suffix}`,
    code: `AUD-${suffix}`,
    timezone: "America/Sao_Paulo",
  });
  created.unit = unit.id;
  const jobRole = await createRpc("mutate_job_role_with_audit", {
    operation: "create",
    organization_id: membership.organization_id,
    name: `Audit Cargo ${suffix}`,
  });
  created.job_role = jobRole.id;
  const position = await createRpc("mutate_position_with_audit", {
    operation: "create",
    unit_id: unit.id,
    job_role_id: jobRole.id,
    base_required_headcount: 1,
  });
  created.position = position.id;

  for (const [entityType, entityId] of Object.entries(created)) {
    const { count, error } = await admin
      .from("audit_events")
      .select("id", { count: "exact", head: true })
      .eq("entity_type", entityType)
      .eq("entity_id", entityId)
      .eq("action", "create");
    if (error) throw error;
    assert(count === 1, `${entityType} create did not produce exactly one audit event`);
  }
  const { data: managerAudit, error: managerAuditError } = await admin
    .from("audit_events")
    .select("metadata")
    .eq("entity_type", "operation")
    .eq("entity_id", operation.id)
    .eq("action", "update")
    .single();
  if (managerAuditError) throw managerAuditError;
  assert(
    managerAudit.metadata.changes.includes("manager_user_id"),
    "Manager change was not represented in audit metadata",
  );

  const { data: worker, error: createError } = await actor.rpc(
    "mutate_worker_with_audit",
    {
      operation: "create",
      organization_id: membership.organization_id,
      full_name: fullName,
      document_number: documentNumber,
      email,
    },
  );
  if (createError) throw createError;
  workerId = worker.id;

  const { data: createAudit, error: createAuditError } = await admin
    .from("audit_events")
    .select("*")
    .eq("entity_id", workerId)
    .eq("action", "create")
    .single();
  if (createAuditError) throw createAuditError;
  assert(createAudit.organization_id === membership.organization_id, "Wrong audit organization");
  assert(createAudit.actor_user_id === membership.profile_id, "Wrong audit actor");
  const serializedMetadata = JSON.stringify(createAudit.metadata);
  assert(!serializedMetadata.includes(documentNumber), "Worker CPF leaked into audit metadata");
  assert(!serializedMetadata.includes(fullName), "Worker name leaked into audit metadata");
  assert(!serializedMetadata.includes(email), "Worker email leaked into audit metadata");

  const { error: workerStatusError } = await actor.rpc("mutate_worker_with_audit", {
    operation: "status_change",
    entity_id: workerId,
    organization_id: membership.organization_id,
    target_status: "active",
  });
  if (workerStatusError) throw workerStatusError;
  const { data: statusAudit, error: statusAuditError } = await admin
    .from("audit_events")
    .select("metadata")
    .eq("entity_id", workerId)
    .eq("action", "status_change")
    .single();
  if (statusAuditError) throw statusAuditError;
  assert(statusAudit.metadata.previous_state.status === "onboarding", "Wrong previous status");
  assert(statusAudit.metadata.new_state.status === "active", "Wrong new status");

  const { count: beforeFailure, error: beforeError } = await admin
    .from("audit_events")
    .select("id", { count: "exact", head: true })
    .eq("organization_id", membership.organization_id);
  if (beforeError) throw beforeError;
  const { error: duplicateError } = await actor.rpc("mutate_worker_with_audit", {
    operation: "create",
    organization_id: membership.organization_id,
    full_name: `${fullName} Duplicate`,
    document_number: documentNumber,
  });
  assert(duplicateError, "Duplicate worker mutation unexpectedly succeeded");
  const { count: afterFailure, error: afterError } = await admin
    .from("audit_events")
    .select("id", { count: "exact", head: true })
    .eq("organization_id", membership.organization_id);
  if (afterError) throw afterError;
  assert(beforeFailure === afterFailure, "Failed mutation created an audit event");

  const { error: directBusinessError } = await actor
    .from("workers")
    .update({ full_name: "Bypass attempt" })
    .eq("id", workerId);
  assert(directBusinessError, "Direct business-table update bypassed audited RPC");
  const { error: directAuditUpdateError } = await actor
    .from("audit_events")
    .update({ action: "update" })
    .eq("id", createAudit.id);
  assert(directAuditUpdateError, "Authenticated user updated append-only audit");
  const { error: directAuditDeleteError } = await actor
    .from("audit_events")
    .delete()
    .eq("id", createAudit.id);
  assert(directAuditDeleteError, "Authenticated user deleted append-only audit");
  const { error: auditReadError } = await actor
    .from("audit_events")
    .select("id")
    .limit(1);
  assert(auditReadError, "Authenticated user read internal audit events directly");

  console.log(
    JSON.stringify({
      mutationCreatesAudit: true,
      allBusinessEntitiesAudited: true,
      managerChangeAudited: true,
      membershipChangeAudited: true,
      statusChangeAudited: true,
      failureIsAtomic: true,
      directMutationBlocked: true,
      appendOnlyBlocked: true,
      authenticatedReadBlocked: true,
      workerPiiRedacted: true,
      actorAndOrganizationCorrect: true,
    }),
  );
} finally {
  if (workerId) {
    await admin.from("audit_events").delete().eq("entity_id", workerId);
    await admin.from("workers").delete().eq("id", workerId);
  }
  const entityIds = Object.values(created);
  if (entityIds.length) await admin.from("audit_events").delete().in("entity_id", entityIds);
  if (created.position) await admin.from("positions").delete().eq("id", created.position);
  if (created.job_role) await admin.from("job_roles").delete().eq("id", created.job_role);
  if (created.unit) await admin.from("units").delete().eq("id", created.unit);
  if (created.operation) await admin.from("operations").delete().eq("id", created.operation);
  if (created.contract) await admin.from("contracts").delete().eq("id", created.contract);
  if (created.client) await admin.from("clients").delete().eq("id", created.client);
  if (temporaryUserId) {
    await admin.from("audit_events").delete().eq("entity_id", temporaryUserId);
    await admin
      .from("organization_members")
      .delete()
      .eq("profile_id", temporaryUserId);
    await admin.from("profiles").delete().eq("id", temporaryUserId);
    await admin.auth.admin.deleteUser(temporaryUserId);
  }
}
