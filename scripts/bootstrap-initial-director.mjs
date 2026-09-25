import { randomUUID } from "node:crypto";
import { createClient } from "@supabase/supabase-js";

function parseArguments(argv) {
  const values = new Map();
  for (const item of argv) {
    if (!item.startsWith("--") || !item.includes("=")) {
      throw new Error(`Argumento inválido: ${item}`);
    }
    const separator = item.indexOf("=");
    values.set(item.slice(2, separator), item.slice(separator + 1));
  }

  const required = ["legal-name", "trade-name", "director-name", "director-email"];
  for (const key of required) {
    if (!values.get(key)?.trim()) throw new Error(`Informe --${key}=...`);
  }

  const email = values.get("director-email").trim().toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    throw new Error("O e-mail inicial do diretor é inválido.");
  }

  return {
    legalName: values.get("legal-name").trim(),
    tradeName: values.get("trade-name").trim(),
    directorName: values.get("director-name").trim(),
    directorEmail: email,
  };
}

async function main() {
  const input = parseArguments(process.argv.slice(2));
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error(
      "Defina NEXT_PUBLIC_SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY no ambiente local; não passe a chave pela linha de comando.",
    );
  }

  const supabase = createClient(supabaseUrl, serviceRoleKey, {
    auth: { autoRefreshToken: false, detectSessionInUrl: false, persistSession: false },
  });

  const { data: listedUsers, error: listError } = await supabase.auth.admin.listUsers({
    page: 1,
    perPage: 1000,
  });
  if (listError) throw listError;

  let user = listedUsers.users.find(
    (candidate) => candidate.email?.trim().toLowerCase() === input.directorEmail,
  );
  let organizationId = user?.app_metadata?.pulsa_invite_organization_id;
  if (user && user.app_metadata?.pulsa_surface !== "core") {
    throw new Error("Este e-mail já pertence a uma identidade que não é do Pulsa Core.");
  }
  if (user && typeof organizationId !== "string") {
    throw new Error("A conta existente não possui metadados de bootstrap Pulsa; nada foi alterado.");
  }

  if (!user) {
    organizationId = randomUUID();
    const { data, error } = await supabase.auth.admin.createUser({
      email: input.directorEmail,
      email_confirm: false,
      app_metadata: {
        pulsa_surface: "core",
        pulsa_invite_organization_id: organizationId,
      },
    });
    if (error) throw error;
    user = data.user;
  }

  const { error: bootstrapError } = await supabase.rpc(
    "bootstrap_initial_organization_director",
    {
      target_organization_id: organizationId,
      target_legal_name: input.legalName,
      target_trade_name: input.tradeName,
      target_profile_id: user.id,
      target_display_name: input.directorName,
    },
  );
  if (bootstrapError) throw bootstrapError;

  console.log(
    `Organização inicial criada; diretor ${input.directorEmail} está provisionado. Envie o OTP após configurar o SMTP e a URL pública do Core.`,
  );
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : "Falha ao inicializar a organização.");
  process.exitCode = 1;
});
