# Pulsa Platform — Product Decisions

## Status

Documento de decisão de produto.

Este arquivo registra diretrizes funcionais e de produto que devem orientar a evolução do Pulsa Platform.

Ele não substitui:

- `docs/ARCHITECTURE.md`
- `docs/DOMAIN.md`
- `docs/DECISIONS.md`

Esses documentos continuam sendo a referência para arquitetura, domínio e decisões técnicas.

Este arquivo responde principalmente:

> O que o Pulsa pretende ser?
>
> Quais capacidades pertencem ao seu core?
>
> Em que ordem essas capacidades devem ser construídas?
>
> O que deve ser construído internamente e o que deve ser integrado?

---

# 1. Visão do produto

O Pulsa deve evoluir para uma plataforma operacional end-to-end capaz de acompanhar a jornada de trabalho desde a estruturação de uma operação até sua execução diária.

A visão de longo prazo é conectar:

```text
Cliente
↓
Contrato
↓
Operação
↓
Unidade
↓
Posto
↓
Colaborador
↓
Escala
↓
Presença
↓
Execução
↓
Ocorrências
↓
Indicadores
↓
Automação

O objetivo não é apenas armazenar cadastros.

O sistema deve permitir à Pulsa responder, em tempo operacional, perguntas como:

Quantas pessoas deveriam estar trabalhando agora?
Quantas realmente estão?
Quem faltou ou atrasou?
Qual operação está descoberta?
Quem pode substituir uma pessoa ausente?
O supervisor já tomou alguma ação?
Quanto tempo levamos para recompor a operação?
Quais operações apresentam maior risco?
2. Princípio central de evolução

A visão é end-to-end.

A implementação não será feita de forma monolítica.

O produto será construído de forma modular e incremental.

Cada novo domínio deve:

resolver um problema operacional concreto;
possuir fonte de verdade bem definida;
produzir dados confiáveis;
integrar-se aos domínios anteriores;
existir antes das automações que dependam dele.

A ordem desejada é:

Registrar corretamente
        ↓
Enxergar corretamente
        ↓
Sugerir
        ↓
Automatizar

Inteligência Artificial não deve anteceder a estruturação correta do domínio e dos dados.

3. Núcleo estrutural atual

A fundação atual permanece válida:

Organization
├── Client
│   └── Contract
│       └── Operation
│           └── Unit
│               └── Position
│
├── JobRole
│
└── Worker
    └── Assignment → Position

Significados principais:

Organization representa o tenant proprietário dos dados.
Client representa um cliente da Pulsa.
Contract representa uma relação contratual com o cliente.
Operation representa uma operação concreta executada dentro de um contrato.
Unit representa um local/unidade operacional da operação.
JobRole representa um cargo reutilizável.
Position representa um posto operacional concreto dentro de uma unidade.
Worker representa uma pessoa disponível para atuação operacional.
Assignment representa a alocação temporal de um Worker a um Position.

As próximas capacidades devem reutilizar essa estrutura.

Não criar representações paralelas sem necessidade de domínio comprovada.

4. Worker não significa necessariamente empregado CLT

Worker representa uma pessoa que pode prestar trabalho em uma operação da Pulsa.

A modalidade do vínculo pode alterar significativamente o fluxo operacional.

Exemplo de trabalhador sujeito a controle de jornada:

Worker
↓
Escala
↓
Entrada
↓
Intervalo
↓
Saída
↓
Presença / atraso / ausência

Exemplo de prestador orientado a serviço:

Worker
↓
Oportunidade / convocação
↓
Aceite
↓
Ordem de serviço
↓
Execução
↓
Entrega

Consequentemente:

nem todo Worker obrigatoriamente terá registro de ponto;
nem todo Worker obrigatoriamente terá jornada da mesma forma;
modalidade de vínculo não deve ser inferida apenas a partir da existência de Worker.

Antes de implementar presença e frequência, o sistema deverá distinguir corretamente quais regras se aplicam a cada modalidade operacional.

5. Escala faz parte do core

Escala operacional será um domínio próprio do Pulsa.

Ela deve ser capaz, futuramente, de representar cenários como:

5x2;
6x1;
12x36;
intermitente;
contratação por hora;
escalas personalizadas;
visualização diária;
visualização semanal;
visualização por turno;
horários exatos;
turnos que atravessam a meia-noite;
intervalos;
escalas recorrentes;
escalas variáveis.

Um mesmo Worker poderá, conforme as regras da operação:

atuar em locais diferentes;
atuar para clientes diferentes;
ocupar diferentes postos/funções.

Escala não deve ser incorporada diretamente a Assignment.

Os conceitos devem permanecer separados:

Assignment responde:

Onde e em qual posto essa pessoa está operacionalmente vinculada?

Schedule deverá responder:

Quando essa pessoa está programada para trabalhar?

6. Regras podem variar por operação

O discovery confirmou que várias regras podem variar conforme cliente ou operação.

Exemplos:

forma de montagem da escala;
recorrência;
responsabilidade do supervisor;
quem aprova uma substituição;
tolerância de atraso;
regras específicas do cliente.

Portanto, evitar hardcode global de regras que possuam variação operacional real.

Pode surgir futuramente uma estrutura equivalente a:

Operation
└── OperationalSettings

Entretanto, não criar agora uma entidade genérica de configuração.

As configurações devem surgir somente quando existirem regras concretas e validadas que justifiquem sua existência.

7. Cobertura operacional

Cobertura passa a ser um conceito central do produto.

Uma operação pode ser considerada coberta quando possui as pessoas necessárias trabalhando conforme esperado.

No futuro, o sistema deve ser capaz de comparar:

Necessidade
vs.
Programação
vs.
Presença real

Exemplo:

Necessidade:      10
Escalados:        10
Presentes:         8
Ausentes:          2
Cobertura real:   80%

Hoje:

Position.base_required_headcount

representa somente a necessidade estrutural de efetivo.

E:

Assignments ativos

representam ocupação estrutural.

Esses conceitos não devem ser reinterpretados como presença ou cobertura temporal.

8. Ausência e substituição são capacidades prioritárias

Faltas, atrasos e atestados foram identificados como problemas operacionais relevantes.

A velocidade de recomposição de uma operação pode representar diferencial competitivo da Pulsa.

O fluxo futuro desejado é aproximadamente:

Ausência detectada/comunicada
        ↓
Impacto sobre cobertura
        ↓
Busca de possíveis substitutos
        ↓
Convocação
        ↓
Aceite / recusa
        ↓
Substituição confirmada
        ↓
Cobertura restabelecida

Foi mencionada como referência operacional a busca por substituição em aproximadamente 30 minutos.

Esse valor deve ser tratado inicialmente como:

objetivo;
indicador;
referência operacional.

Não deve ser transformado automaticamente em SLA rígido de sistema.

9. Banco de reserva / folguistas

A Pulsa pretende utilizar pessoas de reserva ou folguistas para cobertura de ausências.

Não criar antecipadamente uma entidade específica ReserveWorker.

A capacidade de atuar como reserva pode depender de:

disponibilidade;
cargo;
localização;
operação;
cliente;
modalidade contratual;
habilitações futuras.

O modelo deverá ser definido junto ao domínio de substituição.

10. Supervisor como usuário operacional

O supervisor é um usuário central da plataforma.

Sua principal necessidade não é navegar por cadastros.

Sua necessidade é responder rapidamente:

A minha operação está sob controle?

A visão operacional futura deve priorizar:

pessoas esperadas;
pessoas presentes;
faltas;
atrasos;
substituições em andamento;
comunicações relevantes;
tarefas pendentes;
problemas que exigem ação.

O Pulsa deve ser orientado a exceções operacionais.

A plataforma deve evidenciar problemas que exigem atenção em vez de exigir que o supervisor os procure manualmente.

11. Presença e frequência

O Pulsa precisará representar informações operacionais como:

trabalhou;
faltou;
entrada;
saída;
intervalos;
atraso;
saída antecipada.

Entretanto, representar presença operacional não significa necessariamente ser o sistema oficial de ponto.

12. Sistema de ponto

Diretriz atual:

O Pulsa deve coexistir e integrar-se com um sistema especializado de ponto.

Não existe decisão atual de construir um sistema completo de ponto eletrônico próprio.

A arquitetura esperada é:

Sistema de ponto
       ↓
Integração
       ↓
Pulsa
       ↓
Presença operacional
       ↓
Cobertura
Absenteísmo
Indicadores
Alertas

O fornecedor de ponto ainda não está definido.

Portanto, nenhuma integração específica deve ser implementada antes dessa decisão.

13. Presença operacional não é ponto eletrônico

Separar conceitualmente:

Registro trabalhista

Quando aplicável, poderá continuar sendo responsabilidade de sistema especializado.

Estado operacional

É responsabilidade do Pulsa compreender a situação da operação.

Exemplo:

João deveria estar trabalhando?
Sim.

João está presente?
Não.

Está atrasado?
Sim.

Existe substituição?
Não.

O Pulsa pode precisar conhecer esses estados mesmo quando a marcação formal estiver em sistema externo.

14. Absenteísmo

O discovery relaciona absenteísmo principalmente a:

faltas;
atrasos;
horas não produtivas.

Antes de implementar um indicador oficial de absenteísmo, deve existir uma definição matemática e de negócio única.

Não codificar fórmulas apenas com base em descrições conceituais.

15. Pulsa Worker

Existe visão de longo prazo para uma experiência digital destinada ao trabalhador/prestador.

Capacidades futuras identificadas:

visualizar oportunidades;
aceitar ou recusar convocações;
consultar escala;
consultar local;
consultar horário;
visualizar rota;
comunicar ausência;
enviar atestado;
realizar check-in/check-out quando aplicável;
registrar tarefas;
preencher checklists;
anexar fotos;
abrir chamados;
solicitar EPI;
acompanhar documentos;
consultar recibos/informações;
avaliar a experiência em determinada unidade.

Essa experiência deve ser tratada como superfície própria do ecossistema Pulsa.

Conceitualmente:

Pulsa Backoffice
Gestores / RH / Supervisores

          ↕

Pulsa Worker
Colaboradores / Prestadores

As duas superfícies podem compartilhar backend, domínio e banco de dados, mas devem respeitar jornadas e necessidades diferentes.

16. Execução operacional

O Pulsa não deve apenas compreender quem deveria estar trabalhando.

Futuramente deve ser capaz de acompanhar parte da execução realizada em campo.

Dependendo da operação, isso pode incluir:

tarefas;
checklists;
evidências;
fotos;
ordens de serviço;
conclusão de atividades;
ocorrências;
solicitações.

Exemplo:

Auxiliar de limpeza
↓
Unidade
↓
Turno
↓
Checklist diário
↓
Atividades executadas

Esse domínio deverá ser desenvolvido depois da fundação de escala/presença, salvo necessidade comercial priorizada posteriormente.

17. Comunicação

Diretriz de produto:

WhatsApp deve ser um canal, não a fonte de verdade da operação.

A visão é:

WhatsApp
App
Portal
E-mail
        ↓
Pulsa
        ↓
Registro operacional central

Interações relevantes devem futuramente gerar registro centralizado.

O histórico operacional não deve depender de busca manual em mensagens ou conversas externas.

18. Indicadores operacionais

Foram identificados como relevantes:

faltas;
atrasos;
cobertura;
absenteísmo;
turnover;
tempo de substituição;
prazo de admissão;
horas produtivas;
horas extras;
produtividade.

A existência desta lista não significa implementação imediata.

Um indicador só deve ser desenvolvido quando:

sua definição estiver acordada;
a fonte de dados necessária existir;
sua fórmula estiver definida;
sua utilidade operacional estiver clara.
19. Inteligência Artificial

IA faz parte da visão de longo prazo, mas não é foundation.

Possíveis aplicações identificadas:

Forecasting

Previsão de demanda considerando informações como:

vendas;
fluxo;
calendário;
campanhas.
Matching

Encontrar profissional:

próximo;
disponível;
habilitado.
No-show

Estimar risco de ausência.

Scheduling

Sugerir escala respeitando restrições de jornada e operação.

Attendance

Detectar inconsistências em registros de presença/ponto.

Documentos

Ler documentos e identificar vencimentos.

Ocorrências

Resumir situações operacionais para gestores/clientes.

Supervisão

Auxiliar na priorização ou otimização de rotas.

Margem

Identificar operações com risco financeiro ou perda de margem.

Essas capacidades são tecnicamente diferentes entre si.

Nem todas devem utilizar necessariamente LLM.

Podem envolver:

regras determinísticas;
algoritmos;
otimização;
geoprocessamento;
modelos estatísticos;
Machine Learning;
integrações;
LLM.

Cada caso deverá ser tratado individualmente.

20. Regra para automação e IA

Uma automação só deve ser desenvolvida quando existirem dados suficientes para medi-la e validá-la.

Exemplo:

Não faz sentido implementar:

Previsão de no-show

antes de existir histórico confiável de:

Escala
+
Presença
+
Ausência
+
Motivos
+
Resultado

Da mesma forma, não devemos automatizar geração de escala antes de possuir:

modelo correto de escala;
restrições;
disponibilidade;
regras de jornada;
regras da operação;
histórico suficiente.
21. Construir versus integrar

Ser end-to-end não significa construir internamente todos os sistemas especializados.

A diretriz é:

Construir

Quando a capacidade:

fizer parte do diferencial operacional da Pulsa;
depender profundamente do contexto operacional;
gerar vantagem competitiva;
precisar participar diretamente dos fluxos centrais.
Integrar

Quando:

já existir ferramenta especializada;
a capacidade não for diferencial;
a Pulsa precisar principalmente consumir os dados;
construir internamente gerar complexidade sem retorno proporcional.

Possíveis integrações futuras:

ponto;
folha;
pagamentos;
assinatura;
mapas/rotas;
comunicação;
documentos admissionais.

# Benchmark de mercado — plataformas de Field Service

Plataformas maduras de gestão de equipes externas demonstram que operações de campo normalmente envolvem duas superfícies principais:

- gestão/backoffice;
- experiência do trabalhador em campo.

Também são comuns capacidades como:

- planejamento de atividades;
- jornadas;
- check-in/check-out;
- geolocalização;
- tarefas e checklists;
- evidências fotográficas;
- ordens de serviço;
- roteirização;
- acompanhamento operacional em tempo real;
- alertas;
- indicadores;
- SLA;
- automações.

Essas referências validam a direção geral do Pulsa, mas não determinam sua arquitetura.

O Pulsa não pretende ser inicialmente uma plataforma horizontal/no-code para qualquer tipo de serviço de campo.

A preferência é construir um produto vertical e opinativo para a realidade operacional da Pulsa.

Os conceitos centrais devem refletir diretamente esse domínio.

A existência de funcionalidades em plataformas concorrentes/referências não implica sua inclusão automática no roadmap.

Cada capacidade permanece sujeita aos critérios de priorização deste documento.

## Experiência em campo e conectividade

A futura experiência Pulsa Worker deverá considerar que operações de campo podem ocorrer em locais com conectividade limitada ou instável.

Portanto, futuras funcionalidades críticas de execução em campo devem ser projetadas de forma compatível com eventual suporte a:

- operação offline;
- armazenamento local temporário;
- sincronização posterior;
- resolução segura de conflitos.

Isso é uma diretriz arquitetural futura e não implica implementação offline nas fases atuais.

22. Roadmap
Fase 1 — Foundation

Status: concluída.

Entregas principais:

domínio estrutural;
RBAC;
RLS;
boundaries de mutation;
auditoria;
proteção de histórico operacional.
Fase 2 — Operação utilizável

Status: concluída.

Entregas principais:

clientes;
contratos;
operações;
unidades;
cargos;
postos;
colaboradores;
alocações;
contexto operacional;
visão de ocupação estrutural.
Fase 3 — Administração

Status: concluída.

Entregas principais:

usuários;
memberships;
roles fixos;
gestão administrativa;
auditoria.
Fase 4 — Scheduling Foundation

Objetivo:

criar o primeiro domínio temporal de escala.

Deve permitir gradualmente:

escala;
horários;
turnos;
intervalos;
recorrência;
jornadas atravessando dias;
associação entre Worker e Position;
visualização diária;
visualização semanal.

Não implementar IA nesta fase.

Não implementar automaticamente legislação trabalhista complexa antes das regras serem definidas.

Fase 5 — Ausências e substituições

Objetivo:

permitir detectar, registrar e resolver indisponibilidade de pessoas.

Capacidades esperadas:

comunicação/registro de ausência;
impacto na cobertura;
identificação de possíveis substitutos;
convocação;
aceite;
recusa;
confirmação da substituição;
acompanhamento do tempo de reposição.
Fase 6 — Presença operacional

Objetivo:

comparar programação com realidade operacional.

Capacidades esperadas:

esperado versus realizado;
presente;
ausente;
atrasado;
saída antecipada;
integração preparada para sistema externo de ponto.

Não construir automaticamente um sistema completo de ponto eletrônico.

Fase 7 — Pulsa Worker

Objetivo:

criar a primeira experiência operacional do trabalhador.

Prioridades iniciais:

minha escala;
minhas oportunidades;
convocações;
comunicar ausência;
local;
horário.

Capacidades adicionais devem ser incorporadas posteriormente.

Fase 8 — Execução operacional

Objetivo:

registrar parte da execução real em campo.

Possíveis capacidades:

tarefas;
checklists;
fotos;
evidências;
ordens de serviço;
chamados;
solicitações.
Fase 9 — Inteligência operacional

Objetivo:

adicionar automações sobre dados reais produzidos pelas fases anteriores.

Primeiros candidatos:

sugestão de substituto;
alertas de risco operacional;
resumo de ocorrências;
análise de cobertura.

Capacidades mais avançadas ficam posteriores, como:

previsão de demanda;
previsão de no-show;
geração otimizada de escala;
roteirização;
análise preditiva de margem.
23. Fora do escopo imediato

Apesar de fazerem parte da visão futura, não implementar agora:

motor automático de escala;
previsão de demanda;
previsão de no-show;
sistema completo de ponto;
cálculo trabalhista;
folha de pagamento;
roteirização automática;
IA de margem;
automações completas de WhatsApp;
gestão completa de documentos;
gestão completa de EPI;
BI avançado;
aplicativo completo do colaborador;
permissions dinâmicas;
custom roles.

Esses itens permanecem registrados como possibilidades futuras.

24. Critério para entrada de uma nova feature

Toda nova demanda deve responder:

Qual problema operacional resolve?
Quem utiliza essa capacidade?
Quais dados são necessários?
Esses dados já existem?
A capacidade pertence ao core do Pulsa ou deveria ser integração?
Existe regra operacional suficientemente definida?
É necessária no momento atual ou é capacidade futura?
Qual dependência de módulos anteriores existe?

Uma ideia não entra automaticamente no desenvolvimento apenas por ser desejável.

25. Norte do produto

Diretriz principal:

O Pulsa deve ser a fonte central da realidade operacional da empresa: quem deveria estar onde, quem realmente está, o que precisa ser feito e quais situações exigem ação.

Esse princípio deve ser utilizado para avaliar novas funcionalidades e evitar expansão indiscriminada de escopo.

O Pulsa deve buscar amplitude operacional sem se transformar desnecessariamente em:

ERP financeiro completo;
sistema de folha;
relógio de ponto;
CRM genérico;
sistema documental genérico;
ferramenta genérica de comunicação.

A plataforma deve concentrar-se naquilo que representa a realidade e a inteligência operacional da Pulsa.