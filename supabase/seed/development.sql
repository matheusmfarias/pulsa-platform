-- Clearly fictitious, non-sensitive development data.
insert into public.organizations (id, legal_name, trade_name, status)
values (
  '00000000-0000-4000-8000-000000000001',
  'Pulsa Ambiente de Desenvolvimento Ltda.',
  'Pulsa Dev',
  'active'
)
on conflict (id) do update
set
  legal_name = excluded.legal_name,
  trade_name = excluded.trade_name,
  status = excluded.status,
  updated_at = now();

-- Generated test document. It is structurally valid and is not sourced from a real client.
insert into public.clients (
  id,
  organization_id,
  legal_name,
  trade_name,
  document_number,
  status
)
values (
  '00000000-0000-4000-8000-000000000101',
  '00000000-0000-4000-8000-000000000001',
  'Pulsa Teste Cliente Ltda.',
  'Cliente Exemplo',
  '11222333000181',
  'active'
)
on conflict (organization_id, document_number) do update
set
  legal_name = excluded.legal_name,
  trade_name = excluded.trade_name,
  status = excluded.status,
  updated_at = now();

insert into public.contracts (
  id,
  client_id,
  name,
  start_date,
  end_date,
  status,
  external_reference
)
values (
  '00000000-0000-4000-8000-000000000201',
  '00000000-0000-4000-8000-000000000101',
  'Contrato de Desenvolvimento',
  '2026-01-01',
  null,
  'active',
  'DEV-CONTRACT-001'
)
on conflict (id) do update
set
  client_id = excluded.client_id,
  name = excluded.name,
  start_date = excluded.start_date,
  end_date = excluded.end_date,
  status = excluded.status,
  external_reference = excluded.external_reference,
  updated_at = now();

insert into public.operations (
  id,
  contract_id,
  name,
  description,
  start_date,
  end_date,
  status,
  manager_user_id
)
values (
  '00000000-0000-4000-8000-000000000301',
  '00000000-0000-4000-8000-000000000201',
  'Operação de Desenvolvimento',
  'Operação fictícia para validação do ambiente de desenvolvimento.',
  '2026-01-01',
  null,
  'planning',
  null
)
on conflict (id) do update
set
  contract_id = excluded.contract_id,
  name = excluded.name,
  description = excluded.description,
  start_date = excluded.start_date,
  end_date = excluded.end_date,
  status = excluded.status,
  manager_user_id = excluded.manager_user_id,
  updated_at = now();

insert into public.units (
  id, operation_id, name, code, address, city, state, timezone, status
)
values
  (
    '00000000-0000-4000-8000-000000000401',
    '00000000-0000-4000-8000-000000000301',
    'Unidade Centro',
    'CENTRO',
    'Rua Fictícia, 100',
    'São Paulo',
    'SP',
    'America/Sao_Paulo',
    'active'
  ),
  (
    '00000000-0000-4000-8000-000000000402',
    '00000000-0000-4000-8000-000000000301',
    'Unidade Norte',
    'NORTE',
    null,
    'São Paulo',
    'SP',
    'America/Sao_Paulo',
    'active'
  ),
  (
    '00000000-0000-4000-8000-000000000403',
    '00000000-0000-4000-8000-000000000301',
    'Unidade Sul',
    'SUL',
    null,
    'São Paulo',
    'SP',
    'America/Sao_Paulo',
    'active'
  )
on conflict (id) do update
set
  operation_id = excluded.operation_id,
  name = excluded.name,
  code = excluded.code,
  address = excluded.address,
  city = excluded.city,
  state = excluded.state,
  timezone = excluded.timezone,
  status = excluded.status,
  updated_at = now();

insert into public.job_roles (
  id, organization_id, name, description, status
)
values
  ('00000000-0000-4000-8000-000000000451', '00000000-0000-4000-8000-000000000001', 'Supervisor Operacional', null, 'active'),
  ('00000000-0000-4000-8000-000000000452', '00000000-0000-4000-8000-000000000001', 'Promotor', null, 'active'),
  ('00000000-0000-4000-8000-000000000453', '00000000-0000-4000-8000-000000000001', 'Repositor', null, 'active'),
  ('00000000-0000-4000-8000-000000000454', '00000000-0000-4000-8000-000000000001', 'Líder de Equipe', null, 'active'),
  ('00000000-0000-4000-8000-000000000455', '00000000-0000-4000-8000-000000000001', 'Auxiliar Operacional', null, 'active')
on conflict (id) do update
set
  organization_id = excluded.organization_id,
  name = excluded.name,
  description = excluded.description,
  status = excluded.status,
  updated_at = now();

