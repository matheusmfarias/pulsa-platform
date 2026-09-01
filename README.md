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
