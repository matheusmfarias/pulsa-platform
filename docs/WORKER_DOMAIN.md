# Pulsa Platform — Pulsa Worker Domain & Architecture

Status: contrato arquitetural vigente da Fase 7; 7A, 7B, 7B.1, 7C, Pilot Polish e
Worker Auth Hardening implementados; 7D planejada e condicionada à validação operacional

## 1. Decisão arquitetural

Pulsa Worker é uma superfície mobile-first dentro do mesmo monólito modular Next.js e do
mesmo projeto Supabase do Backoffice, mas tem uma fronteira própria de identidade,
autorização, rotas, serviços e RPCs.

O compartilhamento termina no domínio operacional e na sessão de autenticação:

```text
                         auth.users / profiles
                                  │
                 ┌────────────────┴────────────────┐
                 │                                 │
       organization_members              worker_access_links
       (principal interno)                 (principal Worker)
                 │                                 │
        RBAC + Organization              Worker resolvido no banco
                 │                                 │
        Pulsa Backoffice                    Pulsa Worker
                 └──────────────┬──────────────────┘
                                │
           Assignment → ScheduleEntry → Absence → Replacement → Presence
```

Decisões vinculantes:

1. `Worker` continua não sendo um usuário de autenticação.
2. `organization_members` continua exclusivo dos usuários internos do Backoffice. Não será
   criada a role `WORKER` no RBAC atual.
3. O vínculo entre `auth.users`/`profiles` e `Worker` é uma entidade própria, histórica e
   revogável.
4. O cliente nunca escolhe `Organization`, `Worker`, `Assignment` ou `Replacement`. O banco os
   resolve a partir de `auth.uid()` e do recurso solicitado.
5. Pulsa Worker não usa `OperationalContext`, as permissões internas de `requirePermission()`
   nem queries diretas sobre o grafo operacional.
6. Leituras e escritas do Worker passam por RPCs estreitas, `SECURITY DEFINER`, com retorno
   minimizado e autorização por recurso no banco. O app repete a checagem em uma service layer
   própria.
7. Presence continua sendo o agregado da Fase 6A. A Fase 7 adiciona apenas um novo principal e
   um boundary seguro para `source = app`; não cria outra presença ou ledger de ponto.
8. A V1 é web responsiva no mesmo deploy. PWA instalável, offline-first e app nativo não são
   requisitos da primeira entrega.

## 2. Estado atual considerado

A decisão parte do estado efetivamente implementado, e não apenas de documentos históricos:

- `profiles.id` referencia `auth.users.id` e é uma projeção neutra de identidade;
- `organization_members` relaciona `profiles` a uma Organization, possui uma única role interna
  e sustenta `is_active_organization_member`, `has_organization_permission`, RLS e RBAC;
- a aplicação interna exige exatamente uma Organization ativa por membership;
- `requirePermission()` resolve membership e role; `OperationalContext` é somente filtro de UX
  do Backoffice;
- tabelas protegidas não aceitam DML direto de `authenticated`; mutações críticas usam RPCs
  públicas protegidas, implementação privada e auditoria atômica;
- `Worker` pertence a uma Organization e seu acesso opcional a `auth.users` ocorre somente por
  `worker_access_links`, nunca por associação automática;
- `Assignment` preserva o contexto temporal `Worker → Position → Unit → Operation`;
- Scheduling usa revisões imutáveis e considera oficial a revisão `published` de maior versão de
  cada `Schedule`;
- `Absence` representa a indisponibilidade do Worker original e `Replacement` a cobertura ativa;
- `Presence` referencia uma `ScheduleEntry` e a `actual_assignment_id` resolvida pelo banco;
- `start_presence` e `complete_presence` atuais são contratos internos: aceitam
  `organization_id`, horários e origem, e exigem permissions do RBAC interno;
- `Presence` já possui `source`, `source_reference`, recibos de idempotência, locks,
  unicidade por entrada, proteção histórica e auditoria;
- `audit_events.actor_user_id` referencia `profiles`, portanto todo principal humano que produz
  auditoria precisa de um `profile`, sem que isso implique membership interna.

Consequência: as RPCs públicas atuais de Presence não podem ser chamadas diretamente pelo
Pulsa Worker. Elas aceitam autoridade demais do chamador e exigem uma autoridade interna que o
Worker deliberadamente não terá.

## 3. Identidade Worker ↔ Auth

### 3.1 Entidade de vínculo

A implementação usa `worker_access_links`, separada de `organization_members`.

Campos conceituais mínimos:

- `id`;
- `worker_id`, referência imutável a `workers`;
- `profile_id`, referência imutável a `profiles` e, por consequência, a `auth.users`;
- `status`: `active`, `suspended` ou `revoked`;
- `activated_at`;
- `suspended_at`, `suspended_by` e `suspension_reason`, quando aplicável;
- `revoked_at`, `revoked_by` e `revocation_reason`, quando aplicável;
- `created_at`.

`revoked` é terminal. Corrigir uma associação errada significa revogar o vínculo e criar outro;
nunca trocar seu `worker_id` ou `profile_id`. A suspensão é reversível e representa bloqueio de
acesso independente do status operacional do Worker.

`organization_id` não deve ser duplicado no vínculo na primeira versão: ele é derivado sem
ambiguidade de `worker_id`. Toda autorização deve fazer o join com `workers` e obter a
Organization real. Se testes de RLS ou performance demonstrarem necessidade concreta de
denormalização, uma evolução posterior poderá acrescentá-lo com constraint/trigger de
consistência.

### 3.2 Cardinalidade

Na V1:

- um `Worker` possui zero ou um vínculo não revogado;
- um `profile` possui zero ou um vínculo Worker não revogado;
- um vínculo relaciona exatamente um `profile` a exatamente um `Worker`;
- um Worker pode ter vários vínculos históricos, desde que somente um esteja `active` ou
  `suspended`;
- um profile pode ter vários vínculos históricos, mas somente um não revogado;
- um vínculo permite múltiplas sessões/dispositivos do mesmo Auth User; dispositivo não é
  identidade de domínio.

