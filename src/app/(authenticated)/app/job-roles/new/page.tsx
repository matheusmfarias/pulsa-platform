import { ArrowLeft } from "lucide-react";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { JobRoleForm } from "@/modules/job-roles";

export default function NewJobRolePage() {
  return <main className="mx-auto max-w-3xl px-4 py-10 sm:px-6 lg:px-8"><Button asChild variant="outline" size="sm"><Link href="/app/job-roles"><ArrowLeft className="size-4" />Voltar</Link></Button><div className="mt-6"><h1 className="text-2xl font-semibold">Novo cargo</h1><p className="mt-2 text-sm text-muted-foreground">Cadastre um cargo ou função reutilizável na organização.</p></div><section className="mt-8 rounded-lg border bg-card p-6 sm:p-8"><JobRoleForm /></section></main>;
}
