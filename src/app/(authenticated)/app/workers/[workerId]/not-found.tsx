import Link from "next/link";

import { ContentContainer, PageHeader, PageShell } from "@/components/layout/page";
import { Button } from "@/components/ui/button";
import { Breadcrumb } from "@/components/ui/breadcrumb";

export default function WorkerNotFound() {
  return (
    <PageShell>
      <ContentContainer size="detail">
        <PageHeader
          description="O registro pode ter sido removido ou o endereço informado não é válido."
          breadcrumb={<Breadcrumb items={[{ label: "Pessoas" }, { label: "Colaboradores" }]} />}
          title="Colaborador não encontrado"
        />
        <Button asChild className="mt-6">
          <Link href="/app/workers">Ver colaboradores</Link>
        </Button>
      </ContentContainer>
    </PageShell>
  );
}
