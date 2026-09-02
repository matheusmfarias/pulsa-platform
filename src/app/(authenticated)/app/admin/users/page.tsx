import { ArrowRight } from "lucide-react";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import {
  MembershipStatusBadge,
  ORGANIZATION_ROLE_LABELS,
  listOrganizationMembers,
} from "@/modules/administration";
import { toPublicErrorMessage } from "@/shared/errors";

function formatDate(value: string): string {
  return new Intl.DateTimeFormat("pt-BR", { dateStyle: "medium" }).format(new Date(value));
}

export default async function AdministrationUsersPage() {
  let members;
  try {
    members = await listOrganizationMembers();
  } catch (error) {
    return (
      <main className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <h1 className="text-2xl font-semibold">Usuários</h1>
        <p className="mt-6 rounded-lg border bg-card p-6 text-sm text-destructive" role="alert">
          {toPublicErrorMessage(error)}
        </p>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <div>
        <p className="text-sm font-medium text-primary">Administração</p>
        <h1 className="mt-1 text-2xl font-semibold tracking-tight">Usuários</h1>
        <p className="mt-2 max-w-3xl text-sm text-muted-foreground">
          Memberships existentes na organização. Usuários administrativos e colaboradores
          operacionais são identidades independentes.
        </p>
      </div>

      <div className="mt-6 rounded-lg border bg-muted/35 px-4 py-3 text-sm text-muted-foreground">
        Os e-mails dos usuários não estão disponíveis nesta área.
      </div>

      {members.length === 0 ? (
        <section className="mt-6 rounded-lg border border-dashed bg-card px-6 py-14 text-center">
          <h2 className="font-medium">Nenhuma membership encontrada</h2>
        </section>
      ) : (
        <div className="mt-6 overflow-hidden rounded-lg border bg-card">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[780px] text-left text-sm">
              <thead className="border-b bg-muted/60 text-xs uppercase tracking-wide text-muted-foreground">
                <tr>
                  <th className="px-5 py-3 font-medium">Usuário</th>
                  <th className="px-5 py-3 font-medium">Papel</th>
                  <th className="px-5 py-3 font-medium">Status</th>
                  <th className="px-5 py-3 font-medium">Entrada</th>
                  <th className="px-5 py-3 text-right font-medium">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {members.map((member) => (
                  <tr key={member.profile_id} className="hover:bg-muted/35">
                    <td className="px-5 py-4">
                      <Link
                        className="font-medium hover:underline"
                        href={`/app/admin/users/${member.profile_id}`}
                      >
                        {member.profile?.display_name ?? "Sem nome de exibição"}
                      </Link>
                      <p className="mt-1 max-w-64 truncate text-xs text-muted-foreground" title={member.profile_id}>
                        {member.profile_id}
                      </p>
                    </td>
                    <td className="px-5 py-4">{ORGANIZATION_ROLE_LABELS[member.role]}</td>
                    <td className="px-5 py-4"><MembershipStatusBadge status={member.status} /></td>
                    <td className="px-5 py-4 text-muted-foreground">{formatDate(member.created_at)}</td>
                    <td className="px-5 py-4 text-right">
                      <Button asChild variant="outline" size="sm">
                        <Link href={`/app/admin/users/${member.profile_id}`}>
                          Gerenciar
                          <ArrowRight className="size-4" aria-hidden="true" />
                        </Link>
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </main>
  );
}
