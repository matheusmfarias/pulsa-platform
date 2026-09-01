import { randomUUID } from "node:crypto";

import { createClient } from "@supabase/supabase-js";

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function documentNumber(length, offset) {
  return String((Date.now() + offset) % 10 ** length).padStart(length, "0");
}

const supabaseUrl = process.env.SUPABASE_TEST_URL;
const publishableKey = process.env.SUPABASE_TEST_PUBLISHABLE_KEY;
const serviceKey = process.env.SUPABASE_TEST_SERVICE_ROLE_KEY;
assert(supabaseUrl && publishableKey && serviceKey, "Local Supabase test credentials are required");

const options = { auth: { autoRefreshToken: false, persistSession: false } };
const admin = createClient(supabaseUrl, serviceKey, options);
const created = {
  organizations: [],
  users: [],
  clients: [],
  contracts: [],
  operations: [],
  units: [],
  jobRoles: [],
  positions: [],
  workers: [],
  assignments: [],
};

async function createDirector(organizationId) {
  const email = `history-${Date.now()}-${randomUUID()}@example.invalid`;
  const { data: userData, error: userError } = await admin.auth.admin.createUser({
    email,
    password: randomUUID(),
    email_confirm: true,
  });
  if (userError) throw userError;
  const user = userData.user;
  created.users.push(user.id);
  const { error: profileError } = await admin
    .from("profiles")
    .insert({ id: user.id, display_name: "Operational History Director" });
  if (profileError) throw profileError;
  const { error: membershipError } = await admin
    .from("organization_members")
    .insert({
      organization_id: organizationId,
      profile_id: user.id,
      role: "DIRECTOR",
      status: "active",
    });
  if (membershipError) throw membershipError;

  const { data: link, error: linkError } = await admin.auth.admin.generateLink({
    type: "magiclink",
    email,
  });
  if (linkError) throw linkError;
  const actor = createClient(supabaseUrl, publishableKey, options);
  const { error: verifyError } = await actor.auth.verifyOtp({
    type: "magiclink",
    token_hash: link.properties.hashed_token,
  });
  if (verifyError) throw verifyError;
  return { actor, userId: user.id };
}

async function expectRejected(request, message, expectedMessage) {
  const { data, error } = await request;
  assert(!data, `${message}: mutation unexpectedly returned data`);
  assert(error?.code === "23514", `${message}: expected 23514, received ${error?.code}`);
  if (expectedMessage) {
    assert(error.message.includes(expectedMessage), `${message}: wrong domain message`);
  }
}

