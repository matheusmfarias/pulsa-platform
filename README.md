# Pulsa Platform

Foundation Core da plataforma operacional da Pulsa, construída com Next.js, TypeScript,
Tailwind CSS e Supabase.

## Desenvolvimento local

Requisitos: Node.js 24 e npm.

1. Instale as dependências com `npm ci`.
2. Copie `.env.example` para `.env.local` e informe a URL e a publishable key do projeto Supabase.
3. Aplique as migrations e o seed com o fluxo de migrations do Supabase.
4. Inicie a aplicação com `npm run dev`.

O usuário de desenvolvimento deve ser criado no Supabase Auth. Para obter acesso
organizacional, crie o `profile` correspondente ao UUID de `auth.users` e uma associação
ativa em `organization_members`, com um dos roles internos válidos. Use `DIRECTOR` para o
usuário principal de desenvolvimento. O seed não cria credenciais nem dados pessoais.

Os fluxos internos atuais exigem exatamente uma `organization_members` ativa para o usuário.
Ausência ou ambiguidade de organização gera um erro explícito no servidor. A autorização
por permission é aplicada pelos services; RLS continua responsável pelo isolamento.

## Tipos do Supabase

`src/shared/db/database.types.ts` mantém temporariamente o schema mínimo tipado. Quando o
Supabase local estiver disponível, regenere o arquivo pelo fluxo oficial:

```bash
npx supabase gen types typescript --local > src/shared/db/database.types.ts
```

Para um projeto de desenvolvimento vinculado, use `--project-id` no lugar de `--local`.
Revise o diff do arquivo gerado junto com cada migration. Não gere tipos a partir de produção
para aplicar mudanças não validadas.

## Validação

- `npm run lint`
- `npm run typecheck`
- `npm run test`
- `npm run build`
- `npm run e2e` (requer o navegador Chromium do Playwright)

O teste E2E incluído cobre somente a renderização pública do login. Um teste de autenticação
real depende de um projeto Supabase isolado e credenciais de teste, por isso não faz parte da
CI nesta fase.

## Testes de integração reais

Os testes de integração reais exigem configuração explícita e não usam o projeto Supabase
linkado, `.env` nem o CLI para descobrir credenciais. Configure um projeto Supabase de teste
isolado ou uma instância local, nunca produção:

```bash
SUPABASE_TEST_URL=...
SUPABASE_TEST_PUBLISHABLE_KEY=...
SUPABASE_TEST_SERVICE_ROLE_KEY=...
SUPABASE_TEST_CONFIRMATION=integration-test
```

Com as quatro variáveis definidas, execute o script necessário, por exemplo:

```bash
npm run test:assignment:real
npm run test:audit:real
npm run test:history:real
npm run test:rbac:real
npm run test:administration:real
```

## Administração

As rotas `/app/admin/users` e `/app/admin/audit` são exclusivas de memberships `DIRECTOR` ativas.
Roles e permissions permanecem fixos no código e no PostgreSQL. A aplicação não usa service-role
para consultar auditoria ou `auth.users`; por isso, e-mails de outros membros não são exibidos
nesta fase.

## CI

O GitHub Actions executa `npm ci`, lint, typecheck, unit tests e build. Os testes reais de
integração não fazem parte do pipeline nesta fase e continuam exigindo ambiente de teste explícito.
