import { randomUUID } from "node:crypto";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import path from "node:path";

import { createClient } from "@supabase/supabase-js";

const repositoryRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const projectRef = "jwylmqxogmdxceqtqyri";
const projectUrl = "https://" + projectRef + ".supabase.co";
const organizationId = "00000000-0000-4000-8000-000000000001";
const allowedTables = ["profiles", "organization_members"];
const concurrency = 8;

function parseArgs(argv) {
  const options = { workers: 300, assignments: 150, tag: "pulsa-benchmark-20260925" };
  for (const argument of argv) {
    const match = /^--(workers|assignments|tag)=(.+)$/.exec(argument);
    if (!match) throw new Error("Use --workers=N, --assignments=N e/ou --tag=identificador.");
    const [, name, value] = match;
    if (name === "tag") {
      if (!/^[a-z0-9-]{3,40}$/.test(value)) throw new Error("O identificador deve usar 3 a 40 letras minúsculas, números ou hífens.");
      options.tag = value;
    } else {
      const number = Number(value);
      if (!Number.isInteger(number) || number < 1 || number > 1000) {
        throw new Error("A quantidade deve ser um inteiro entre 1 e 1000.");
      }
      options[name] = number;
    }
  }
  if (options.assignments > options.workers) {
    throw new Error("A quantidade de alocações não pode superar a de colaboradores.");
  }
  return options;
}

function runSql(sql) {
  const windows = process.platform === "win32";
  const cliEnvironment = { ...process.env };
  delete cliEnvironment.SUPABASE_TEST_SERVICE_ROLE_KEY;
  delete cliEnvironment.SUPABASE_TEST_PUBLISHABLE_KEY;
  const command = windows ? "powershell.exe" : "npx";
  const args = windows
    ? [
        "-NoProfile",
        "-EncodedCommand",
        Buffer.from(
          "$ErrorActionPreference = 'Stop'\n" +
            "$SqlText = @'\n" + sql + "\n'@\n" +
            "& npx supabase db query --linked --project-ref " + projectRef + " $SqlText\n" +
            "if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }\n",
          "utf16le",
        ).toString("base64"),
      ]
    : ["supabase", "db", "query", "--linked", "--project-ref", projectRef, sql];
  const result = spawnSync(command, args, {
    cwd: repositoryRoot,
    encoding: "utf8",
    env: cliEnvironment,
  });
  if (result.error) throw result.error;
  if (result.status !== 0) throw new Error(result.stderr || result.stdout || "Consulta Supabase falhou.");
  return (result.stdout ?? "") + (result.stderr ?? "");
}

function parseQueryResult(output) {
  const start = output.indexOf("{");
  if (start < 0) throw new Error("O Supabase CLI não retornou o resultado JSON esperado.");
  let depth = 0;
  let inString = false;
  let escaped = false;
  for (let index = start; index < output.length; index += 1) {
    const character = output[index];
    if (inString) {
      if (escaped) escaped = false;
      else if (character === "\\") escaped = true;
      else if (character === '"') inString = false;
    } else if (character === '"') inString = true;
    else if (character === "{") depth += 1;
    else if (character === "}" && --depth === 0) return JSON.parse(output.slice(start, index + 1));
  }
  throw new Error("O Supabase CLI retornou JSON incompleto.");
}

async function withConcurrency(items, limit, task) {
  let next = 0;
  const workers = Array.from({ length: Math.min(limit, items.length) }, async () => {
    while (next < items.length) {
      const index = next++;
      await task(items[index], index);
    }
  });
  await Promise.all(workers);
}

function cpfFor(sequence) {
  const base = String(800000000 + sequence).split("").map(Number);
  const digit = (values, factor) => {
    const remainder = values.reduce((sum, value) => sum + value * factor--, 0) % 11;
    return remainder < 2 ? 0 : 11 - remainder;
  };
  const first = digit(base, 10);
  return [...base, first, digit([...base, first], 11)].join("");
}

