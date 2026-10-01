# Fase 8 — Discovery de Ocorrências

Status: caso piloto escolhido; fluxo de responsabilidade e resolução em validação operacional.
O contrato de implementação ainda não está fechado.

## Por que este é o próximo domínio

A Fase 7 do Pulsa Worker terminou em 7C. O roadmap de produto coloca Execução operacional na
Fase 8. O MVP inclui
Ocorrências como registro de problemas e como fonte para a pergunta "quais ocorrências continuam
abertas?". Entre os candidatos de Execução, Ocorrências já têm um conjunto inicial de campos,
severidades e estados em `DOMAIN.md` e uma jornada mínima em `MVP_V0_3.md`.

O caso piloto escolhido é **problema na unidade**. O primeiro incremento deve registrar e
acompanhar esse problema no Backoffice, sem se confundir com a ausência de um Worker, a
substituição ou a Presence de uma entrada de escala. Esses agregados já têm fatos e comandos
próprios.

## O que já está documentado

- `Occurrence` se relaciona à `Operation`, com `Unit` e `Worker` opcionais na hipótese antiga de
  domínio. Há tipo, severidade, descrição, status, abertura, resolução e autoria.
- As severidades candidatas são `low`, `medium`, `high` e `critical`; os estados candidatos são
  `open`, `in_progress`, `resolved` e `cancelled`.
- O MVP pede abertura, tipo, severidade, responsável, descrição, resolução e histórico.
- Supervisor e Gestor de Operações são os usuários internos mais próximos do acompanhamento de
  campo; a matriz de permissões específica de Ocorrências ainda não foi decidida.
- Pulsa Worker V1 exclui chamados, tarefas, fotos e edição de ocorrências. Abrir esse canal
  exigirá um requisito posterior e seu próprio boundary de autorização.

Esses itens são hipóteses de modelagem ou objetivos de produto, não regras operacionais
confirmadas. A `Occurrence` não deve ser usada para duplicar automaticamente uma Absence,
Replacement ou Presence.

## Decisões para fechar com a operação

1. **Exemplo operacional:** qual problema de unidade ocorreu e qual decisão o registro ajudou a
   tomar? A categoria foi escolhida, mas o exemplo concreto ainda precisa ser confirmado.
2. **Abertura:** quem pode abrir, em qual superfície, e quais informações mínimas sabe no momento?
3. **Contexto:** Operation é suficiente? Unit é obrigatória para esse caso? A relação com Worker é
   necessária e permitida ou poderia expor informação pessoal desnecessária?
4. **Tipo e severidade:** quais opções a equipe usa de fato e quem pode alterá-las?
5. **Responsável:** é um usuário específico, uma função/equipe ou apenas a pessoa que tratou o
   caso? Quem assume e transfere a responsabilidade?
6. **Ciclo de vida:** o que distingue aberto de em andamento? Quem resolve, o que deve constar na
   resolução, e quando cancelar ou reabrir é legítimo?
7. **Histórico:** quais mudanças precisam de eventos próprios além de `audit_events`? O usuário
   precisa acompanhar uma linha do tempo de ações, comentários ou somente mudanças de estado?
8. **Acesso:** quais papéis podem ler, abrir, assumir e resolver? Há dado que só alguns papéis
   podem ver? `Organization` continua sendo o boundary mínimo.
9. **Comunicação:** quem precisa ser avisado e por qual canal? O registro central deve funcionar
   mesmo sem uma integração de notificação.
10. **Medição:** "aberta" inclui em andamento? Qual horário marca abertura e conclusão? Existe
    prazo/SLA contratual para o caso piloto?

## Proposta de primeiro incremento, sujeita às respostas

Um supervisor ou gestor registra um problema em uma Unit, acompanha o responsável e encerra com
uma descrição da solução. O Backoffice mostra os casos abertos e o histórico do caso.
Esse incremento não adiciona formulário ao Pulsa Worker, anexos, automações, SLA ou novos KPIs.

Após validar o caso piloto, a implementação deve entregar em conjunto:

- contrato de domínio com estados, transições e permissões definidos;
- migration aditiva com isolamento por Organization, SELECT por RLS e comandos em RPCs públicas
  protegidas por RBAC, com auditoria transacional;
- services que aplicam `requirePermission()`, listagem, detalhe e ações do Backoffice;
- testes de transição, tenant, papéis, auditoria e uma jornada autenticada do caso piloto.

## Critério de entrada em implementação

Há um exemplo real de ponta a ponta, com quem abre, quem trata, que informação é obrigatória e
qual resultado encerra o caso. Sem isso, não fixar tipos, estados, responsáveis ou campos no
banco apenas com base na lista de possibilidades do roadmap.
