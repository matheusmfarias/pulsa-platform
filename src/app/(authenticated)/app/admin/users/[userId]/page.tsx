import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";

import { Button } from "@/components/ui/button";
import {
  MembershipRoleForm,
  MembershipStatusAction,
  MembershipStatusBadge,
  ORGANIZATION_ROLE_LABELS,
  getOrganizationMemberById,
  profileIdSchema,
} from "@/modules/administration";
import { isAppError, toPublicErrorMessage } from "@/shared/errors";

function formatDateTime(value: string): string {
  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "America/Sao_Paulo",
  }).format(new Date(value));
}

export default async function AdministrationUserDetailPage({
  params,
}: PageProps<"/app/admin/users/[userId]">) {
  const route = profileIdSchema.safeParse((await params).userId);
  if (!route.success) notFound();

  let member;
  try {
    member = await getOrganizationMemberById(route.data);
  } catch (error) {
    if (isAppError(error) && error.code === "NOT_FOUND") notFound();
    return (
      <main className="mx-auto max-w-4xl px-4 py-10 sm:px-6 lg:px-8">
        <h1 className="text-2xl font-semibold">Usuário</h1>
        <p className="mt-6 rounded-lg border bg-card p-6 text-sm text-destructive" role="alert">
          {toPublicErrorMessage(error)}
        </p>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-4xl px-4 py-10 sm:px-6 lg:px-8">
      <Button asChild variant="outline" size="sm">
        <Link href="/app/admin/users">
          <ArrowLeft className="size-4" aria-hidden="true" />
          Voltar para usuários
        </Link>
      </Button>

      <div className="mt-6 flex flex-wrap items-center gap-3">
        <h1 className="text-2xl font-semibold tracking-tight">
          {member.profile?.display_name ?? "Sem nome de exibição"}
        </h1>
        <MembershipStatusBadge status={member.status} />
      </div>
      <p className="mt-2 text-sm text-muted-foreground">
        Membership administrativa da organização atual.
      </p>

      <section className="mt-8 rounded-lg border bg-card">
        <div className="border-b px-6 py-4"><h2 className="font-semibold">Identidade e membership</h2></div>
        <dl className="grid gap-x-8 gap-y-6 p-6 sm:grid-cols-2">
          <div>
            <dt className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Profile ID</dt>
            <dd className="mt-2 break-all font-mono text-sm">{member.profile_id}</dd>
          </div>
          <div>
            <dt className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Nome de exibição</dt>
            <dd className="mt-2 text-sm">{member.profile?.display_name ?? "Não informado"}</dd>
          </div>
          <div>
            <dt className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Papel atual</dt>
            <dd className="mt-2 text-sm">{ORGANIZATION_ROLE_LABELS[member.role]}</dd>
          </div>
          <div>
            <dt className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Entrada na organização</dt>
            <dd className="mt-2 text-sm">{formatDateTime(member.created_at)}</dd>
          </div>
        </dl>
      </section>

      <section className="mt-6 rounded-lg border bg-card p-6">
        <h2 className="font-semibold">Alterar papel</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Os papéis usam a matriz fixa do sistema; permissions individuais não podem ser editadas.
        </p>
        <div className="mt-4">
          <MembershipRoleForm profileId={member.profile_id} currentRole={member.role} />
        </div>
      </section>

      <section className="mt-6 flex flex-col gap-4 rounded-lg border bg-card p-6 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="font-semibold">Status da membership</h2>
          <p className="mt-1 max-w-xl text-sm text-muted-foreground">
            A inativação preserva o histórico e remove o contexto ativo da organização. O último
            Diretor ativo não pode ser inativado.
          </p>
        </div>
        <MembershipStatusAction profileId={member.profile_id} currentStatus={member.status} />
      </section>
    </main>
  );
}
