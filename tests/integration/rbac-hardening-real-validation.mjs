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

function generatedDocument(offset) {
  const base = Number(String(Date.now()).slice(-11));
  return `${String(base + offset).padStart(12, "0")}00`;
}

const fileEnv = readEnv();
const localTestConfiguration =
  process.env.SUPABASE_TEST_URL &&
  process.env.SUPABASE_TEST_PUBLISHABLE_KEY &&
  process.env.SUPABASE_TEST_SERVICE_ROLE_KEY;
let serviceKey = process.env.SUPABASE_TEST_SERVICE_ROLE_KEY;

if (!localTestConfiguration) {
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
          [
            "-NoProfile",
            "-NonInteractive",
            "-Command",
            `npx ${cliArgs.join(" ")}`,
          ],
          { encoding: "utf8", stdio: ["ignore", "pipe", "ignore"] },
        )
      : execFileSync("npx", cliArgs, {
          encoding: "utf8",
          stdio: ["ignore", "pipe", "ignore"],
        });
  serviceKey = JSON.parse(apiKeysOutput).find(
    (key) => key.id === "service_role",
  )?.api_key;
}
assert(serviceKey, "Service-role key unavailable");

const options = { auth: { autoRefreshToken: false, persistSession: false } };
const supabaseUrl =
  process.env.SUPABASE_TEST_URL ?? fileEnv.NEXT_PUBLIC_SUPABASE_URL;
const publishableKey =
  process.env.SUPABASE_TEST_PUBLISHABLE_KEY ??
  fileEnv.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
const admin = createClient(supabaseUrl, serviceKey, options);
const createdUserIds = [];
const createdOrganizationIds = [];
const createdClientIds = [];
const createdEntities = {};
let otherJobRoleId;

async function createActor(organizationId, role, status, label) {
  const email = `rbac-${label}-${Date.now()}-${randomUUID()}@example.invalid`;
  const { data: userData, error: userError } = await admin.auth.admin.createUser({
    email,
    password: randomUUID(),
    email_confirm: true,
  });
  if (userError) throw userError;
  const user = userData.user;
  createdUserIds.push(user.id);

  const { error: profileError } = await admin
    .from("profiles")
    .insert({ id: user.id, display_name: `RBAC ${label}` });
  if (profileError) throw profileError;
  if (organizationId) {
    const { error: membershipError } = await admin
      .from("organization_members")
      .insert({
        organization_id: organizationId,
        profile_id: user.id,
        role,
        status,
      });
    if (membershipError) throw membershipError;
  }

  const { data: link, error: linkError } = await admin.auth.admin.generateLink({
    type: "magiclink",
    email,
  });
  if (linkError) throw linkError;
  const client = createClient(
    supabaseUrl,
    publishableKey,
    options,
  );
  const { error: verifyError } = await client.auth.verifyOtp({
    type: "magiclink",
    token_hash: link.properties.hashed_token,
  });
  if (verifyError) throw verifyError;
  return { client, userId: user.id };
}

async function createOrganization(label) {
  const { data, error } = await admin
    .from("organizations")
    .insert({
      legal_name: `RBAC ${label} ${Date.now()} Ltda`,
      trade_name: `RBAC ${label}`,
      status: "active",
    })
    .select("id")
    .single();
  if (error) throw error;
  createdOrganizationIds.push(data.id);
  return data.id;
}

