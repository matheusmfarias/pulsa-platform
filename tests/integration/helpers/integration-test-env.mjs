const REQUIRED_VARIABLES = [
  "SUPABASE_TEST_URL",
  "SUPABASE_TEST_PUBLISHABLE_KEY",
  "SUPABASE_TEST_SERVICE_ROLE_KEY",
];

export function requireIntegrationTestEnv(environment = process.env) {
  if (REQUIRED_VARIABLES.some((name) => !environment[name])) {
    throw new Error(
      "SUPABASE_TEST_* environment variables are required for integration tests.",
    );
  }

  if (environment.SUPABASE_TEST_CONFIRMATION !== "integration-test") {
    throw new Error(
      "SUPABASE_TEST_CONFIRMATION=integration-test is required for integration tests.",
    );
  }

  return {
    supabaseUrl: environment.SUPABASE_TEST_URL,
    publishableKey: environment.SUPABASE_TEST_PUBLISHABLE_KEY,
    serviceRoleKey: environment.SUPABASE_TEST_SERVICE_ROLE_KEY,
  };
}