As unicidades devem cobrir `active` e `suspended`, não somente `active`, para que uma suspensão
não permita associar a mesma conta ou o mesmo Worker em paralelo. A relação V1 é 1:1 corrente,
mesmo que uma pessoa real possa futuramente ser representada em mais de uma Organization. Esse
caso exige decisão explícita e não deve introduzir um seletor de Organization agora.

Uma pessoa pode, excepcionalmente, ser ao mesmo tempo usuária interna e Worker. Nesse caso o
mesmo profile pode ter membership interna e vínculo Worker, mas cada superfície resolve e aplica
seu próprio principal. Uma autoridade nunca é herdada pela outra.

### 3.3 Worker sem conta

Esse é o estado normal de `Worker`: ausência de vínculo significa apenas “sem acesso ao Pulsa
Worker”. Não altera status, Assignment, escala, ausência, substituição ou Presence.

Convites pendentes ficam na entidade de segurança separada
`worker_access_invitations`, para não criar um vínculo antes da prova de posse
da conta. Campos mínimos:

- `id` e `worker_id`;
- `channel` (`email` na V1);
- destino normalizado e protegido como PII;
- hash de token aleatório de alta entropia, nunca o token em claro;
- `expires_at`;
- `status`: `pending`, `claimed`, `revoked` ou `expired`;
- `created_at`, `created_by`, `claimed_at` e `claimed_by`.

Somente um convite pendente por Worker deve existir. Convites são curtos, de uso único,
revogáveis e protegidos contra tentativa repetida. Expiração pode ser materializada na transição
ou derivada de `expires_at`; ela não deve depender de job agendado para ser segura.

### 3.4 Provisionamento, autenticação inicial e claim

O fluxo implementado é:

1. Um `DIRECTOR` com permission explícita `worker_access:manage` seleciona o Worker correto e
   confere o e-mail operacional.
2. O sistema prepara administrativamente o Auth User, cria um convite de uso único, guarda
   somente o hash e envia convite e OTP de oito dígitos ao e-mail selecionado.
3. O usuário comprova posse do e-mail com o OTP. O deep-link com token continua suportado, mas
   uma sessão autenticada também pode resolver exclusivamente seu próprio convite pendente por
   `auth.uid()`, sem selecionar Worker, Organization ou e-mail.
4. Respostas públicas não revelam se Worker, conta ou e-mail existem.
5. Uma RPC transacional de claim confere novamente token quando presente, expiração, status,
   e-mail verificado,
   Worker, unicidades e ausência de vínculo conflitante.
6. A RPC cria o `profile` neutro se necessário, cria o vínculo `active`, marca o convite como
   `claimed` e registra auditoria na mesma transação.
7. Se não existe vínculo histórico para o profile, o primeiro claim segue para
   `/worker/set-password`; o Worker define uma senha mínima de oito caracteres e entra na área.
   Se existe vínculo histórico, inclusive revogado, o claim é uma reativação e retorna diretamente
   à área Worker, preservando a senha já definida.
8. Nos acessos posteriores, e-mail + senha é o fluxo principal. “Entrar com código” permanece
   disponível como fallback, sempre com criação automática de usuário desabilitada. Autenticar
   sem vínculo ativo nunca concede acesso.

Somente Worker com `status = active` efetiva o claim na V1. Um convite pode ser preparado durante
`onboarding`, mas não pode produzir acesso efetivo antes da ativação.

A associação nunca deve nascer de busca automática por e-mail, telefone, nome ou documento.
O contato serve para provar controle do canal; o convite liga esse canal ao Worker explicitamente
selecionado por um administrador.

### 3.5 CPF/documento

CPF/documento não é segredo, não é fator de autenticação e não deve ser usado para localizar ou
associar automaticamente uma conta. Isso facilitaria enumeração e associações indevidas com
dados conhecidos ou vazados.

A V1 não deve solicitar CPF no claim. Se suporte operacional futuro exigir confirmação adicional,
somente poucos dígitos podem funcionar como dado corroborativo, sempre junto de convite forte e
OTP, com rate limit e resposta não enumerável. Nunca será suficiente isoladamente.

### 3.6 E-mail e telefone ausentes ou alterados

- Worker sem e-mail não recebe acesso na V1; o cadastro pode continuar existindo normalmente.
- O e-mail em `workers.email` é contato operacional, não a chave permanente do vínculo.
- Após o claim, a identidade estável é `profile_id`; editar `workers.email` não religa nem troca
  uma conta.
- Convite pendente cujo destino mudou deve ser revogado e reemitido.
- Mudança do e-mail de autenticação deve exigir verificação pelo Supabase Auth e manter o mesmo
  `auth.users.id`/`profile_id`.
- Quando o usuário perdeu o canal antigo, recuperação é um processo administrativo: suspender ou
  revogar imediatamente o vínculo antigo, verificar a pessoa fora do canal comprometido e emitir
  novo convite. Não se move o vínculo histórico para outro Auth User.
- Telefone continua dado operacional na V1. Phone OTP só entra após fornecedor, custos,
  consentimento, qualidade dos números e processo de recuperação estarem validados.

### 3.7 Status e revogação

O acesso efetivo exige simultaneamente:

```text
sessão Auth válida
AND profile existente
AND worker_access_link.status = active
AND Worker.status = active
AND Organization.status = active
```

Efeitos:

- `Worker.inactive`: bloqueio imediato, mesmo com sessão e link ativos. A reativação do Worker
  pode restaurar o vínculo, salvo se ele tiver sido suspenso/revogado separadamente;
- `Worker.terminated`: bloqueio imediato e revogação terminal do vínculo na mesma mutação
  auditada de encerramento;
- `link.suspended`: bloqueia sem alterar o Worker e pode ser retomado por ação administrativa;
- `link.revoked`: bloqueia de modo terminal; novo acesso exige novo convite e novo vínculo;
- Organization inativa: bloqueia todos os vínculos derivados dela;
- encerrar uma Assignment não revoga a conta, pois o Worker pode ter outras Assignments atuais ou
  futuras. Apenas remove aquela Assignment como base para nova ação.

