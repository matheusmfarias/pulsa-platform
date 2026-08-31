# Pulsa Platform
## MVP v0.2

Status: Planning

---

# Objetivo

Permitir administrar digitalmente uma operação básica da Pulsa do cadastro do cliente ao acompanhamento operacional.

O MVP deve provar o domínio, não a amplitude do produto.

---

# Fluxo alvo

CLIENTE  
↓  
CONTRATO  
↓  
OPERAÇÃO  
↓  
UNIDADES  
↓  
POSTOS  
↓  
PESSOAS  
↓  
ALOCAÇÕES  
↓  
[DISCOVERY OPERACIONAL]  
↓  
ESCALAS  
↓  
PRESENÇA / FALTA  
↓  
OCORRÊNCIAS  
↓  
DASHBOARD

---

# FASE 0 — Documentation & Architecture

- PRODUCT.md
- DOMAIN.md
- ARCHITECTURE.md
- MVP_V0_3.md
- PROJECT_CONTEXT.md
- CODING_RULES.md
- DECISIONS.md

---

# FASE 1 — Foundation Core

Implementar:

- projeto;
- autenticação básica;
- migrations;
- estrutura modular;
- padrões de erro;
- configuração de ambiente;
- base de logging;
- CI mínimo.

Não implementar ainda:

- RBAC completo;
- auditoria completa;
- portal de cliente;
- permissões externas.

---

# FASE 2 — Clients

Implementar:

- cadastro;
- edição;
- visualização;
- ativação/desativação;
- listagem.

---

# FASE 3 — Contracts

Implementar:

- criação;
- edição;
- associação ao cliente;
- período;
- status;
- visualização.

Não implementar:

- assinatura eletrônica;
- geração jurídica;
- faturamento.

---

# FASE 4 — Operations

Implementar:

- criação;
- vínculo com contrato;
- gestor responsável;
- ciclo de status;
- visualização.

---

# FASE 5 — Units + Positions

Implementar:

- unidades;
- postos/funções;
- headcount base;
- status.

A plataforma deve conseguir responder:

- Quais unidades existem?
- Quais postos cada unidade possui?
- Qual a necessidade estrutural de cada posto?

---

# FASE 6 — Workers

Implementar cadastro operacional mínimo:

- nome;
- documento;
- contato;
- status;
- início/fim do vínculo operacional quando aplicável.

Não implementar:

- folha;
- benefícios;
- medicina ocupacional completa;
- banco documental complexo.

---

# FASE 7 — RBAC + Audit

Implementar:

- organization_members;
- roles;
- permissions;
- matriz role → permission;
- checagem centralizada de autorização;
- audit_events;
- previous_state/new_state;
- logging das mutações críticas.

---

# FASE 8 — Assignments

Implementar:

- worker;
- position;
- período;
- status;
- histórico;
- invariantes contra estados inválidos.

A plataforma deve conseguir responder:

**Quem está alocado onde?**

---

# GATE — Operational Discovery

Antes de Scheduling, validar:

- modelo real de escala;
- recorrência;
- múltiplas unidades;
- múltiplas operações;
- substituição;
- cobertura;
- absenteísmo;
- intervalos;
- relação com ponto;
- papel do supervisor.

Scheduling não deve ser implementado por hipótese.

---

# FASE 9 — Scheduling

Após discovery:

- Shift;
- ShiftPosition;
- ShiftAssignment;
- necessidade por função/posto;
- cobertura do turno.

A plataforma deve conseguir responder:

**Quem deveria estar trabalhando?**

---

# FASE 10 — Attendance

Implementar registro operacional:

- presente;
- ausente;
- atraso;
- ausência justificada.

A plataforma deve conseguir responder:

**Quem realmente trabalhou?**

---

# FASE 11 — Occurrences

Implementar:

- abertura;
- tipo;
- severidade;
- responsável;
- descrição;
- resolução;
- histórico.

Substituição automatizada permanece fora do MVP.

---

# FASE 12 — Dashboard

Mostrar:

- headcount base;
- headcount alocado;
- cobertura;
- postos descobertos;
- ausências;
- ocorrências abertas.

Filtros:

- cliente;
- operação;
- unidade;
- período.

KPIs calculados on-demand inicialmente.

---

# Seed data

Manter script de seed incremental com dados realistas e fictícios:

- 1 organização;
- 1 cliente;
- 1 contrato;
- 1 operação;
- 3 unidades;
- 5+ positions;
- 10+ workers;
- assignments;
- após discovery, 1 semana de shifts;
- attendance;
- ocorrências.

Nenhum dado pessoal real deve ser usado em ambientes de desenvolvimento sem necessidade e autorização.

---

# Critérios de conclusão

O MVP é considerado concluído quando conseguimos administrar:

- 1 cliente;
- 1 contrato;
- 1 operação;
- 3+ unidades;
- postos reais;
- workers;
- assignments;
- uma semana de escalas;
- presença/faltas;
- ocorrências;

e os indicadores exibidos forem derivados corretamente desses dados.

---

# Não objetivos

O MVP não precisa:

- estar pronto para venda como SaaS;
- atender todos os serviços da Pulsa;
- eliminar todos os sistemas externos;
- possuir IA;
- possuir app mobile;
- substituir folha/ponto;
- automatizar todas as substituições.

Objetivo: validar o core operacional.
