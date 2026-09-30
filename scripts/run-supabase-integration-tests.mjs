import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import path from "node:path";

const repositoryRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const developmentProjectRef = "jwylmqxogmdxceqtqyri";
const developmentProjectUrl = "https://" + developmentProjectRef + ".supabase.co";

const suites = new Map([
  ["audit", "audit-real-validation.mjs"],
  ["assignment", "assignment-real-validation.mjs"],
  ["scheduling", "scheduling-real-validation.mjs"],
  ["absence", "absence-real-validation.mjs"],
  ["presence", "presence-real-validation.mjs"],
  ["history", "operational-history-real-validation.mjs"],
  ["rbac", "rbac-hardening-real-validation.mjs"],
  ["administration", "administration-real-validation.mjs"],
  ["worker-access", "worker-access-real-validation.mjs"],
  ["worker-schedule", "worker-schedule-real-validation.mjs"],
  ["worker-presence", "worker-presence-real-validation.mjs"],
]);

const fixtureTables = [
  "absences",
  "assignments",
  "audit_events",
  "clients",
  "contracts",
  "job_roles",
  "operations",
  "organization_members",
  "organizations",
  "positions",
  "presences",
  "profiles",
  "replacements",
  "schedule_entries",
  "schedule_revisions",
  "schedules",
  "units",
  "worker_access_invitations",
  "worker_access_links",
  "workers",
];

const tableList = fixtureTables.map((table) => "public." + table).join(", ");
const selectedSuite = process.argv[2] ?? "all";
const requestedSuites =
  selectedSuite === "all"
    ? [...suites.entries()]
    : suites.has(selectedSuite)
      ? [[selectedSuite, suites.get(selectedSuite)]]
      : null;

if (!requestedSuites) {
  console.error(
    'Unknown suite "' + selectedSuite + '". Choose: all, ' + [...suites.keys()].join(", ") + ".",
  );
  process.exit(2);
}

if (process.env.SUPABASE_TEST_CONFIRMATION !== "integration-test") {
  console.error("Set SUPABASE_TEST_CONFIRMATION=integration-test before running real database tests.");
  process.exit(2);
}

if (process.env.SUPABASE_TEST_URL !== developmentProjectUrl) {
  console.error("Refusing to run: SUPABASE_TEST_URL must target " + developmentProjectUrl + ".");
  process.exit(2);
}

for (const variable of ["SUPABASE_TEST_PUBLISHABLE_KEY", "SUPABASE_TEST_SERVICE_ROLE_KEY"]) {
  if (!process.env[variable]) {
    console.error("Refusing to run: " + variable + " is missing from .env.test.local.");
    process.exit(2);
  }
}

const cliEnvironment = { ...process.env };
delete cliEnvironment.SUPABASE_TEST_SERVICE_ROLE_KEY;
delete cliEnvironment.SUPABASE_TEST_PUBLISHABLE_KEY;

function runSupabaseSql(sql) {
  const windows = process.platform === "win32";
  const command = windows ? "powershell.exe" : "npx";
  const args = windows
    ? [
        "-NoProfile",
        "-EncodedCommand",
        Buffer.from(
          "$ErrorActionPreference = 'Stop'\n" +
            "$SqlText = @'\n" +
            sql +
            "\n'@\n" +
            "& npx supabase db query --linked --project-ref " +
            developmentProjectRef +
            " $SqlText\n" +
            "if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }\n",
          "utf16le",
        ).toString("base64"),
      ]
    : ["supabase", "db", "query", "--linked", "--project-ref", developmentProjectRef, sql];
  const result = spawnSync(command, args, {
    cwd: repositoryRoot,
    encoding: "utf8",
    env: cliEnvironment,
  });

  if (result.error) throw result.error;
  if (result.status !== 0) {
    throw new Error(result.stderr || result.stdout || "Supabase CLI query failed.");
  }

  return (result.stdout ?? "") + (result.stderr ?? "");
}