try {
  const { data: organization, error: organizationError } = await admin
    .from("organizations")
    .insert({
      legal_name: `Operational History ${Date.now()} Ltda`,
      trade_name: "Operational History",
      status: "active",
    })
    .select("id")
    .single();
  if (organizationError) throw organizationError;
  created.organizations.push(organization.id);
  const { actor, userId } = await createDirector(organization.id);

  const rpc = async (functionName, args) => {
    const { data, error } = await actor.rpc(functionName, args);
    if (error) throw error;
    return data;
  };
  const createClient = async (label, offset) => {
    const row = await rpc("mutate_client_with_audit", {
      operation: "create",
      organization_id: organization.id,
      legal_name: `${label} Ltda`,
      trade_name: label,
      document_number: documentNumber(14, offset),
    });
    created.clients.push(row.id);
    return row;
  };
  const activateContract = async (client, label, offset) => {
    const row = await rpc("mutate_contract_with_audit", {
      operation: "create",
      client_id: client.id,
      name: label,
      start_date: "2026-01-01",
      end_date: "2026-12-31",
      external_reference: `HISTORY-${offset}`,
    });
    created.contracts.push(row.id);
    await rpc("mutate_contract_with_audit", {
      operation: "status_change",
      entity_id: row.id,
      target_status: "active",
    });
    return row;
  };
  const createOperation = async (contract, label) => {
    const row = await rpc("mutate_operation_with_audit", {
      operation: "create",
      contract_id: contract.id,
      name: label,
      start_date: "2026-02-01",
      end_date: "2026-11-30",
      manager_user_id: userId,
    });
    created.operations.push(row.id);
    return row;
  };
  const createUnit = async (operation, label) => {
    const row = await rpc("mutate_unit_with_audit", {
      operation: "create",
      operation_id: operation.id,
      name: label,
      code: `${label}-${Date.now()}`.slice(0, 64),
      timezone: "America/Sao_Paulo",
    });
    created.units.push(row.id);
    return row;
  };
  const createPosition = async (unit, title) => {
    const jobRole = await rpc("mutate_job_role_with_audit", {
      operation: "create",
      organization_id: organization.id,
      name: `${title} ${created.jobRoles.length + 1}`,
    });
    created.jobRoles.push(jobRole.id);
    const row = await rpc("mutate_position_with_audit", {
      operation: "create",
      unit_id: unit.id,
      job_role_id: jobRole.id,
      base_required_headcount: 1,
    });
    created.positions.push(row.id);
    return row;
  };
  let workerOffset = 100;
  const createActiveWorker = async (
    label,
    startDate = "2026-01-01",
    endDate = "2026-11-30",
  ) => {
    const row = await rpc("mutate_worker_with_audit", {
      operation: "create",
      organization_id: organization.id,
      full_name: label,
      document_number: documentNumber(11, workerOffset++),
      engagement_start_date: startDate,
      engagement_end_date: endDate,
    });
    created.workers.push(row.id);
    await rpc("mutate_worker_with_audit", {
      operation: "status_change",
      entity_id: row.id,
      target_status: "active",
    });
    return row;
  };
  const createAssignment = async (worker, position, startDate, endDate) => {
    const row = await rpc("mutate_assignment_with_audit", {
      operation: "create",
      worker_id: worker.id,
      position_id: position.id,
      start_date: startDate,
      end_date: endDate,
    });
    created.assignments.push(row.id);
    return row;
  };

  const clientA = await createClient("History Client A", 1);
  const clientB = await createClient("History Client B", 2);
  const contractA = await activateContract(clientA, "History Contract A", 1);
  const contractB = await activateContract(clientB, "History Contract B", 2);
  const operationA = await createOperation(contractA, "History Operation A");
  const operationB = await createOperation(contractB, "History Operation B");
  const unitA = await createUnit(operationA, "History Unit A");
  const unitB = await createUnit(operationB, "History Unit B");

  const positionWithoutHistory = await createPosition(unitA, "Movable Position");
  await rpc("mutate_position_with_audit", {
    operation: "update",
    entity_id: positionWithoutHistory.id,
    unit_id: unitB.id,
    job_role_id: positionWithoutHistory.job_role_id,
    base_required_headcount: 2,
  });
  await rpc("mutate_job_role_with_audit", {
    operation: "update",
    entity_id: positionWithoutHistory.job_role_id,
    name: "Movable Cargo Renamed",
  });

  const historicalPosition = await createPosition(unitA, "Historical Position");
  const historicalWorker = await createActiveWorker("Historical Worker", "2026-02-01");
  const historicalAssignment = await createAssignment(
    historicalWorker,
    historicalPosition,
    "2026-03-01",
    "2026-03-31",
  );

  await expectRejected(
    actor.rpc("mutate_position_with_audit", {
      operation: "update",
      entity_id: historicalPosition.id,
      unit_id: unitB.id,
      job_role_id: historicalPosition.job_role_id,
      base_required_headcount: 1,
    }),
    "Position movement with Assignment history",
    "já possui histórico de Assignments",
  );
  await rpc("mutate_position_with_audit", {
    operation: "update",
    entity_id: historicalPosition.id,
    unit_id: unitA.id,
    job_role_id: historicalPosition.job_role_id,
    base_required_headcount: 3,
  });
  const replacementJobRole = await rpc("mutate_job_role_with_audit", {
    operation: "create",
    organization_id: organization.id,
    name: "Historical Replacement Cargo",
  });
  created.jobRoles.push(replacementJobRole.id);
  await expectRejected(
    actor.rpc("mutate_position_with_audit", {
      operation: "update",
      entity_id: historicalPosition.id,
      unit_id: unitA.id,
      job_role_id: replacementJobRole.id,
      base_required_headcount: 3,
    }),
    "Position JobRole rewrite with Assignment history",
    "alterar o Cargo",
  );
  await expectRejected(
    actor.rpc("mutate_job_role_with_audit", {
      operation: "update",
      entity_id: historicalPosition.job_role_id,
      name: "Historical Cargo Renamed",
    }),
    "JobRole rename with Assignment history",
    "renomear este Cargo",
  );
  await rpc("mutate_job_role_with_audit", {
    operation: "status_change",
    entity_id: historicalPosition.job_role_id,
    target_status: "inactive",
  });

  await expectRejected(
    actor.rpc("mutate_unit_with_audit", {
      operation: "update",
      entity_id: unitA.id,
      operation_id: operationB.id,
      name: unitA.name,
      code: unitA.code,
      timezone: unitA.timezone,
    }),
    "Unit movement with Assignment history",
    "já possui histórico de Assignments",
  );
  await expectRejected(
    actor.rpc("mutate_operation_with_audit", {
      operation: "update",
      entity_id: operationA.id,
      contract_id: contractB.id,
      name: operationA.name,
      start_date: operationA.start_date,
      end_date: operationA.end_date,
      manager_user_id: userId,
    }),
    "Operation movement with Assignment history",
    "já possui histórico de Assignments",
  );
  await expectRejected(
    actor.rpc("mutate_contract_with_audit", {
      operation: "update",
      entity_id: contractA.id,
      client_id: clientB.id,
      name: contractA.name,
      start_date: contractA.start_date,
      end_date: contractA.end_date,
    }),
    "Contract movement with Assignment history",
    "já possui histórico de Assignments",
  );

  const pendingPositionA = await createPosition(unitB, "Pending Position A");
  const pendingPositionB = await createPosition(unitB, "Pending Position B");
  const pendingWorkerA = await createActiveWorker("Pending Worker A");
  const pendingWorkerB = await createActiveWorker("Pending Worker B");
  const pendingAssignment = await createAssignment(
    pendingWorkerA,
    pendingPositionA,
    "2026-04-01",
    "2026-04-15",
  );
  await rpc("mutate_assignment_with_audit", {
    operation: "update",
    entity_id: pendingAssignment.id,
    worker_id: pendingWorkerB.id,
    position_id: pendingPositionB.id,
    start_date: "2026-04-02",
    end_date: "2026-04-16",
  });

  const activePosition = await createPosition(unitB, "Active Position");
  const activeWorker = await createActiveWorker("Active Worker");
  const replacementWorker = await createActiveWorker("Replacement Worker");
  const activeAssignment = await createAssignment(
    activeWorker,
    activePosition,
    "2026-05-01",
    "2026-05-31",
  );
  await rpc("mutate_assignment_with_audit", {
    operation: "status_change",
    entity_id: activeAssignment.id,
    target_status: "active",
  });
  await expectRejected(
    actor.rpc("mutate_assignment_with_audit", {
      operation: "update",
      entity_id: activeAssignment.id,
      worker_id: replacementWorker.id,
      position_id: activePosition.id,
      start_date: "2026-05-01",
      end_date: "2026-05-31",
    }),
    "Active Assignment context rewrite",
    "Assignment ativa ou suspensa",
  );
  await rpc("mutate_assignment_with_audit", {
    operation: "update",
    entity_id: activeAssignment.id,
    worker_id: activeWorker.id,
    position_id: activePosition.id,
    start_date: "2026-05-01",
    end_date: "2026-06-01",
  });

  const finishedPosition = await createPosition(unitB, "Finished Position");
  const finishedWorker = await createActiveWorker("Finished Worker");
  const finishedAssignment = await createAssignment(
    finishedWorker,
    finishedPosition,
    "2026-06-10",
    "2026-06-20",
  );
  await rpc("mutate_assignment_with_audit", {
    operation: "status_change",
    entity_id: finishedAssignment.id,
    target_status: "active",
  });
  await rpc("mutate_assignment_with_audit", {
    operation: "status_change",
    entity_id: finishedAssignment.id,
    target_status: "finished",
  });
  await expectRejected(
    actor.rpc("mutate_assignment_with_audit", {
      operation: "update",
      entity_id: finishedAssignment.id,
      worker_id: finishedWorker.id,
      position_id: finishedPosition.id,
      start_date: "2026-06-10",
      end_date: "2026-06-21",
    }),
    "Finished Assignment period rewrite",
    "Assignment finalizada ou cancelada",
  );

  const overlapPosition = await createPosition(unitB, "Overlap Position");
  const overlapWorker = await createActiveWorker("Overlap Worker");
  await createAssignment(overlapWorker, overlapPosition, "2026-07-01", "2026-07-31");
  await createAssignment(overlapWorker, overlapPosition, "2026-08-01", "2026-08-31");
  const { error: overlapError } = await actor.rpc("mutate_assignment_with_audit", {
    operation: "create",
    worker_id: overlapWorker.id,
    position_id: overlapPosition.id,
    start_date: "2026-07-31",
    end_date: "2026-08-15",
  });
  assert(overlapError?.code === "23P01", "Real overlapping Assignment was accepted");

  await expectRejected(
    actor.rpc("mutate_operation_with_audit", {
      operation: "create",
      contract_id: contractB.id,
      name: "Operation Before Contract",
      start_date: "2025-12-31",
      manager_user_id: userId,
    }),
    "Operation before Contract start",
    "anterior à data inicial do Contract",
  );
  await expectRejected(
    actor.rpc("mutate_operation_with_audit", {
      operation: "update",
      entity_id: operationA.id,
      contract_id: contractA.id,
      name: operationA.name,
      start_date: "2026-04-01",
      end_date: operationA.end_date,
      manager_user_id: userId,
    }),
    "Operation date rewrite excluding Assignment",
    "não podem excluir Assignments",
  );
  await expectRejected(
    actor.rpc("mutate_contract_with_audit", {
      operation: "update",
      entity_id: contractB.id,
      client_id: clientB.id,
      name: contractB.name,
      start_date: contractB.start_date,
      end_date: "2026-10-01",
    }),
    "Contract date rewrite excluding Operation",
    "não podem excluir Operations",
  );
  await expectRejected(
    actor.rpc("mutate_worker_with_audit", {
      operation: "update",
      entity_id: historicalWorker.id,
      organization_id: organization.id,
      full_name: historicalWorker.full_name,
      document_number: historicalWorker.document_number,
      engagement_start_date: "2026-04-01",
      engagement_end_date: "2026-11-30",
    }),
    "Worker date rewrite excluding Assignment",
    "não pode excluir Assignments",
  );

  const workerBoundPosition = await createPosition(unitB, "Worker Bound Position");
  const lateWorker = await createActiveWorker("Late Worker", "2026-09-01");
  await expectRejected(
    actor.rpc("mutate_assignment_with_audit", {
      operation: "create",
      worker_id: lateWorker.id,
      position_id: workerBoundPosition.id,
      start_date: "2026-08-31",
      end_date: "2026-09-02",
    }),
    "Assignment before Worker engagement",
    "início do vínculo do Worker",
  );
  const earlyWorker = await createActiveWorker(
    "Early Worker",
    "2026-01-01",
    "2026-12-31",
  );
  await expectRejected(
    actor.rpc("mutate_assignment_with_audit", {
      operation: "create",
      worker_id: earlyWorker.id,
      position_id: workerBoundPosition.id,
      start_date: "2026-01-31",
      end_date: "2026-02-02",
    }),
    "Assignment before Operation start",
    "início da Operation",
  );
  await expectRejected(
    actor.rpc("mutate_assignment_with_audit", {
      operation: "create",
      worker_id: earlyWorker.id,
      position_id: workerBoundPosition.id,
      start_date: "2026-11-15",
      end_date: "2026-12-01",
    }),
    "Assignment after Operation end",
    "fim da Operation",
  );

  const { count: contractAuditCount, error: contractAuditError } = await admin
    .from("audit_events")
    .select("id", { count: "exact", head: true })
    .eq("entity_type", "contract")
    .eq("entity_id", contractA.id)
    .eq("action", "create");
  if (contractAuditError) throw contractAuditError;
  assert(contractAuditCount === 1, "Normal Contract creation lost its audit event");
  const { count: assignmentAuditCount, error: assignmentAuditError } = await admin
    .from("audit_events")
    .select("id", { count: "exact", head: true })
    .eq("entity_type", "assignment")
    .eq("entity_id", historicalAssignment.id)
    .eq("action", "create");
  if (assignmentAuditError) throw assignmentAuditError;
  assert(assignmentAuditCount === 1, "Normal Assignment creation lost its audit event");

  console.log(
    JSON.stringify({
      structuralHistoryProtected: true,
      pendingCorrectionsAllowed: true,
      activeContextFrozen: true,
      finishedPeriodFrozen: true,
      consecutiveDatesAllowed: true,
      actualOverlapRejected: true,
      temporalBoundsEnforced: true,
      normalCreationAudited: true,
    }),
  );
} finally {
  const entityIds = [
    ...created.clients,
    ...created.contracts,
    ...created.operations,
    ...created.units,
    ...created.positions,
    ...created.jobRoles,
    ...created.workers,
    ...created.assignments,
  ];
  if (entityIds.length) await admin.from("audit_events").delete().in("entity_id", entityIds);
  if (created.assignments.length) await admin.from("assignments").delete().in("id", created.assignments);
  if (created.workers.length) await admin.from("workers").delete().in("id", created.workers);
  if (created.positions.length) await admin.from("positions").delete().in("id", created.positions);
  if (created.jobRoles.length) await admin.from("job_roles").delete().in("id", created.jobRoles);
  if (created.units.length) await admin.from("units").delete().in("id", created.units);
  if (created.operations.length) await admin.from("operations").delete().in("id", created.operations);
  if (created.contracts.length) await admin.from("contracts").delete().in("id", created.contracts);
  if (created.clients.length) await admin.from("clients").delete().in("id", created.clients);
  for (const userId of created.users) {
    await admin.from("organization_members").delete().eq("profile_id", userId);
    await admin.from("profiles").delete().eq("id", userId);
    await admin.auth.admin.deleteUser(userId);
  }
  if (created.organizations.length)
    await admin.from("organizations").delete().in("id", created.organizations);
}
