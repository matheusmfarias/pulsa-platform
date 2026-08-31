# Pulsa Platform
## Product Definition

Status: Draft v0.3  
Owner: Diretoria de TI  
Produto: Plataforma operacional da Pulsa

---

## 1. Visão

A Pulsa Platform será o sistema operacional digital da Pulsa.

Seu objetivo é concentrar em um único ecossistema os dados, processos e fluxos necessários para administrar clientes, contratos, operações, unidades, postos, pessoas, alocações, escalas, execução, ocorrências e indicadores de performance.

A plataforma não deve nascer como um ERP genérico.

Ela deve representar digitalmente o método operacional da Pulsa.

Premissa central:

**Pessoas + Operação + Performance.**

---

## 2. Problema

Operações intensivas em pessoas frequentemente dependem de processos fragmentados entre:

- planilhas;
- e-mail;
- WhatsApp;
- sistemas de RH;
- sistemas de ponto;
- documentos;
- relatórios manuais;
- controles mantidos por supervisores.

Essa fragmentação dificulta:

- conhecer a situação real da operação;
- identificar postos descobertos;
- controlar alocações;
- acompanhar absenteísmo;
- acompanhar turnover;
- monitorar SLAs;
- medir produtividade;
- gerar relatórios;
- manter rastreabilidade;
- escalar a operação.

A Pulsa pretende vender gestão operacional e performance. Portanto, precisa possuir capacidade tecnológica para sustentar essa promessa.

---

## 3. Objetivo do produto

Permitir que a Pulsa opere clientes de forma:

- padronizada;
- rastreável;
- mensurável;
- escalável;
- orientada a dados.

A plataforma deve permitir responder rapidamente perguntas como:

- Quantas pessoas deveriam estar trabalhando?
- Quantas estão efetivamente alocadas?
- Existem postos descobertos?
- Onde existem faltas?
- Qual operação apresenta maior absenteísmo?
- Qual cliente apresenta maior turnover?
- Quanto tempo levamos para repor uma necessidade?
- Quais SLAs estão em risco?
- Quais ocorrências continuam abertas?
- Onde a operação está perdendo eficiência?

---

## 4. Usuários

### Internos

#### Diretor
Visão consolidada do negócio e das operações.

#### Gestor de Operações
Administra clientes, contratos e operações.

#### Supervisor
Acompanha execução de campo, equipes, escalas e ocorrências.

#### RH
Administra informações relacionadas às pessoas.

#### Recrutador
Atua sobre necessidades de contratação.

#### Administrativo
Acessa informações necessárias para suporte operacional.

### Futuros usuários externos

#### Cliente
Acompanha exclusivamente suas operações e indicadores.

#### Colaborador
Consulta escala, informações e ações relacionadas à própria relação com a Pulsa.

Interfaces externas não fazem parte do MVP v0.1/v0.2, mas a arquitetura não deve impedir sua criação futura.

---

## 5. Jornada principal

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
Necessidade de pessoas  
↓  
Pessoa  
↓  
Alocação  
↓  
Escala  
↓  
Execução  
↓  
Ocorrência  
↓  
Indicadores  
↓  
Performance

---

## 6. MVP

O primeiro objetivo não é digitalizar toda a Pulsa.

O MVP deve provar uma jornada operacional completa.

### Jornada mínima

1. Cadastrar um cliente.
2. Criar um contrato.
3. Criar uma operação associada ao contrato.
4. Criar unidades da operação.
5. Definir postos/funções necessários.
6. Cadastrar pessoas.
7. Alocar pessoas nos postos.
8. Criar escalas após discovery operacional.
9. Registrar execução básica.
10. Registrar faltas ou ocorrências.
11. Visualizar indicadores básicos da operação.

---

## 7. Indicadores iniciais

O MVP deve permitir calcular de maneira confiável:

- headcount planejado;
- headcount alocado;
- cobertura da operação;
- postos descobertos;
- ausências;
- ocorrências abertas.

Turnover será incluído apenas quando o modelo temporal de vínculo estiver validado.

KPIs do MVP devem ser derivados dos dados operacionais, preferencialmente on-demand via SQL/views.

---

## 8. Fora do MVP

Não construir inicialmente:

- folha de pagamento;
- contabilidade;
- emissão fiscal;
- CRM completo;
- ERP financeiro;
- assinatura eletrônica;
- videoconferência;
- chat corporativo;
- BI avançado;
- aplicativo mobile nativo;
- IA generativa;
- sistema completo de recrutamento;
- cálculo trabalhista;
- controle formal de jornada;
- gestão completa de benefícios;
- workflow automatizado de substituição;
- motor completo de documentos trabalhistas.

Quando necessário, capacidades comoditizadas ou altamente regulatórias devem ser integradas a produtos especializados.

---

## 9. Princípio de produto

**Build the core. Integrate the commodity.**

Construir internamente aquilo que representa diferencial operacional da Pulsa.

Integrar soluções externas para capacidades comoditizadas ou altamente especializadas.

---

## 10. Evolução prevista

### Pulsa Core
Backoffice operacional interno.

### Pulsa Field
Experiência voltada a supervisores e gestores em campo.

### Pulsa Client
Portal para clientes acompanharem suas operações.

### Pulsa People
Experiência para colaboradores.

Todos devem compartilhar o mesmo domínio e backend quando tecnicamente adequado.

---

## 11. Critério de sucesso do MVP

O MVP estará validado quando uma operação real da Pulsa puder ser administrada dentro da plataforma sem depender de uma planilha paralela como fonte principal da verdade.

---

## 12. Regra fundamental

A plataforma deve refletir a operação real.

Nenhuma feature deve ser criada exclusivamente porque parece interessante.

Novas funcionalidades devem surgir de:

- necessidade operacional;
- requisito legal;
- requisito contratual;
- melhoria mensurável de eficiência;
- redução de risco;
- capacidade de escala;
- geração de valor ao cliente.

---

## 13. Gate de discovery operacional

O desenvolvimento pode avançar até Assignments sem assumir regras de scheduling.

Antes de implementar Scheduling, Attendance e KPIs derivados de escala, as regras reais de operação devem ser validadas com a equipe da Pulsa.

Não inventar:

- modelo de escala;
- regras de substituição;
- múltiplas unidades;
- múltiplas operações;
- definição de cobertura;
- definição de absenteísmo;
- regras específicas de temporário/intermitente.


---

## 14. Future domain candidates

The following concepts are intentionally NOT part of the current MVP, but must remain visible in the product backlog because benchmark research and the Pulsa operating model indicate they may become relevant:

- StaffingNeed;
- AdmissionProcess;
- TimeTrackingIntegration;
- Timesheet;
- ClientApproval;
- EmployeeRequest;
- NotificationIntegration.

These are candidates, not commitments.

Do not create tables, modules or abstractions for them until a concrete operational requirement exists.
