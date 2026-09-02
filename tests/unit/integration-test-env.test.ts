import { spawnSync } from "node:child_process";

import { describe, expect, it } from "vitest";

const helper = "tests/integration/helpers/integration-test-env.mjs";
const assignmentScript = "tests/integration/assignment-real-validation.mjs";
const baseEnvironment: NodeJS.ProcessEnv = {
  ...process.env,
  SUPABASE_TEST_URL: "http://127.0.0.1:54321",
  SUPABASE_TEST_PUBLISHABLE_KEY: "test-publishable-key",
  SUPABASE_TEST_SERVICE_ROLE_KEY: "test-service-role-key",
  SUPABASE_TEST_CONFIRMATION: "integration-test",
};

function runNode(args: string[], environment: NodeJS.ProcessEnv) {
  return spawnSync(process.execPath, args, {
    cwd: process.cwd(),
    encoding: "utf8",
    env: environment,
  });
}

describe("integration test environment guard", () => {
  it.each([
    "SUPABASE_TEST_URL",
    "SUPABASE_TEST_PUBLISHABLE_KEY",
    "SUPABASE_TEST_SERVICE_ROLE_KEY",
  ] as const)("fails closed when %s is absent", (missingVariable) => {
    const environment = { ...baseEnvironment };
    delete environment[missingVariable];

    const result = runNode([assignmentScript], environment);

    expect(result.status).not.toBe(0);
    expect(result.stderr).toContain(
      "SUPABASE_TEST_* environment variables are required for integration tests.",
    );
  });

  it("requires the explicit confirmation flag", () => {
    const environment = { ...baseEnvironment };
    delete environment.SUPABASE_TEST_CONFIRMATION;

    const result = runNode([assignmentScript], environment);

    expect(result.status).not.toBe(0);
    expect(result.stderr).toContain(
      "SUPABASE_TEST_CONFIRMATION=integration-test is required for integration tests.",
    );
  });

  it("accepts a complete explicit configuration without accessing Supabase", () => {
    const result = runNode(
      [
        "--input-type=module",
        "--eval",
        `import { requireIntegrationTestEnv } from "./${helper}"; requireIntegrationTestEnv();`,
      ],
      baseEnvironment,
    );

    expect(result.status).toBe(0);
    expect(result.stderr).toBe("");
  });

  it("contains no linked-project or CLI key-discovery fallback", () => {
    const result = runNode(
      [
        "--input-type=module",
        "--eval",
        `import { readdirSync, readFileSync } from "node:fs"; const files = readdirSync("tests/integration").filter((file) => file.endsWith(".mjs")); const forbidden = ["project-ref", "projects api-keys", "execFileSync", "readFileSync", "NEXT_PUBLIC_SUPABASE"]; for (const file of files) { const content = readFileSync(\`tests/integration/\${file}\`, "utf8"); if (forbidden.some((value) => content.includes(value))) process.exit(1); }`,
      ],
      baseEnvironment,
    );

    expect(result.status).toBe(0);
  });
});
