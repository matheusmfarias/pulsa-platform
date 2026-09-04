import { notFound } from "next/navigation";

import {
  ContentContainer,
  PageHeader,
  PageShell,
} from "@/components/layout/page";
import { Breadcrumb } from "@/components/ui/breadcrumb";
import { FeedbackMessage } from "@/components/ui/feedback-message";
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
      <PageShell>
        <ContentContainer size="detail">
          <PageHeader
            breadcrumb={
              <Breadcrumb
                items={[{ label: "Administração" }, { label: "Usuários" }]}
              />
            }
            title="Usuário"
          />
          <FeedbackMessage className="mt-6" variant="danger">
            {toPublicErrorMessage(error)}
          </FeedbackMessage>
        </ContentContainer>
      </PageShell>
    );
  }
  const displayName = member.profile?.display_name ?? "Sem nome de exibição";
  return (
    <PageShell>
      <ContentContainer size="detail">
        <PageHeader
          breadcrumb={
            <Breadcrumb
              items={[
                { label: "Administração" },
                { label: "Usuários", href: "/app/admin/users" },
                { label: displayName },
              ]}
            />
          }
          description="Membership administrativa da organização atual."
          metadata={<MembershipStatusBadge status={member.status} />}
          title={displayName}
        />
        <div className="mt-8 divide-y divide-border-default border-y border-border-default">
          <section className="py-6">
            <h2 className="font-semibold">Identidade e membership</h2>
            <dl className="mt-5 grid gap-x-8 gap-y-5 sm:grid-cols-2">
              <div>
                <dt className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  Profile ID
                </dt>
                <dd className="mt-1 break-all font-mono text-sm">
                  {member.profile_id}
                </dd>
              </div>
              <div>
                <dt className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  Nome de exibição
                </dt>
                <dd className="mt-1 text-sm">
                  {member.profile?.display_name ?? "Não informado"}
                </dd>
              </div>
              <div>
                <dt className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  Papel atual
                </dt>
                <dd className="mt-1 text-sm">
                  {ORGANIZATION_ROLE_LABELS[member.role]}
                </dd>
              </div>
              <div>
                <dt className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  Entrada na organização
                </dt>
                <dd className="mt-1 text-sm">
                  {formatDateTime(member.created_at)}
                </dd>
              </div>
            </dl>
          </section>
          <section className="py-6">
            <h2 className="font-semibold">Alterar papel</h2>
            <p className="mt-1 text-sm leading-6 text-muted-foreground">
              Os papéis usam a matriz fixa do sistema; permissions individuais
              não podem ser editadas.
            </p>
            <div className="mt-4">
              <MembershipRoleForm
                currentRole={member.role}
                profileId={member.profile_id}
              />
            </div>
          </section>
          <section className="py-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="font-semibold">Status da membership</h2>
                <p className="mt-1 max-w-xl text-sm leading-6 text-muted-foreground">
                  A inativação preserva o histórico e remove o contexto ativo da
                  organização. O último Diretor ativo não pode ser inativado.
                </p>
              </div>
              <MembershipStatusAction
                currentStatus={member.status}
                profileId={member.profile_id}
              />
            </div>
          </section>
        </div>
      </ContentContainer>
    </PageShell>
  );
}
