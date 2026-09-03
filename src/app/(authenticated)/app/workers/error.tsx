"use client";

import { ContentContainer, PageHeader, PageShell } from "@/components/layout/page";
import { Button } from "@/components/ui/button";
import { FeedbackMessage } from "@/components/ui/feedback-message";

export default function WorkersError({ reset }: { reset: () => void }) {
  return (
    <PageShell>
      <ContentContainer size="list">
        <PageHeader
          description="A área de colaboradores encontrou uma falha inesperada."
          eyebrow="Pessoas"
          title="Não foi possível carregar os colaboradores"
        />
        <FeedbackMessage className="mt-6" variant="danger">
          Tente novamente. Se o problema continuar, verifique a conexão e acione
          o suporte operacional.
        </FeedbackMessage>
        <Button className="mt-4" onClick={reset}>
          Tentar novamente
        </Button>
      </ContentContainer>
    </PageShell>
  );
}
