import { ArrowRight } from "lucide-react";
import Link from "next/link";

import {
  ContentContainer,
  PageHeader,
  PageShell,
} from "@/components/layout/page";
import { Breadcrumb } from "@/components/ui/breadcrumb";
import { Button } from "@/components/ui/button";
import { FeedbackMessage } from "@/components/ui/feedback-message";
import {
  Table,
  TableBody,
  TableCell,
  TableFrame,
  TableHead,
  TableHeader,
  TableRow,
  TableScrollArea,
} from "@/components/ui/table";
import {
  MembershipStatusBadge,
  ORGANIZATION_ROLE_LABELS,
  listOrganizationMembers,
} from "@/modules/administration";
import { toPublicErrorMessage } from "@/shared/errors";

function formatDate(value: string): string {
  return new Intl.DateTimeFormat("pt-BR", { dateStyle: "medium" }).format(
    new Date(value),
  );
}

export default async function AdministrationUsersPage() {
  let members;
  try {
    members = await listOrganizationMembers();
  } catch (error) {
    return (
      <PageShell>
        <ContentContainer size="list">
          <PageHeader
            breadcrumb={
              <Breadcrumb
                items={[{ label: "Administração" }, { label: "Usuários" }]}
              />
            }
            title="Usuários"
          />
          <FeedbackMessage className="mt-6" variant="danger">
            {toPublicErrorMessage(error)}
          </FeedbackMessage>
        </ContentContainer>
      </PageShell>
    );
  }
  return (
    <PageShell>
      <ContentContainer size="list">
        <PageHeader
          breadcrumb={
            <Breadcrumb
              items={[{ label: "Administração" }, { label: "Usuários" }]}
            />
          }
          description="Memberships existentes na organização. Usuários administrativos e colaboradores operacionais são identidades independentes."
          title="Usuários"
        />
        <FeedbackMessage className="mt-6" variant="info">
          Os e-mails dos usuários não estão disponíveis nesta área.
        </FeedbackMessage>
        {members.length === 0 ? (
          <section className="mt-6 rounded-surface border border-dashed border-border-default px-6 py-8 text-center sm:py-10">
            <h2 className="font-medium">Nenhuma membership encontrada</h2>
          </section>
        ) : (
          <TableFrame className="mt-6">
            <TableScrollArea label="Tabela de usuários">
              <Table className="min-w-full table-fixed lg:min-w-[780px] lg:table-auto">
                <TableHeader>
                  <TableRow>
                    <TableHead>Usuário</TableHead>
                    <TableHead>Papel</TableHead>
                    <TableHead className="w-28">Status</TableHead>
                    <TableHead>Entrada</TableHead>
                    <TableHead className="w-28 text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {members.map((member) => (
                    <TableRow key={member.profile_id}>
                      <TableCell className="min-w-0">
                        <Link
                          className="block truncate font-medium underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus-ring"
                          href={`/app/admin/users/${member.profile_id}`}
                        >
                          {member.profile?.display_name ??
                            "Sem nome de exibição"}
                        </Link>
                        <p
                          className="mt-1 truncate font-mono text-xs text-muted-foreground"
                          title={member.profile_id}
                        >
                          {member.profile_id}
                        </p>
                      </TableCell>
                      <TableCell>
                        {ORGANIZATION_ROLE_LABELS[member.role]}
                      </TableCell>
                      <TableCell>
                        <MembershipStatusBadge status={member.status} />
                      </TableCell>
                      <TableCell className="whitespace-nowrap text-muted-foreground">
                        {formatDate(member.created_at)}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button asChild size="sm" variant="outline">
                          <Link href={`/app/admin/users/${member.profile_id}`}>
                            Gerenciar
                            <ArrowRight aria-hidden="true" className="size-4" />
                          </Link>
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableScrollArea>
          </TableFrame>
        )}
      </ContentContainer>
    </PageShell>
  );
}
