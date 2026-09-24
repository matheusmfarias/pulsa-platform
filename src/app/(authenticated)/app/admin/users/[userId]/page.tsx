import { notFound } from "next/navigation";

import {
  ContentContainer,
  PageHeader,
  PageShell,
} from "@/components/layout/page";
import { Breadcrumb } from "@/components/ui/breadcrumb";
import { FeedbackMessage } from "@/components/ui/feedback-message";
import {
  ResendOrganizationInvitation,
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
  const displayName = member.profile?.display_name ?? member.email ?? "Usuário sem nome cadastrado";
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
          description="Consulte e gerencie o papel e o acesso desta pessoa à organização."
          metadata={<MembershipStatusBadge status={member.status} />}
          title={displayName}
        />
        <div className="mt-8 divide-y divide-border-default border-y border-border-default">
          <section className="py-6">
            <h2 className="font-semibold">Dados do usuário</h2>
            <dl className="mt-5 grid gap-x-8 gap-y-5 sm:grid-cols-2">
              <div>
                <dt className="text-xs font-medium uppercase tracking-wide text-muted-foreground">E-mail</dt>
                <dd className="mt-1 break-all text-sm">{member.email ?? "Indisponível"}</dd>
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
            <details className="mt-5 text-sm text-muted-foreground">
              <summary className="w-fit cursor-pointer rounded-sm font-medium text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus-ring">Identificador para suporte</summary>
              <p className="mt-2 break-all font-mono">{member.profile_id}</p>
            </details>
          </section>
          {member.invitationPending ? (
            <section className="py-6">
              <h2 className="font-semibold">Convite pendente</h2>
              <p className="mt-1 max-w-xl text-sm text-muted-foreground">Esta pessoa ainda não entrou na conta. Ela pode ativar o acesso com o código recebido por e-mail.</p>
              <div className="mt-4"><ResendOrganizationInvitation profileId={member.profile_id} /></div>
            </section>
          ) : null}
          <section className="py-6">
            <h2 className="font-semibold">Alterar papel</h2>
            <p className="mt-1 text-sm leading-6 text-muted-foreground">
              O papel define as áreas e ações disponíveis para esta pessoa.
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
                <h2 className="font-semibold">Acesso à organização</h2>
                <p className="mt-1 max-w-xl text-sm leading-6 text-muted-foreground">
                  Ao desativar o acesso, a pessoa deixa de entrar nesta organização.
                  O histórico permanece disponível. O último Diretor ativo não pode ser desativado.
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