try {
  const organizationA = await createOrganization("Organization A");
  const organizationB = await createOrganization("Organization B");
  const authorized = await createActor(
    organizationA,
    "DIRECTOR",
    "active",
    "authorized",
  );
  const withoutPermission = await createActor(
    organizationA,
    "ADMINISTRATIVE",
    "active",
    "without-permission",
  );
  const otherOrganization = await createActor(
    organizationB,
    "DIRECTOR",
    "active",
    "other-organization",
  );
  const inactive = await createActor(
    organizationA,
    "DIRECTOR",
    "inactive",
    "inactive",
  );
  const withoutMembership = await createActor(
    null,
    null,
    null,
    "without-membership",
  );

  const createInput = {
    operation: "create",
    organization_id: organizationA,
    legal_name: `RBAC Authorized Client ${Date.now()} Ltda`,
    trade_name: "RBAC Authorized Client",
    document_number: generatedDocument(1),
  };
  const { data: createdClient, error: authorizedError } = await authorized.client.rpc(
    "mutate_client_with_audit",
    createInput,
  );
  if (authorizedError) throw authorizedError;
  createdClientIds.push(createdClient.id);
  createdEntities.client = createdClient.id;

  const authorizedRpc = async (functionName, args) => {
    const { data, error } = await authorized.client.rpc(functionName, args);
    if (error) throw error;
    return data;
  };
  const contract = await authorizedRpc("mutate_contract_with_audit", {
    operation: "create",
    client_id: createdClient.id,
    name: "RBAC Contract",
    start_date: "2026-01-01",
  });
  createdEntities.contract = contract.id;
  await authorizedRpc("mutate_contract_with_audit", {
    operation: "status_change",
    entity_id: contract.id,
    target_status: "active",
  });
  const operation = await authorizedRpc("mutate_operation_with_audit", {
    operation: "create",
    contract_id: contract.id,
    name: "RBAC Operation",
    start_date: "2026-01-01",
    manager_user_id: authorized.userId,
  });
  createdEntities.operation = operation.id;
  const unit = await authorizedRpc("mutate_unit_with_audit", {
    operation: "create",
    operation_id: operation.id,
    name: "RBAC Unit",
    code: `RBAC-${String(Date.now()).slice(-8)}`,
    timezone: "America/Sao_Paulo",
  });
  createdEntities.unit = unit.id;
  const jobRole = await authorizedRpc("mutate_job_role_with_audit", {
    operation: "create",
    organization_id: organizationA,
    name: "RBAC Cargo",
  });
  createdEntities.job_role = jobRole.id;
  const { data: otherJobRole, error: otherJobRoleError } =
    await otherOrganization.client.rpc("mutate_job_role_with_audit", {
      operation: "create",
      organization_id: organizationB,
      name: "RBAC Cargo Outra Organização",
    });
  if (otherJobRoleError) throw otherJobRoleError;
  otherJobRoleId = otherJobRole.id;

  const { error: deniedJobRoleCreateError } = await withoutPermission.client.rpc(
    "mutate_job_role_with_audit",
    { operation: "create", organization_id: organizationA, name: "Cargo Negado" },
  );
  assert(deniedJobRoleCreateError?.code === "42501", "Role without permission created JobRole");

  const { error: deniedJobRoleUpdateError } = await withoutPermission.client.rpc(
    "mutate_job_role_with_audit",
    { operation: "update", entity_id: jobRole.id, name: "Cargo Alterado" },
  );
  assert(deniedJobRoleUpdateError?.code === "42501", "Role without permission updated JobRole");

  const { error: crossJobRoleError } = await authorized.client.rpc(
    "mutate_position_with_audit",
    {
      operation: "create",
      unit_id: unit.id,
      job_role_id: otherJobRole.id,
      base_required_headcount: 1,
    },
  );
  assert(crossJobRoleError?.code === "23514", "Cross-organization JobRole was assigned to Position");

  const { data: hiddenOtherJobRole, error: hiddenOtherJobRoleError } =
    await authorized.client.from("job_roles").select("id").eq("id", otherJobRole.id);
  if (hiddenOtherJobRoleError) throw hiddenOtherJobRoleError;
  assert(hiddenOtherJobRole.length === 0, "JobRole from another Organization was visible");

  const { error: directJobRoleInsertError } = await authorized.client
    .from("job_roles")
    .insert({ organization_id: organizationA, name: "Cargo Direto" });
  assert(directJobRoleInsertError, "Direct JobRole INSERT unexpectedly succeeded");
  const position = await authorizedRpc("mutate_position_with_audit", {
    operation: "create",
    unit_id: unit.id,
    job_role_id: jobRole.id,
    base_required_headcount: 1,
  });
  createdEntities.position = position.id;
  const worker = await authorizedRpc("mutate_worker_with_audit", {
    operation: "create",
    organization_id: organizationA,
    full_name: "RBAC Worker",
    document_number: String(Date.now()).slice(-11),
  });
  createdEntities.worker = worker.id;
  await authorizedRpc("mutate_worker_with_audit", {
    operation: "status_change",
    entity_id: worker.id,
    organization_id: organizationA,
    target_status: "active",
  });
  const assignment = await authorizedRpc("mutate_assignment_with_audit", {
    operation: "create",
    worker_id: worker.id,
    position_id: position.id,
    start_date: "2198-01-01",
    end_date: "2198-01-10",
  });
  createdEntities.assignment = assignment.id;

  const { data: roleData, error: roleError } = await withoutPermission.client.rpc(
    "mutate_client_with_audit",
    { ...createInput, document_number: generatedDocument(2) },
  );
  if (roleData?.id) createdClientIds.push(roleData.id);
  assert(roleError?.code === "42501", "Role without permission mutated Client");

  const { data: crossOrganizationData, error: crossOrganizationError } =
    await otherOrganization.client.rpc("mutate_client_with_audit", {
      ...createInput,
      document_number: generatedDocument(3),
    });
  if (crossOrganizationData?.id) createdClientIds.push(crossOrganizationData.id);
  assert(
    crossOrganizationError?.code === "42501",
    "Member from another Organization mutated Client",
  );

  const { data: inactiveData, error: inactiveError } = await inactive.client.rpc(
    "mutate_client_with_audit",
    { ...createInput, document_number: generatedDocument(4) },
  );
  if (inactiveData?.id) createdClientIds.push(inactiveData.id);
  assert(inactiveError?.code === "42501", "Inactive membership mutated Client");

  const { data: missingMembershipData, error: missingMembershipError } =
    await withoutMembership.client.rpc("mutate_client_with_audit", {
      ...createInput,
      document_number: generatedDocument(6),
    });
  if (missingMembershipData?.id) createdClientIds.push(missingMembershipData.id);
  assert(
    missingMembershipError?.code === "42501",
    "User without membership mutated Client",
  );

  const { data: directInsertData, error: directInsertError } = await authorized.client
    .from("clients")
    .insert({
      organization_id: organizationA,
      legal_name: "RBAC Direct Insert Ltda",
      trade_name: "RBAC Direct Insert",
      document_number: generatedDocument(5),
      status: "active",
    })
    .select("id")
    .single();
  if (directInsertData?.id) createdClientIds.push(directInsertData.id);
  assert(directInsertError, "Direct Client INSERT unexpectedly succeeded");

  const { error: directUpdateError } = await authorized.client
    .from("clients")
    .update({ trade_name: "RBAC Direct Update" })
    .eq("id", createdClient.id);
  assert(directUpdateError, "Direct Client UPDATE unexpectedly succeeded");

  const { data: auditEvents, error: auditError } = await admin
    .from("audit_events")
    .select("actor_user_id, organization_id, action")
    .eq("entity_type", "client")
    .eq("entity_id", createdClient.id);
  if (auditError) throw auditError;
  assert(auditEvents.length === 1, "Authorized mutation did not create one audit event");
  assert(auditEvents[0].action === "create", "Wrong audit action");
  assert(
    auditEvents[0].actor_user_id === authorized.userId,
    "Wrong audit actor",
  );
  assert(
    auditEvents[0].organization_id === organizationA,
    "Wrong audit organization",
  );

  for (const [entityType, entityId] of Object.entries(createdEntities)) {
    const { count, error } = await admin
      .from("audit_events")
      .select("id", { count: "exact", head: true })
      .eq("entity_type", entityType)
      .eq("entity_id", entityId)
      .eq("action", "create");
    if (error) throw error;
    assert(count === 1, `${entityType} create did not create one audit event`);
  }

  console.log(
    JSON.stringify({
      allAuthorizedMutationRpcsAllowed: true,
      roleWithoutPermissionDenied: true,
      crossOrganizationDenied: true,
      inactiveMembershipDenied: true,
      missingMembershipDenied: true,
      directInsertDenied: true,
      directUpdateDenied: true,
      auditPreserved: true,
    }),
  );
} finally {
  const entityIds = [
    ...new Set([...createdClientIds, ...Object.values(createdEntities)]),
  ];
  if (entityIds.length) await admin.from("audit_events").delete().in("entity_id", entityIds);
  if (createdEntities.assignment)
    await admin.from("assignments").delete().eq("id", createdEntities.assignment);
  if (createdEntities.worker)
    await admin.from("workers").delete().eq("id", createdEntities.worker);
  if (createdEntities.position)
    await admin.from("positions").delete().eq("id", createdEntities.position);
  if (createdEntities.job_role)
    await admin.from("job_roles").delete().eq("id", createdEntities.job_role);
  if (otherJobRoleId)
    await admin.from("job_roles").delete().eq("id", otherJobRoleId);
  if (createdEntities.unit)
    await admin.from("units").delete().eq("id", createdEntities.unit);
  if (createdEntities.operation)
    await admin.from("operations").delete().eq("id", createdEntities.operation);
  if (createdEntities.contract)
    await admin.from("contracts").delete().eq("id", createdEntities.contract);
  if (createdClientIds.length)
    await admin.from("clients").delete().in("id", createdClientIds);
  for (const userId of createdUserIds) {
    await admin.from("organization_members").delete().eq("profile_id", userId);
    await admin.from("profiles").delete().eq("id", userId);
    await admin.auth.admin.deleteUser(userId);
  }
  for (const organizationId of createdOrganizationIds) {
    await admin.from("organizations").delete().eq("id", organizationId);
  }
}