const options = parseArgs(process.argv.slice(2));
if (process.env.SUPABASE_TEST_CONFIRMATION !== "integration-test") {
  throw new Error("Defina SUPABASE_TEST_CONFIRMATION=integration-test para autorizar a operação no ambiente de desenvolvimento.");
}
if (process.env.SUPABASE_TEST_URL !== projectUrl) {
  throw new Error("Operação recusada: SUPABASE_TEST_URL deve apontar para o projeto pulsa-desenvolvimento.");
}
if (!process.env.SUPABASE_TEST_PUBLISHABLE_KEY || !process.env.SUPABASE_TEST_SERVICE_ROLE_KEY) {
  throw new Error("As chaves SUPABASE_TEST_* precisam estar configuradas localmente em .env.test.local.");
}

const authOptions = { auth: { autoRefreshToken: false, persistSession: false } };
const admin = createClient(projectUrl, process.env.SUPABASE_TEST_SERVICE_ROLE_KEY, authOptions);
const tag = options.tag;
const fixtureEmail = tag + "-director@example.invalid";
const memberName = "Fixture de desempenho DEV (" + tag + ")";
let actor;
let userId;
let memberCreated = false;
let createdUserThisRun = false;
let domainMutations = 0;
let temporaryGrantsApplied = false;
let operationFailure;
let currentPhase = "initialização";

const tableList = allowedTables.map((table) => "public." + table).join(", ");
const grantsCountSql =
  "select count(*)::integer as tables_with_privileges from pg_class relation " +
  "join pg_namespace namespace on namespace.oid = relation.relnamespace " +
  "where namespace.nspname = 'public' and relation.relname = any(array[" +
  allowedTables.map((table) => "'" + table + "'").join(", ") +
  "]) and (has_table_privilege('service_role', relation.oid, 'select') " +
  "or has_table_privilege('service_role', relation.oid, 'insert') " +
  "or has_table_privilege('service_role', relation.oid, 'update') " +
  "or has_table_privilege('service_role', relation.oid, 'delete'));";