Revogar o vínculo deve negar acesso no banco imediatamente, sem depender de expiração do JWT.
Revogar sessões/refresh tokens no provedor é uma defesa adicional, não o controle primário.
Histórico de vínculo e auditoria permanecem; nada é hard-deleted como fluxo normal.

## 4. Autenticação V1

A V1 usa Supabase Auth e compartilha a infraestrutura de sessão já existente, mantendo boundaries
distintos para Backoffice e Worker. Não existe signup público: o Auth User é preparado apenas pelo
fluxo administrativo de provisionamento de WorkerAccess.

No primeiro acesso, o convite leva ao fluxo de e-mail + OTP de oito dígitos. O Worker pode informar
um código já recebido ou solicitar um novo; `shouldCreateUser = false` impede que o login crie uma
conta arbitrária. Após autenticar, o claim resolve o convite vinculado à própria conta. Conta sem
histórico de WorkerAccess segue para `/worker/set-password`, onde define senha com mínimo de oito
caracteres. A existência de senha no provedor não é usada para classificar primeiro acesso, pois o
provisionamento administrativo pode gerar uma credencial interna aleatória.

Nos acessos posteriores, `/worker/sign-in` usa e-mail + senha como mecanismo principal. “Entrar
com código” mantém OTP por e-mail como fallback. “Esqueci minha senha” usa o recovery do Supabase,
com resposta pública uniforme para não permitir enumeração, e a redefinição ocorre em rota Worker
dedicada. A Conta oferece alteração de senha dentro do layout Worker autenticado.

Na reativação, vínculos revogados permanecem no histórico. Um novo convite e claim criam o novo
vínculo, mas não obrigam redefinir a senha: a existência de qualquer `worker_access_links` histórico
para o profile identifica a reativação e o fluxo retorna diretamente a `/worker`.

OTP não é o único mecanismo recorrente de login. Magic link continua suportado pelo stack apenas
como parte do transporte configurado do Supabase, sem ser a experiência principal. Phone OTP,
MFA, PWA e canais SMS/WhatsApp permanecem fora da V1.

Configuração de produção deve manter SMTP próprio, templates de OTP/recovery, expiração curta,
rate limit por IP/destino, proteção antiabuso e mensagens não enumeráveis. Login, OTP ou recovery
nunca concedem WorkerAccess por si só: a autorização continua resolvida no banco em cada request.

O login interno atual permanece separado. A presença de uma sessão não decide o destino por si
só: `/app` resolve membership interna; `/worker` resolve vínculo Worker. Um usuário sem a
autoridade da superfície recebe acesso negado, não uma Organization ou Worker padrão.

