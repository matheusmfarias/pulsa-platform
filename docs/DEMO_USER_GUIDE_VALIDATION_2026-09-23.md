# Validação ponta a ponta do manual — 23/09/2026

## Escopo e dados

Validação manual, na interface de `localhost:3000`, usando somente cadastros
fictícios no ambiente de teste. Foi criado um cliente piloto, contrato,
operação, unidade, cargo, posto, duas pessoas e alocações. O percurso terminou
com uma conta Pulsa Worker ativa para uma dessas pessoas. Os cadastros de
demonstração permanecem no ambiente para revisão; não foram apagados.

## Fluxo concluído

1. Ativados contrato, operação, colaboradores e alocações. Essas transições
   são necessárias antes de usar as pessoas na escala.
2. Criada uma escala semanal, adicionada uma jornada e percorridas as etapas
   de envio, aprovação e publicação.
3. Registrada uma ausência para a jornada publicada e definida a segunda
   pessoa fictícia como substituta. A jornada manteve horário e posto.
4. No painel de Operações, registrada chegada e saída do substituto. O painel
   indicou chegada após o início e saída antes do fim programado.
5. Provisionado o acesso Worker, validado o código enviado por e-mail,
   confirmado o vínculo e definida a senha pela pessoa usuária.
6. No Pulsa Worker, conferidos Hoje, detalhe da jornada, Escala, Histórico e
   Conta. A pessoa originalmente escalada viu a jornada como coberta e não
   esperada; o histórico vazio corresponde a esse caso.
7. Para testar presença pelo Worker, criada e publicada a revisão 2 da escala,
   com uma jornada adicional de teste das 19h às 20h. Na revisão publicada, a
   jornada original das 14h às 18h apareceu novamente como escalada para a
   Pessoa Teste Jornada A. Chegada e saída foram registradas nela pelo Worker.
8. Aplicada a migration de continuidade no ambiente de teste. A revisão 2 voltou
   a mostrar a ausência e a cobertura. Criada, aprovada e publicada a revisão 3
   sem alterar as duas jornadas; ausência e substituição permaneceram visíveis.

## Validação de presença pelo Worker

Na primeira passagem, a jornada estava coberta e o Worker corretamente não
ofereceu ações de presença. Após a publicação da revisão 2, a tela Hoje mostrou
a jornada das 14h às 18h como escalada. O botão **Registrar chegada** criou uma
presença às 16:07; em seguida, **Registrar saída** concluiu a presença. O
Histórico exibiu o realizado como 16:07–16:07 e sinalizou chegada após o início
previsto e saída antes do fim. A precisão de minuto da interface faz os dois
horários parecerem iguais, embora a saída tenha sido posterior à chegada.

## Achado de domínio

A publicação da revisão 2 substituiu a revisão oficial 1. A ausência e a
cobertura registradas para a jornada da revisão 1 não apareceram na jornada
copiada da revisão 2; a Pessoa Teste Jornada A passou a poder registrar presença.
Isso permitiu concluir o teste Worker e revelou uma lacuna operacional.

A correção foi implementada no código e na migration
`20260923120000_schedule_absence_continuity.sql`: as revisões passam a carregar
uma referência à ausência original, as leituras de Worker e Operações passam a
resolvê-la, e a autorização de presença valida a cobertura herdada no banco. A
migration também repara as entradas da revisão publicada que correspondem à
mesma alocação e ao mesmo intervalo de uma entrada ancestral. O apontamento de
presença incompatível feito durante o teste continua no histórico de auditoria,
mas deixa de ser tratado como presença válida para a jornada atual.