insert into public.positions (
  id, unit_id, job_role_id, description, base_required_headcount, status
)
values
  (
    '00000000-0000-4000-8000-000000000501',
    '00000000-0000-4000-8000-000000000401',
    '00000000-0000-4000-8000-000000000451',
    'Posto estrutural de supervisão.',
    1,
    'active'
  ),
  (
    '00000000-0000-4000-8000-000000000502',
    '00000000-0000-4000-8000-000000000401',
    '00000000-0000-4000-8000-000000000452',
    'Posto estrutural de promoção.',
    4,
    'active'
  ),
  (
    '00000000-0000-4000-8000-000000000503',
    '00000000-0000-4000-8000-000000000402',
    '00000000-0000-4000-8000-000000000453',
    null,
    3,
    'active'
  ),
  (
    '00000000-0000-4000-8000-000000000504',
    '00000000-0000-4000-8000-000000000402',
    '00000000-0000-4000-8000-000000000454',
    null,
    1,
    'active'
  ),
  (
    '00000000-0000-4000-8000-000000000505',
    '00000000-0000-4000-8000-000000000403',
    '00000000-0000-4000-8000-000000000455',
    null,
    5,
    'active'
  )
on conflict (id) do update
set
  unit_id = excluded.unit_id,
  job_role_id = excluded.job_role_id,
  description = excluded.description,
  base_required_headcount = excluded.base_required_headcount,
  status = excluded.status,
  updated_at = now();

insert into public.workers (
  id, organization_id, full_name, document_number, email, phone, status,
  engagement_start_date, engagement_end_date
)
values
  ('00000000-0000-4000-8000-000000000601', '00000000-0000-4000-8000-000000000001', 'Pessoa Fictícia 01', '10000000108', 'worker01@example.invalid', null, 'active', '2026-01-05', null),
  ('00000000-0000-4000-8000-000000000602', '00000000-0000-4000-8000-000000000001', 'Pessoa Fictícia 02', '10000000280', 'worker02@example.invalid', null, 'active', '2026-01-05', null),
  ('00000000-0000-4000-8000-000000000603', '00000000-0000-4000-8000-000000000001', 'Pessoa Fictícia 03', '10000000361', null, '(11) 90000-0003', 'active', '2026-02-02', null),
  ('00000000-0000-4000-8000-000000000604', '00000000-0000-4000-8000-000000000001', 'Pessoa Fictícia 04', '10000000442', null, '(11) 90000-0004', 'onboarding', null, null),
  ('00000000-0000-4000-8000-000000000605', '00000000-0000-4000-8000-000000000001', 'Pessoa Fictícia 05', '10000000523', 'worker05@example.invalid', null, 'active', '2026-03-02', null),
  ('00000000-0000-4000-8000-000000000606', '00000000-0000-4000-8000-000000000001', 'Pessoa Fictícia 06', '10000000604', null, '(11) 90000-0006', 'inactive', '2026-01-12', '2026-07-31'),
  ('00000000-0000-4000-8000-000000000607', '00000000-0000-4000-8000-000000000001', 'Pessoa Fictícia 07', '10000000795', 'worker07@example.invalid', null, 'active', '2026-04-06', null),
  ('00000000-0000-4000-8000-000000000608', '00000000-0000-4000-8000-000000000001', 'Pessoa Fictícia 08', '10000000876', null, '(11) 90000-0008', 'onboarding', null, null),
  ('00000000-0000-4000-8000-000000000609', '00000000-0000-4000-8000-000000000001', 'Pessoa Fictícia 09', '10000000957', 'worker09@example.invalid', null, 'active', '2026-05-04', null),
  ('00000000-0000-4000-8000-000000000610', '00000000-0000-4000-8000-000000000001', 'Pessoa Fictícia 10', '10000001090', null, '(11) 90000-0010', 'terminated', '2026-01-05', '2026-06-30')
on conflict (id) do update
set
  organization_id = excluded.organization_id,
  full_name = excluded.full_name,
  document_number = excluded.document_number,
  email = excluded.email,
  phone = excluded.phone,
  status = excluded.status,
  engagement_start_date = excluded.engagement_start_date,
  engagement_end_date = excluded.engagement_end_date,
  updated_at = now();

insert into public.assignments (
  id, worker_id, position_id, start_date, end_date, status
)
values
  (
    '00000000-0000-4000-8000-000000000701',
    '00000000-0000-4000-8000-000000000601',
    '00000000-0000-4000-8000-000000000501',
    '2026-01-05',
    null,
    'active'
  ),
  (
    '00000000-0000-4000-8000-000000000702',
    '00000000-0000-4000-8000-000000000602',
    '00000000-0000-4000-8000-000000000502',
    '2026-09-15',
    null,
    'pending'
  ),
  (
    '00000000-0000-4000-8000-000000000703',
    '00000000-0000-4000-8000-000000000603',
    '00000000-0000-4000-8000-000000000503',
    '2026-02-02',
    '2026-08-31',
    'finished'
  )
on conflict (id) do update
set
  worker_id = excluded.worker_id,
  position_id = excluded.position_id,
  start_date = excluded.start_date,
  end_date = excluded.end_date,
  status = excluded.status,
  updated_at = now();