Referências do stack: [Passwordless email sign-in](https://supabase.com/docs/guides/auth/auth-email-passwordless),
[Phone sign-in](https://supabase.com/docs/guides/auth/phone-login) e
[custom SMTP](https://supabase.com/docs/guides/auth/auth-smtp).

## 5. Autorização e isolamento

### 5.1 Dois boundaries explícitos

Backoffice mantém o fluxo atual:

```text
Server Action → service → requirePermission()
→ RPC pública RBAC-protected → mutação + audit
```

Pulsa Worker usa um fluxo distinto:

```text
Server Action / Server Component
→ worker service → requireWorkerAccess()
→ RPC pública específica de Worker
→ private.require_worker_access(auth.uid())
→ autorização por recurso + regra de domínio + audit
```

`requireWorkerAccess()` retorna internamente `{ userId, profileId, workerId, organizationId }`,
mas nenhum desses IDs vira escolha do cliente. Ele não chama `requireActiveOrganization`, não
resolve role e não lê cookie de `OperationalContext`.

### 5.2 Responsabilidade do banco

Uma helper privada `require_worker_access()` deve:

- exigir `auth.uid()`;
- localizar exatamente um vínculo `active` para o profile;
- obter Worker e Organization por joins;
- exigir Worker e Organization ativos;
- falhar de forma fechada diante de duplicidade ou inconsistência;
- retornar o contexto resolvido somente a funções privadas/públicas autorizadas.

Cada RPC Worker deve então provar que o recurso pertence à jornada daquele Worker. Saber um UUID
jamais é suficiente. Para UUID inexistente, alheio ou de outra Organization, a resposta pública
deve ser a mesma (`not found`/ação indisponível), evitando oráculo de enumeração.

### 5.3 RLS, RPCs, claims e service layer

A combinação recomendada é:

- **RLS atual** permanece negando as tabelas operacionais a authenticated sem membership;
- **sem policies Worker amplas** em `workers`, `assignments`, `schedule_entries`, `absences`,
  `replacements`, `presences`, Clients ou Contracts;
- **RPCs Worker `SECURITY DEFINER` estreitas** fazem projeções e comandos já filtrados;
- schema privado, `search_path = ''`, privilégios revogados de `public`/`anon` e EXECUTE apenas
  para `authenticated`;
- **service layer própria** repete autenticação/autorização para UX e logging, mas o banco é a
  barreira autoritativa contra chamadas diretas;
- **JWT claims não carregam Organization/Worker como fonte de verdade**. Claims ficam obsoletos
  após revogação; no máximo poderão ser hints de superfície;
- **service role não participa de leituras ou comandos normais do Worker**.

As tabelas de convite/vínculo terão RLS habilitada e nenhum DML direto para `authenticated`.
Administração usa RPC auditada com `worker_access:manage`; claim usa uma RPC própria com prova de
convite e de sessão, não uma permissão interna.

### 5.4 Contratos de leitura implementados

Contratos públicos estreitos implementados:

- `get_worker_home()`;
- `list_worker_schedule(from_date, to_date)` com intervalo máximo e paginação;
- `get_worker_schedule_entry(schedule_entry_id)`;
- `list_worker_presence_history(limit, cursor)`.

Nenhum recebe `organization_id` ou `worker_id`. Os DTOs não devem reutilizar o read model de
Supervisor, porque `list_presence_operational_day` contém nomes e IDs de outros Workers,
Client/Contract e contexto administrativo desnecessário.

## 6. Escopo funcional do Worker V1

A V1 permite exatamente:

- claim de convite, login principal por senha, OTP de primeiro acesso/fallback, recovery e logout;
- visualizar a jornada atual ou, quando não houver, a próxima jornada oficial;
- visualizar a escala oficial própria por semana;
- abrir detalhe de uma jornada própria;
- ver Operation, Unit, endereço disponível, JobRole, horário e intervalo planejado;
- saber se é o Worker original, se está atuando como substituto ou se sua jornada original foi
  substituída;
- visualizar que a escala oficial foi republicada/alterada e a data da publicação mais recente;
- registrar a própria chegada;
- registrar a própria saída;
- visualizar o próprio histórico de Presence;
- ver sinais objetivos como “chegada após o início previsto” e “saída antes do fim previsto”,
  sem classificação trabalhista.

A V1 não permite corrigir ou cancelar Presence. Erros seguem para o Supervisor no Backoffice,
com justificativa e auditoria já existentes.

Também não permite comunicar ausência, criar/cancelar Replacement, solicitar substituição,
aceitar convocação, trocar jornada ou consultar oportunidades. Essas operações exigem lifecycles
e políticas ainda inexistentes.

## 7. Escala vista pelo Worker

### 7.1 Regra de pertencimento

Uma entrada é relacionável ao Worker autenticado quando ocorre ao menos uma destas situações:

1. a `ScheduleEntry.assignment_id` aponta para Assignment do Worker original;
2. existe `Absence.reported` e `Replacement.active` cuja `replacement_assignment_id` aponta para
   Assignment do Worker substituto;
3. existe Presence não cancelada cuja `actual_assignment_id` aponta para Assignment do Worker,
   inclusive quando a revisão foi posteriormente substituída.

“Relacionável” não significa “acionável”. A projeção precisa classificar o papel e a fase da
jornada.

### 7.2 Casos obrigatórios

| Caso | O que o Worker vê | Pode registrar Presence? |
| --- | --- | --- |
| A. Original, sem Absence reportada | Jornada esperada própria | Sim, na janela operacional |
| B. Replacement ativo do Worker | Jornada esperada como substituto, com indicador claro | Sim, na janela operacional |
| C. Original com Absence + Replacement ativo de terceiro | “Você foi substituído”; sem nome/ID do substituto | Não |
| Original com Absence reportada e sem Replacement | “Ausência registrada; você não é esperado”; sem detalhes internos de candidatos | Não |
| D. Presence histórica realizada pelo Worker | Fato próprio realizado, com horários e sinais | Não inicia novamente; saída apenas se ainda `present` |
| E. Revisão published superseded | Nunca é jornada atualmente esperada | Não inicia; aparece somente em histórico próprio ou contexto de alteração |

Uma Replacement cancelada deixa imediatamente de atribuir a jornada ao antigo substituto. Se a
Absence continuar reportada e descoberta, ninguém pode iniciar Presence. Se a Absence for
cancelada, o Worker original volta a ser o esperado da revisão oficial atual.

### 7.3 Quatro conceitos de UX

- **Jornada atualmente esperada:** entrada da revisão `published` oficial atual, cujo Worker
  efetivo resolvido agora é o autenticado e que ainda não foi concluída/substituída.
- **Jornada substituída:** entrada originalmente atribuída ao Worker, mas com Absence reportada e,
  quando aplicável, cobertura ativa. É informativa e não acionável.
- **Jornada histórica:** entrada passada ou de revisão superseded. Não é reaberta. Se não há
  Presence, o texto é “sem confirmação de presença”, nunca “ausente”.
- **Jornada concluída:** há Presence `completed` da Assignment efetiva do Worker. Os horários
  observados são imutáveis para o Worker; correção é do Backoffice.

Presence `present` continua acionável para saída mesmo se uma nova revisão for publicada depois.
A identidade histórica já foi materializada em `actual_assignment_id` e não deve ser recalculada.

### 7.4 Somente publicação oficial

Hoje/próximas jornadas usam somente a revisão `published` de maior `version` de cada Schedule.
`draft`, `pending_approval` e `approved` nunca aparecem, nem como status, contagem, sinalização ou
mensagem indireta. Revisões publicadas antigas não disputam a expectativa atual.

A V1 não cria lineage de `ScheduleEntry`. Portanto, não deve alegar um diff exato entre entradas
quando uma nova revisão recria IDs. A sinalização segura é: “sua escala oficial foi atualizada em
X; revise estas jornadas”, mostrando a versão atual e, quando útil, a versão publicada anterior
claramente rotulada como substituída. Diff item a item e ciência formal ficam para 7D caso o
produto valide a necessidade de lineage/acknowledgement.

### 7.5 Assignment encerrada

Uma Assignment `suspended`, `finished` ou `cancelled` não autoriza nova chegada pelo Worker,
mesmo que um UUID antigo seja conhecido. Assignments `pending` ou `active` seguem a elegibilidade
já usada por Scheduling/Replacement. Presence própria já iniciada pode ser concluída, pois
encerrar a Assignment depois não apaga o fato em andamento; Worker ou acesso inativo, porém,
bloqueia a ação e exige intervenção do Supervisor.

## 8. Presence pelo Worker

### 8.1 Reuso da Fase 6A

O Worker usa o mesmo agregado `presences`, a mesma unicidade de uma Presence válida por
ScheduleEntry, os mesmos locks, lifecycle, idempotência e auditoria. Não haverá
`worker_presences`, tabela de batidas ou cópia de ScheduleEntry.

Na camada de aplicação, o módulo `worker-presence` usa wrappers públicos distintos da superfície
interna:

```text
worker_start_presence(schedule_entry_id, source_reference, idempotency_key)
worker_complete_presence(schedule_entry_id, idempotency_key)
```

Nomes diferentes evitam overload ambíguo no Data API e deixam a fronteira auditável. A migration
7C refatora `private.start_presence` e `private.complete_presence` para que Backoffice e Worker
chamem os mesmos cores transacionais de resolução, locks, lifecycle, recibos, persistência e
auditoria. O caminho Worker acrescenta `actor_worker_id` autoritativo e suas regras mais
restritivas sem alterar os contratos públicos da 6A.

### 8.2 Valores derivados

O Worker não envia:

- `organization_id`;
- `worker_id`;
- `assignment_id`/`actual_assignment_id`;
- `replacement_id`;
- `source`;
- `arrived_at` ou `departed_at`.

O banco resolve o vínculo por `auth.uid()`, deriva a Organization, trava a ScheduleEntry e o
contexto Absence/Replacement, resolve a Assignment efetiva e exige que seu `worker_id` seja o
principal autenticado. `source` é forçado a `app`; horários usam o relógio do banco. Na chegada,
`source_reference` e `idempotency_key` são os únicos identificadores técnicos além da
ScheduleEntry. Na saída, somente uma nova `idempotency_key` é enviada.

Para saída, o banco exige que `Presence.actual_assignment_id → Worker` seja o Worker autenticado.
O comando localiza a Presence `present` própria pela ScheduleEntry; não recebe `presence_id`. O
`source_reference` do evento de saída é derivado da Presence aberta, com o UUID da própria
Presence como fallback histórico quando uma origem manual não tinha referência. Isso permite
concluir em outro navegador sem transformar storage do cliente em autoridade.

### 8.3 Primeira fatia concreta da antiga 6C

- `source = app`, definido no servidor/banco;
- `source_reference`: UUID opaco gerado pelo cliente para a chegada; não contém Worker,
  Organization, aparelho ou PII. A saída reutiliza no banco a referência já persistida;
- `idempotency_key`: UUID por comando, persistido pelo cliente até resposta terminal e repetido
  sem alteração em retries;
- mesma chave com mesmo comando/payload canônico retorna o mesmo resultado;
- mesma chave com payload/comando diferente retorna conflito;
- uma nova chave não contorna a unicidade de Presence válida por ScheduleEntry;
- o payload canônico de idempotência dos wrappers Worker não inclui o timestamp gerado pelo
  banco, senão um retry produziria hash divergente.

Isso é ingestão real por app, não uma plataforma genérica de integrações. Principal técnico,
webhooks, adapters de fornecedores e eventos fora de ordem continuam adiados.

### 8.4 Concorrência

A prova de pertencimento e a resolução original/replacement devem ocorrer na mesma transação que
cria Presence. Não é suficiente o app ler a jornada, autorizar e depois chamar a implementação
atual: Replacement pode ser cancelada/trocada entre as duas etapas.

O comando deve serializar ScheduleEntry, Absence e Replacement como a 6A já faz, comparar o
Worker efetivo depois dos locks e só então persistir. Cancelamento/troca concorrente resulta em
um único estado válido; o perdedor recebe conflito e recarrega a jornada.

### 8.5 Horários e limites

Separação de responsabilidades:

- **segurança/autorização:** somente o Worker efetivo pode agir; IDs e timestamps não são
  confiados ao cliente;
- **regra operacional V1:** limita quando o autosserviço pode iniciar uma Presence;
- **sinalização de desvio:** compara realizado e planejado sem rejeitar ou classificar como
  infração trabalhista.

Regra V1 para chegada:

- a entrada deve ser da revisão oficial atual;
- a Assignment efetiva deve ser elegível e pertencer ao Worker autenticado;
- o instante atual, na timezone da Unit, deve cair na mesma data civil do início planejado; ou
- o instante atual deve estar dentro do intervalo da jornada, cobrindo corretamente jornadas que
  atravessam a meia-noite.

Assim, é permitido chegar antes do horário ou depois do fim previsto quando ainda é a data civil
de início, sem criar uma tolerância global em minutos. Não é permitido iniciar em dia futuro, em
dia passado depois de encerrado o intervalo, nem informar horário retroativo/futuro. Backfill e
correção pertencem ao Backoffice.

Regra V1 para saída:

- somente uma Presence própria com status `present` pode ser concluída;
- o banco registra “agora” e exige que seja posterior à chegada;
- a saída continua permitida depois do fim previsto e, inclusive, em data civil posterior, para
  não aprisionar uma Presence aberta;
- correções não são autosserviço.

Chegada após `starts_at` e saída antes de `ends_at` são sinais objetivos. A plataforma não cria
tolerância de atraso, arredondamento, punição, hora extra ou regra trabalhista global.

## 9. Absence e Replacement

Na V1 o Worker apenas lê consequências que dizem respeito à própria jornada:

- original: vê que deixou de ser esperado e, quando houver, que a cobertura foi confirmada;
- substituto: vê que está atuando como substituto;
- nenhum dos dois vê nome, documento, contato, Assignment ou Presence do outro.

Ficam fora da V1:

- informar/cancelar ausência;
- anexar atestado ou motivo médico;
- solicitar substituição;
- receber, aceitar ou recusar convocação;
- escolher candidato;
- ativar/cancelar Replacement.

Hoje `Absence.reported` e `Replacement.active` são fatos controlados pelo Backoffice. Aceite ou
recusa não deve ser comprimido no lifecycle `active/cancelled` de Replacement. Se priorizado,
uma fase posterior deverá modelar uma `ReplacementOffer`/convocação anterior à criação do
Replacement ativo, com expiração, aceite, recusa, concorrência e auditoria próprios.

## 10. Dados expostos

DTO mínimo de jornada:

- `schedule_entry_id` opaco;
- início, fim, intervalo planejado e timezone;
- nome da Operation;
- nome da Unit;
- endereço/cidade/UF da Unit, somente quando cadastrados e necessários para deslocamento;
- `JobRole.name` como nome do cargo;
- estado derivado da jornada e próxima ação;
- boolean/label de substituição;
- Presence própria: status, chegada, saída e sinais objetivos;
- data da publicação oficial mais recente relevante.

`Position.title` não existe e nunca deve ser inventado; o nome exibido vem de `JobRole.name`.
`position_id` e `assignment_id` não precisam sair no DTO se a UI não os usa.

Não expor:

- CPF/documento, e-mail ou telefone de qualquer Worker;
- nome/ID do Worker original ao substituto ou do substituto ao original;
- listas, contagens ou Presence de outros Workers;
- notas/motivo detalhado de Absence de outra pessoa;
- autor interno de criação/publicação;
- Client e Contract, seus nomes, IDs, status ou dados comerciais;
- versões draft/pending/approved;
- auditoria administrativa, permissões, roles ou memberships;
- métricas operacionais globais.

Client/Contract não aparecem nominalmente na V1. Operation e Unit oferecem o contexto necessário.
Se uma operação provar que a marca do cliente é necessária para localizar o trabalho, isso deve
ser um requisito explícito e uma projeção controlada, não a liberação do agregado Client.

## 11. Auditoria

O ledger existente continua único. Ações do Worker escrevem `audit_events` na mesma transação da
ação de domínio.

Distinções mínimas:

- **Auth User:** `actor_user_id = auth.uid()` referenciando `profiles`;
- **Worker:** `metadata.actor_worker_id` com o UUID resolvido pelo banco;
- **superfície/origem:** `metadata.actor_surface = 'worker_app'` e `source = 'app'`;
- **ação operacional:** `record_arrival` ou `record_departure` na entidade `presence`;
- **correlação:** `source_reference` e, quando seguro, a chave/ID do recibo idempotente;
- **contexto:** `schedule_entry_id`, `actual_assignment_id` e `replacement_id` já presentes no
  estado auditado, sem copiar PII.

Metadata é adequada para `actor_worker_id`/superfície porque o schema atual já reserva JSON para
metadados variáveis de auditoria. Se consultas de auditoria por Worker demonstrarem volume que
justifique coluna/index dedicado, isso pode evoluir depois.

Também são auditadas pelos contratos implementados de WorkerAccess:

- criação/revogação/expiração/claim de convite;
- ativação, suspensão, retomada e revogação de vínculo;
- tentativas administrativas de reassociação que resultem em mudança válida.

Falhas de autenticação, rate limit e tentativas negadas vão para logs de segurança estruturados;
não devem poluir o ledger de negócio a cada UUID inválido. A UI Worker nunca lê `audit_events`.

Presence não ganha ledger de batidas. `source_reference` e recibos de idempotência não são uma
segunda auditoria.

## 12. Superfície técnica e UX

### 12.1 Decisão de superfície

V1 é uma área mobile-first no mesmo Next.js/App Router:

- mesmo repositório, deploy, Supabase Auth, banco e módulos de domínio;
- route group e layout próprios;
- módulos próprios `worker-access`, `worker-schedule` e `worker-presence` para identidade e casos
  de uso;
- nenhuma dependência da navegação, layout ou OperationalContext do Backoffice;
- componentes visuais podem compartilhar primitives, não fluxos administrativos.

Não criar aplicação separada agora: duplicaria deploy, configuração Auth, observabilidade e
contratos antes de existir escala de produto que justifique. Não criar app nativo antes de haver
requisito de hardware, distribuição, background ou offline.

PWA instalável pode ser uma evolução pequena após o piloto, mas não deve prometer funcionamento
offline. Service worker, fila local de Presence e reconciliação são outra capacidade e ficam fora
da V1. A arquitetura de idempotência deixa esse caminho aberto.

### 12.2 Rotas implementadas

```text
/worker/sign-in
/worker/claim
/worker/set-password     criação inicial de senha, em layout isolado
/worker/forgot-password
/worker/reset-password
/worker                 Home / hoje e próximo
/worker/schedule        escala oficial própria
/worker/schedule/[entryId]
/worker/history         Presence própria
/worker/account
/worker/account/password alteração de senha, no layout Worker normal
```

`/worker` fica em layout autenticado próprio. `/worker/sign-in` e `/worker/claim` ficam fora
desse layout. A rota raiz atual não deve redirecionar todo usuário autenticado automaticamente
para `/app`; a resolução deve respeitar a superfície acessada ou oferecer entrada explícita para
Backoffice e Worker.

### 12.3 Home mínima

A Home responde em primeiro viewport:

1. **Onde?** Operation, Unit e endereço quando disponível.
2. **Quando?** “agora” ou próxima data/horário na timezone da Unit.
3. **Qual posto?** `JobRole.name`.
4. **Substituição?** “Você está como substituto” ou “você foi substituído”, sem identificar
   terceiros.
5. **Presence?** não iniciada, presente ou concluída.
6. **Próxima ação?** CTA único: ver detalhes, registrar chegada, registrar saída ou nenhuma ação.

Se não houver jornada atual, o card principal mostra a próxima. Se não houver próxima, informa
isso sem sugerir ausência ou falta de Assignment. Um aviso discreto mostra quando a escala
oficial relevante foi atualizada. Navegação inferior máxima: Início, Escala, Histórico e Conta.

Estados de loading, retry, sessão expirada, acesso suspenso e conflito após ação precisam ser
explícitos. O botão fica temporariamente desabilitado no envio, mas idempotência no banco é a
proteção real contra duplo toque/retry.

## 13. Threat model

| Ameaça | Proteção no banco | Proteção no app/operação |
| --- | --- | --- |
| Worker abre ScheduleEntry alheia | RPC resolve Worker por `auth.uid()`, filtra propriedade/papel e retorna resposta não enumerável | valida UUID, usa DTO estreito e não mantém dados de terceiros no client |
| Troca manual de UUID | UUID nunca é autoridade; ownership é refeito em toda RPC | rota trata alheio como não encontrado, sem mensagens reveladoras |
| Worker de outra Organization | Organization é derivada do Worker; joins exigem a mesma Organization; RLS base continua negando SELECT direto | nenhuma seleção/cookie de Organization no Worker |
| Conta vinculada ao Worker errado | convite forte + OTP + claim atômico + unicidades + vínculo imutável; correção por revogação | seleção administrativa explícita, exibição confirmatória mínima e processo de recuperação |
| E-mail/telefone conhecido por terceiro | contato isolado não cria vínculo; token de convite e OTP são necessários | rate limit, CAPTCHA quando aplicável, expiração e mensagens não enumeráveis |
| Usuário desligado | helper exige link, Worker e Organization ativos em toda chamada; terminated revoga vínculo | layout revalida no servidor e mostra acesso encerrado |
| Assignment encerrada/suspensa | não autoriza nova chegada; Presence já iniciada só pode ser completada pelo Worker efetivo | UI remove CTA após recarregar o estado oficial |
| Replacement cancelada/trocada | locks e resolução efetiva na mesma transação; cancelamento com Presence válida já é bloqueado pela 6A | app recarrega após conflito e não confia em cache para escrever |
| Replay/duplo toque | recibo idempotente, hash canônico, unicidade de source reference e uma Presence válida por entrada | chave persiste até resposta terminal; botão desabilitado é apenas UX |
| Chamada direta às RPCs internas | `private.require_organization_permission` exige membership/permission; Worker não é member | Worker services não expõem organization/worker/source/time |
| Chamada direta às RPCs Worker | EXECUTE exige authenticated; cada RPC resolve vínculo e recurso novamente | sessão por cookie seguro e ações server-side quando possível |
| Vazamento de outros Workers | sem policies amplas; projeções não retornam nomes/IDs de terceiros | tipos/DTOs próprios, sem reuso do read model do Supervisor |
| Enumeração de IDs/contas | resposta uniforme para inexistente/alheio; sem listagem geral; rate limit em claim/login | logs estruturados e alerta por padrão abusivo, sem detalhes na resposta |
| JWT antigo após revogação | banco consulta link/status atuais em toda operação | refresh/logout complementam, mas não são a barreira principal |
| Timestamp forjado | RPC Worker usa relógio do banco e não aceita horário do cliente | UI apenas mostra o instante confirmado pelo servidor |
| CSRF/reenvio de ação | mutação exige sessão válida, autorização por recurso e idempotência | cookies seguros, origem esperada e práticas do boundary server-side |

IDs opacos reduzem descoberta casual, mas não substituem autorização. Segurança crítica vive no
banco; esconder botão, validar rota ou filtrar em React nunca é controle suficiente.

## 14. Compatibilidade e evolução

As migrations aplicadas são imutáveis e toda evolução continua ocorrendo por novas migrations.
O checkpoint da Fase 7 mantém implementados: convite e vínculo históricos, RLS e privilégios,
administração auditada, claim token-based e tokenless, `private.require_worker_access()`, read
models próprios, wrappers Worker de Presence, revogação no desligamento, auditoria e tipos
gerados. A limpeza de contratos mortos também deve ocorrer por migration aditiva.

Continua não sendo necessário:

- alterar migrations antigas;
- adicionar role `WORKER` a `organization_members`;
- mudar invariantes de Schedule/Revision/Entry;
- adicionar Worker/Organization à Presence ou ScheduleEntry;
- mudar `Presence.actual_assignment_id`;
- adicionar estados a Absence/Replacement/Presence;
- liberar SELECT direto nas tabelas operacionais;
- criar principal técnico genérico de integração.

As RPCs Worker aplicam regras de autosserviço mais restritas (status do acesso, Worker,
Assignment e janela temporal) sem modificar o que o Backoffice pode registrar pelo domínio 6A.
Isso separa autorização do canal de invariantes universais da Presence.

## 15. Roadmap da Fase 7

### 7A — Worker Identity & Access Foundation — implementada

Escopo:

- entidades de convite e vínculo;
- permission administrativa DIRECTOR-only;
- claim por e-mail OTP;
- `requireWorkerAccess` no app e `private.require_worker_access` no banco;
- suspensão, retomada, revogação e efeito de Worker/Organization inactive/terminated;
- layout/guard da superfície, ainda sem dados operacionais.

Critério de saída: uma conta convidada liga-se de forma auditável a exatamente um Worker, acessa
somente `/worker`, e perde acesso imediatamente por suspensão, revogação ou desligamento. Testes
reais cobrem claim repetido, conta/Worker já vinculados, token expirado, e-mail divergente,
outro tenant e chamada direta.

### 7B — Worker Today & Schedule — implementada

Escopo:

- read models estreitos de Home, escala, detalhe e histórico de atualização;
- resolução de original/substituto;
- somente revisão published oficial atual;
- tratamento explícito de Presence histórica e revisão superseded;
- rotas mobile-first e DTOs sem terceiros/Client/Contract;
- sinalização verdadeira de republicação, sem diff heurístico.

Critério de saída: o Worker responde “onde, quando, em qual posto e em qual papel devo atuar
agora/próximo?” sem conseguir consultar outro Worker, outro tenant ou estados internos de
Scheduling. Todos os casos A–E deste documento têm testes de autorização e projeção.

Contratos implementados:

- `get_worker_home()` retorna jornada atual, outra jornada própria de hoje e próxima jornada;
- `list_worker_schedule(from_date, to_date)` limita a consulta a 31 dias civis;
- `get_worker_schedule_entry(schedule_entry_id)` prova pertencimento antes de devolver detalhe;
- expectativa atual usa somente a revisão `published` de maior versão por Schedule;
- detalhe de revisão superseded só permanece acessível quando há Presence própria válida;
- classificação derivada: `original_expected`, `replacement_expected`, `original_absent`,
  `original_replaced`, `in_progress` ou `completed`;
- Presence `cancelled` não é projetada como realização;
- o hardening 7B.1 mantém Presence própria `present` como jornada atual mesmo quando sua revisão
  publicada foi substituída; ao concluir ou cancelar, somente a expectativa oficial vigente volta
  a alimentar a Home;
- sem `start` explícito, a escala deriva sua data civil da Unit operacional mais relevante
  (jornada atual, próxima ou passada mais recente); UTC é apenas fallback sem contexto de Unit;
- nomes e IDs de outros Workers, Client, Contract, notas e dados administrativos não integram
  os DTOs Worker.

### 7B.1 — Worker Schedule / Home consistency — implementada

Escopo:

- Presence própria `present` de revisão superseded continua sendo a jornada atual até sua saída;
- conclusão/cancelamento devolve a Home à expectativa oficial vigente;
- data inicial da escala deriva da timezone operacional mais relevante, com UTC apenas sem
  contexto de Unit.

Critério de saída: Home, escala e detalhe compartilham a mesma verdade sobre realização histórica
em andamento e data civil, sem reabrir expectativa superseded.

### 7C — Worker Presence — implementada

Escopo:

- wrappers Worker para chegada/saída no agregado 6A;
- identidade e tempo derivados no banco;
- `source = app`, `source_reference` e idempotência;
- janela operacional de chegada e saída aberta segura;
- auditoria com Auth User + Worker + superfície;
- testes de concorrência com Absence/Replacement e replay.

Critério de saída: somente o Worker efetivamente esperado registra sua própria chegada/saída,
com retry seguro e trilha única de auditoria, sem informar Organization/Assignment/Replacement ou
horário e sem contornar as invariantes da Fase 6A.

Contratos implementados:

- `worker_start_presence(schedule_entry_id, source_reference, idempotency_key)`;
- `worker_complete_presence(schedule_entry_id, idempotency_key)`;
- `get_worker_presence_action(schedule_entry_id)` retorna apenas `start`, `complete` ou `null`;
- `list_worker_presence_history(limit, cursor)` retorna somente Presence própria válida e sinais
  objetivos;
- relógio, identidade, Organization, Assignment efetiva, Replacement e origem são resolvidos no
  banco;
- o hash idempotente Worker exclui timestamps gerados no banco;
- a saída deriva `source_reference` da Presence aberta e pode ocorrer após fim, mudança de data
  civil, supersessão da revisão ou encerramento posterior da Assignment;
- Home e detalhe usam o mesmo controle de ação e revalidam as projeções no servidor.

### Checkpoint — Pilot Polish — implementado

Escopo entregue:

- navegação mobile com Hoje, Escala, Histórico e Conta;
- estados e microcopy operacionais consistentes para Home, detalhe e Presence;
- conta e logout dentro do boundary Worker;
- experiência controlada para acesso suspenso/revogado, sem converter erros inesperados em
  indisponibilidade;
- tela inicial de criação de senha isolada da navegação e alteração posterior dentro de Conta.

### Checkpoint — Worker Auth Hardening — implementado

Escopo entregue:

- claim próprio por `auth.uid()` sem exigir token na URL, preservando o deep-link com token;
- OTP de oito dígitos para primeiro acesso e fallback, sempre com `shouldCreateUser = false` no
  login;
- e-mail + senha como login recorrente principal, senha mínima de oito caracteres e recovery do
  Supabase com resposta não enumerável;
- primeiro acesso identificado pela ausência de qualquer `worker_access_links` histórico e
  direcionado à criação inicial de senha;
- reativação identificada por vínculo histórico, inclusive `revoked`, sem exigir nova senha;
- `/worker/set-password` em layout isolado para onboarding e `/worker/account/password` no layout
  Worker para alteração voluntária.

### 7D — Change Awareness / Acknowledgement — planejada/condicional

Escopo inicial possível:

- marcação “visto até a revisão publicada X” por Worker;
- lista de atualizações oficiais relevantes;
- acknowledgement explícito apenas se houver consequência operacional validada;
- e-mail simples como canal opcional, sem motor genérico de notificações.

Antes de implementar, decidir se ciência é informativa ou obrigatória, qual revisão/entrada é
reconhecida, efeito de nova publicação, prazo e responsabilidade por não ciência. Se diff exato
for necessário, modelar lineage estável de ScheduleEntry em nova migration; não inferir edição
por proximidade de horário.

Critério de saída: quando priorizada, a equipe consegue provar qual publicação relevante foi
vista/reconhecida por qual Worker, sem alterar o lifecycle de ScheduleRevision. Push, WhatsApp,
offline e confirmação jurídica continuam fora.

A V1 de valor operacional termina em 7C. A 7B já mostra a publicação atual e avisa que houve
republicação; 7D só entra após o piloto comprovar necessidade de ciência persistida.

## 16. Fora da V1

- folha de pagamento, holerite, recibos e integrações de payroll;
- espelho de ponto, banco de horas, horas extras e cálculos trabalhistas;
- sistema legal de ponto, múltiplas batidas e intervalo realizado;
- tolerância global, arredondamento ou punição de atraso;
- geolocalização, geofence, rota, biometria, selfie e antifraude;
- chat, feed social, chamados, tarefas, checklists e fotos;
- documentos, atestados, benefícios, EPI e férias;
- informar ausência ou editar/cancelar Absence;
- solicitar, escolher, aceitar ou recusar Replacement/convocação;
- marketplace de turnos, oportunidades e troca de jornada;
- dados de colegas, lista da equipe ou contato de substituto;
- Client/Contract e informações comerciais;
- notificações push/WhatsApp complexas;
- acknowledgement obrigatório antes da decisão da 7D;
- PWA/offline-first, fila de eventos, sincronização e conflito offline;
- aplicação separada, app nativo ou microserviço;
- integrações genéricas, principal técnico genérico, webhooks e adapters;
- novas roles dinâmicas, IAM por Unit/Operation ou `WORKER` em membership;
- relatórios globais, auditoria administrativa e KPIs do Backoffice;
- qualquer inferência automática de Absence/no-show pela falta de Presence.

## 17. Invariantes resumidas

1. Auth User, profile, organization member e Worker são conceitos distintos.
2. Worker access nunca concede membership ou permission interna.
3. Um principal Worker corrente resolve para um único Worker e uma única Organization, sem
   seleção do cliente.
4. Toda leitura/mutação prova o recurso contra o Worker resolvido no banco.
5. Somente publicação oficial atual cria expectativa; histórico superseded não volta a ser
   acionável.
6. Original com Absence reportada não pode registrar Presence; substituto só pode quando sua
   Replacement está ativa.
7. Presence histórica pertence a quem consta em `actual_assignment_id`, independentemente de
   publicação posterior.
8. O Worker nunca fornece sua identidade, contexto operacional ou timestamps à Presence.
9. Retry igual é idempotente; replay divergente é conflito.
10. Nenhum dado de outro Worker ou informação comercial é necessário para cumprir a jornada.
11. Worker inactive/terminated, link não ativo ou Organization inativa nega acesso em cada
    request, mesmo com JWT válido.
12. Correção/cancelamento, Absence e Replacement continuam sob controle do Backoffice na V1.
13. Auditoria distingue Auth User, Worker, app e ação sem duplicar o ledger de Presence.
14. Ausência de Presence continua sendo desconhecido, nunca ausência automática.