A migration foi aplicada pelo responsável pelo ambiente de teste. Após a
aplicação, o Worker original viu a jornada das 14h às 18h como **Jornada
substituída**, sem ação de presença, e a jornada separada das 19h às 20h como
**Escalado**. No painel de Operações, a jornada das 14h às 18h esperava a Pessoa
Teste Jornada B como substituta da Pessoa Teste Jornada A; o apontamento
incompatível da revisão 2 não foi contado como presença válida da jornada atual.
A revisão 3 publicada manteve os mesmos estados no Worker, na escala do
Backoffice e no painel de Operações. O vínculo para o detalhe da ausência
continuou apontando para a ocorrência original.

Durante essa verificação, o detalhe da escala inicialmente falhou com `PGRST201`
porque a nova chave estrangeira tornou ambíguo o relacionamento entre
`schedule_entries` e `absences`. A consulta do repositório passou a nomear
explicitamente o vínculo direto e o vínculo herdado; o detalhe voltou a abrir
e mostrar a ausência e a substituta na revisão 3.

O bloqueio foi observado pela interface e pelos estados retornados ao Worker.
Não houve chamada direta à RPC de presença com a identidade Worker para testar
o erro autoritativo de forma isolada; a proteção correspondente está na migration
e segue coberta por teste de estrutura do contrato SQL.

A tentativa de criar uma segunda escala para a mesma operação e período foi
recusada por sobreposição. As revisões 1 e 2 continuam no histórico; a revisão 3
é a oficial e contém a jornada adicional de teste das 19h às 20h, ainda sem
presença.

## Melhorias incorporadas

- O manual agora inclui os estados necessários de contrato, operação,
  colaborador e alocação antes de montar a escala.
- O manual descreve o convite Worker, código, confirmação do vínculo e criação
  de senha, além do estado exibido quando uma jornada é coberta.
- O campo de gestor da operação passou a selecionar membros ativos pelo nome e
  papel, disponível somente a quem tem permissão para ler membros. Para os
  demais papéis, um gestor já definido é preservado sem expor o UUID.
- O fuso da unidade agora oferece regiões brasileiras com nomes e horários
  legíveis; unidades já configuradas com outro fuso mantêm esse valor.
- O e-mail cadastral aparece preenchido no convite Worker, ainda exigindo
  confirmação antes de enviar.
- A entrada da escala recebeu rótulos visíveis e acessíveis nos campos de
  horário; após salvar com sucesso, o diálogo fecha. Erros mantêm o formulário
  aberto e a edição mostra confirmação.
- No lifecycle da escala, atores aparecem por nome para Diretores, como “Você”
  quando for a própria pessoa, e como “Membro da equipe” quando o papel não
  permite consultar nomes de outros membros.
- O manual orienta restringir o contexto operacional ao cliente da demonstração
  para evitar confusão com outros registros da organização.

## Melhorias ainda recomendadas

- Os registros de teste antigos com datas fora do período atual continuam na
  organização. Não foram removidos para preservar o histórico; usar o seletor
  de contexto do cliente reduz o ruído. Uma limpeza de dados de teste deve ser
  planejada separadamente.
- A revisão 3 oficial ainda contém a jornada de teste das 19h às 20h, sem
  presença. Não foi removida para preservar o histórico da validação.
- Uma validação direta da RPC de início de presença pela pessoa originalmente
  escalada ainda pode complementar a verificação feita pela interface.

## Verificações de engenharia

- `npm run typecheck`: aprovado.
- `npm run lint`: aprovado.
- `npm test`: 80 arquivos e 355 testes aprovados após a correção de continuidade
  e o ajuste da consulta de ausências (verificação final desta entrega).
- `npm run build`: aprovado, incluindo compilação e verificação TypeScript do
  Next.js.
- `git diff --check`: aprovado; apenas avisos do Git sobre conversão de LF para
  CRLF no Windows.
- O manual em PDF foi renderizado e inspecionado visualmente, página por página;
  o documento tem nove páginas e não apresentou cortes ou problemas de layout.

Todos os fluxos principais do manual, incluindo chegada e saída pelo Worker,
foram exercitados. Os registros fictícios da demonstração foram mantidos no
ambiente de teste para revisão.