try {
  currentPhase = "preparação do ator sintético";
  const before = parseQueryResult(runSql(grantsCountSql));
  if (before.rows?.[0]?.tables_with_privileges !== 0) {
    throw new Error("Há permissões service_role pré-existentes em profiles/organization_members. Nenhuma alteração foi feita.");
  }
  temporaryGrantsApplied = true;
  runSql("grant select, insert, update, delete on " + tableList + " to service_role;");

  currentPhase = "autenticação do ator sintético";
  const { data: existingUsers, error: listError } = await admin.auth.admin.listUsers({ page: 1, perPage: 1000 });
  if (listError) throw listError;
  let fixtureUser = existingUsers.users.find((user) => user.email?.toLowerCase() === fixtureEmail);
  let password;
  if (!fixtureUser) {
    password = randomUUID() + "Aa1!";
    const { data: createdUser, error: createUserError } = await admin.auth.admin.createUser({
      email: fixtureEmail,
      password,
      email_confirm: true,
    });
    if (createUserError) throw createUserError;
    fixtureUser = createdUser.user;
    createdUserThisRun = true;
  }
  userId = fixtureUser.id;
  actor = createClient(projectUrl, process.env.SUPABASE_TEST_PUBLISHABLE_KEY, authOptions);
  if (password) {
    const { error: signInError } = await actor.auth.signInWithPassword({ email: fixtureEmail, password });
    if (signInError) throw signInError;
  } else {
    const { data: link, error: linkError } = await admin.auth.admin.generateLink({ type: "magiclink", email: fixtureEmail });
    if (linkError) throw linkError;
    const { error: verifyError } = await actor.auth.verifyOtp({
      type: "magiclink",
      token_hash: link.properties.hashed_token,
    });
    if (verifyError) throw verifyError;
  }

  const { data: existingProfile, error: profileReadError } = await admin
    .from("profiles")
    .select("id")
    .eq("id", userId)
    .maybeSingle();
  if (profileReadError) throw profileReadError;
  if (!existingProfile) {
    const { error: profileError } = await admin.from("profiles").insert({ id: userId, display_name: memberName });
    if (profileError) throw profileError;
  }
  const { data: existingMembership, error: membershipReadError } = await admin
    .from("organization_members")
    .select("role, status")
    .eq("organization_id", organizationId)
    .eq("profile_id", userId)
    .maybeSingle();
  if (membershipReadError) throw membershipReadError;
  if (!existingMembership) {
    const { error: membershipError } = await admin.from("organization_members").insert({
      organization_id: organizationId,
      profile_id: userId,
      role: "DIRECTOR",
      status: "active",
    });
    if (membershipError) throw membershipError;
  } else if (existingMembership.role !== "DIRECTOR" || existingMembership.status !== "active") {
    throw new Error("O ator deste lote existe, mas sua associação não está ativa como DIRECTOR.");
  }
  memberCreated = true;

  runSql("revoke all privileges on " + tableList + " from service_role;");
  temporaryGrantsApplied = false;
  const afterSetup = parseQueryResult(runSql(grantsCountSql));
  if (afterSetup.rows?.[0]?.tables_with_privileges !== 0) {
    throw new Error("Não foi possível confirmar a revogação das permissões temporárias.");
  }

  currentPhase = "consulta de postos de teste";
  const { data: positions, error: positionsError } = await actor
    .from("positions")
    .select("id")
    .eq("status", "active")
    .limit(100);
  if (positionsError) throw positionsError;
  if (!positions?.length) throw new Error("A organização Pulsa Dev não possui postos ativos para as alocações.");

  const emailPattern = tag + "-worker-%@example.invalid";
  const { data: existingWorkers, error: existingWorkersError } = await actor
    .from("workers")
    .select("id, email, status")
    .eq("organization_id", organizationId)
    .like("email", emailPattern)
    .limit(2000);
  if (existingWorkersError) throw existingWorkersError;
  const workerByEmail = new Map((existingWorkers ?? []).map((worker) => [worker.email, worker]));
  const workersToPrepare = Array.from({ length: options.workers }, (_, index) => index + 1);
  let workersCreated = 0;
  let workersActivated = 0;

  currentPhase = "preparação dos colaboradores sintéticos";
  await withConcurrency(workersToPrepare, concurrency, async (sequence) => {
    const workerEmail = tag + "-worker-" + String(sequence).padStart(4, "0") + "@example.invalid";
    let worker = workerByEmail.get(workerEmail);
    if (!worker) {
      const { data, error } = await actor.rpc("mutate_worker_with_audit", {
        operation: "create",
        organization_id: organizationId,
        full_name: "Benchmark Pulsa " + tag + " Pessoa " + String(sequence).padStart(4, "0"),
        document_number: cpfFor(sequence),
        email: workerEmail,
        phone: null,
        engagement_start_date: "2026-09-01",
      });
      if (error) throw new Error("Falha ao criar colaborador " + sequence + ": " + error.message);
      worker = data;
      workerByEmail.set(workerEmail, worker);
      workersCreated += 1;
      domainMutations += 1;
    }
    if (worker.status === "onboarding") {
      const { error } = await actor.rpc("mutate_worker_with_audit", {
        operation: "status_change",
        entity_id: worker.id,
        target_status: "active",
      });
      if (error) throw new Error("Falha ao ativar colaborador " + sequence + ": " + error.message);
      worker.status = "active";
      workersActivated += 1;
      domainMutations += 1;
    } else if (worker.status !== "active") {
      throw new Error("O registro " + workerEmail + " existe com status " + worker.status + "; verifique antes de continuar.");
    }
  });

  const targetWorkerIds = workersToPrepare
    .slice(0, options.assignments)
    .map((sequence) => workerByEmail.get(tag + "-worker-" + String(sequence).padStart(4, "0") + "@example.invalid").id);
  currentPhase = "preparação das alocações sintéticas";
  const { data: existingAssignments, error: assignmentsReadError } = await actor
    .from("assignments")
    .select("id, worker_id, status, worker:workers!inner(email)")
    .like("worker.email", emailPattern)
    .limit(2000);
  if (assignmentsReadError) throw assignmentsReadError;
  const assignmentByWorker = new Map((existingAssignments ?? []).map((assignment) => [assignment.worker_id, assignment]));
  let assignmentsCreated = 0;
  let assignmentsActivated = 0;

  await withConcurrency(targetWorkerIds, concurrency, async (workerId, index) => {
    let assignment = assignmentByWorker.get(workerId);
    if (!assignment) {
      const { data, error } = await actor.rpc("mutate_assignment_with_audit", {
        operation: "create",
        worker_id: workerId,
        position_id: positions[index % positions.length].id,
        start_date: "2026-09-25",
      });
      if (error) throw new Error("Falha ao criar alocação " + (index + 1) + ": " + error.message);
      assignment = data;
      assignmentByWorker.set(workerId, assignment);
      assignmentsCreated += 1;
      domainMutations += 1;
    }
    if (assignment.status === "pending") {
      const { error } = await actor.rpc("mutate_assignment_with_audit", {
        operation: "status_change",
        entity_id: assignment.id,
        target_status: "active",
      });
      if (error) throw new Error("Falha ao ativar alocação " + (index + 1) + ": " + error.message);
      assignmentsActivated += 1;
      domainMutations += 1;
    } else if (assignment.status !== "active") {
      throw new Error("Há alocação existente com status " + assignment.status + " para um colaborador do lote.");
    }
  });

  currentPhase = "verificação das contagens do benchmark";
  const { count: workerCount, error: countWorkersError } = await actor
    .from("workers")
    .select("id", { count: "exact", head: true })
    .eq("organization_id", organizationId);
  if (countWorkersError) throw countWorkersError;
  const { count: assignmentCount, error: countAssignmentsError } = await actor
    .from("assignments")
    .select("id, worker:workers!inner(email)", { count: "exact", head: true })
    .like("worker.email", emailPattern);
  if (countAssignmentsError) throw countAssignmentsError;
  console.log("\nBenchmark de desenvolvimento preparado.");
  console.log("Projeto: pulsa-desenvolvimento (" + projectRef + ")");
  console.log("Identificador: " + tag);
  console.log("Colaboradores criados/ativados: " + workersCreated + "/" + workersActivated + "; total na organização: " + workerCount + ".");
  console.log("Alocações criadas/ativadas: " + assignmentsCreated + "/" + assignmentsActivated + "; registros no lote: " + assignmentCount + ".");
  console.log("E-mail do ator de auditoria: " + fixtureEmail + ".");
} catch (error) {
  operationFailure = error;
} finally {
  if (temporaryGrantsApplied) {
    try {
      runSql("revoke all privileges on " + tableList + " from service_role;");
      const afterRevoke = parseQueryResult(runSql(grantsCountSql));
      if (afterRevoke.rows?.[0]?.tables_with_privileges !== 0) {
        throw new Error("As permissões temporárias em perfis/membros ainda aparecem ativas.");
      }
    } catch (error) {
      operationFailure = new Error("Falha ao confirmar a remoção das permissões temporárias.", { cause: error });
    }
  }

  if (userId && createdUserThisRun && !memberCreated && domainMutations === 0) {
    const { error } = await admin.auth.admin.deleteUser(userId);
    if (error) operationFailure = new Error("Não foi possível remover o usuário técnico antes de criar dados.", { cause: error });
  } else if (memberCreated && actor) {
    const { count: activeDirectors, error: directorsError } = await actor
      .from("organization_members")
      .select("profile_id", { count: "exact", head: true })
      .eq("organization_id", organizationId)
      .eq("role", "DIRECTOR")
      .eq("status", "active");
    if (directorsError) {
      operationFailure = new Error("Não foi possível verificar a regra de último diretor.", { cause: directorsError });
    } else if ((activeDirectors ?? 0) > 1) {
      const { error } = await actor.rpc("change_organization_membership_with_audit", {
        organization_id: organizationId,
        target_profile_id: userId,
        target_role: "DIRECTOR",
        target_status: "inactive",
      });
      if (error) operationFailure = new Error("Não consegui inativar o ator técnico com a RPC auditada.", { cause: error });
      else console.log("Acesso do ator técnico inativado por RPC auditada; outro diretor ativo foi preservado.");
    } else {
      console.log("O ator de auditoria permanece como único DIRECTOR ativo; a regra de último diretor impede inativá-lo.");
    }
  }
}

if (operationFailure) {
  const message = operationFailure instanceof Error
    ? operationFailure.message
    : operationFailure && typeof operationFailure === "object" && "message" in operationFailure
      ? String(operationFailure.message)
      : String(operationFailure ?? "Falha ao preparar o benchmark.");
  const cause = operationFailure instanceof Error && operationFailure.cause instanceof Error
    ? " " + operationFailure.cause.message
    : "";
  console.error("Etapa: " + currentPhase + ". " + message + cause);
  process.exitCode = 1;
}