function parseQueryResult(output) {
  const jsonStart = output.indexOf("{");
  if (jsonStart < 0) throw new Error("Supabase CLI returned no JSON query result.");

  let depth = 0;
  let inString = false;
  let escaped = false;
  for (let index = jsonStart; index < output.length; index += 1) {
    const character = output[index];
    if (inString) {
      if (escaped) escaped = false;
      else if (character === "\\") escaped = true;
      else if (character === '"') inString = false;
      continue;
    }
    if (character === '"') inString = true;
    else if (character === "{") depth += 1;
    else if (character === "}") {
      depth -= 1;
      if (depth === 0) return JSON.parse(output.slice(jsonStart, index + 1));
    }
  }

  throw new Error("Supabase CLI returned incomplete JSON query output.");
}

function runSuite(name, filename) {
  console.log("\n[" + name + "] Starting real integration validation...");
  const integrationEnvironment = {
    ...process.env,
    SUPABASE_TEST_SKIP_EMAIL_DELIVERY:
      process.env.SUPABASE_TEST_SKIP_EMAIL_DELIVERY ?? "1",
  };
  const result = spawnSync(
    process.execPath,
    ["--env-file=.env.test.local", path.join("tests", "integration", filename)],
    { cwd: repositoryRoot, env: integrationEnvironment, stdio: "inherit" },
  );

  if (result.error) throw result.error;
  return result.status ?? 1;
}

const preexistingPrivilegesSql =
  "select count(*)::integer as tables_with_privileges " +
  "from pg_class relation join pg_namespace namespace on namespace.oid = relation.relnamespace " +
  "where namespace.nspname = 'public' and relation.relname = any(array[" +
  fixtureTables.map((table) => "'" + table + "'").join(", ") +
  "]) and (has_table_privilege('service_role', relation.oid, 'select') " +
  "or has_table_privilege('service_role', relation.oid, 'insert') " +
  "or has_table_privilege('service_role', relation.oid, 'update') " +
  "or has_table_privilege('service_role', relation.oid, 'delete'));";

let grantsApplied = false;
let runFailure;
const suiteFailures = [];

try {
  const baseline = parseQueryResult(runSupabaseSql(preexistingPrivilegesSql));
  const privilegedTableCount = baseline.rows?.[0]?.tables_with_privileges;
  if (privilegedTableCount !== 0) {
    throw new Error(
      "Expected no pre-existing service_role grants on fixture tables; found " +
        (privilegedTableCount ?? "an unknown number") +
        ". No changes were made.",
    );
  }

  grantsApplied = true;
  runSupabaseSql("grant select, insert, update, delete on " + tableList + " to service_role;");
  runSupabaseSql("notify pgrst, 'reload schema';");

  for (const [name, filename] of requestedSuites) {
    const exitCode = runSuite(name, filename);
    if (exitCode !== 0) suiteFailures.push(name + " exited with code " + exitCode);
  }
} catch (error) {
  runFailure = error;
} finally {
  if (grantsApplied) {
    try {
      runSupabaseSql("revoke all privileges on " + tableList + " from service_role;");
      runSupabaseSql("notify pgrst, 'reload schema';");

      const afterRevoke = parseQueryResult(runSupabaseSql(preexistingPrivilegesSql));
      const remaining = afterRevoke.rows?.[0]?.tables_with_privileges;
      if (remaining !== 0) {
        throw new Error("Temporary privileges remain on " + (remaining ?? "unknown") + " fixture tables.");
      }
      console.log("\nTemporary service_role grants revoked and verified.");
    } catch (error) {
      runFailure = new Error("Could not verify removal of temporary database grants.", {
        cause: error,
      });
    }
  }
}

if (runFailure) {
  console.error(runFailure);
  process.exitCode = 1;
} else if (suiteFailures.length > 0) {
  console.error("\nIntegration failures:");
  for (const failure of suiteFailures) console.error("- " + failure);
  process.exitCode = 1;
} else {
  console.log("\nAll requested real integration suites passed (" + requestedSuites.length + ").");
}
