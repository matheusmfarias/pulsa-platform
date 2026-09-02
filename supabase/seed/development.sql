-- Clearly fictitious, non-sensitive, deterministic development data.
-- Document numbers are generated test values and are not sourced from real people or companies.

insert into public.organizations (id, legal_name, trade_name, status)
values ('00000000-0000-4000-8000-000000000001', 'Pulsa Ambiente de Desenvolvimento Ltda.', 'Pulsa Dev', 'active')
on conflict (id) do update set legal_name = excluded.legal_name, trade_name = excluded.trade_name, status = excluded.status, updated_at = now();

insert into public.clients (id, organization_id, legal_name, trade_name, document_number, status)
values
  ('00000000-0000-4000-8000-000000000101', '00000000-0000-4000-8000-000000000001', 'Vértice Varejo Fictício Ltda.', 'Vértice Varejo', '11222333000181', 'active'),
  ('00000000-0000-4000-8000-000000000102', '00000000-0000-4000-8000-000000000001', 'Horizonte Industrial Fictício S.A.', 'Horizonte Industrial', '22333444000109', 'active'),
  ('00000000-0000-4000-8000-000000000103', '00000000-0000-4000-8000-000000000001', 'Núcleo Serviços Fictícios Ltda.', 'Núcleo Serviços', '33444555000136', 'active')
on conflict (organization_id, document_number) do update set legal_name = excluded.legal_name, trade_name = excluded.trade_name, status = excluded.status, updated_at = now();

insert into public.contracts (id, client_id, name, start_date, end_date, status, external_reference)
values
  ('00000000-0000-4000-8000-000000000201', '00000000-0000-4000-8000-000000000101', 'Apoio operacional em lojas', '2025-01-01', null, 'active', 'DEV-VRT-001'),
  ('00000000-0000-4000-8000-000000000202', '00000000-0000-4000-8000-000000000102', 'Serviços de limpeza industrial', '2025-03-01', null, 'active', 'DEV-HZN-001'),
  ('00000000-0000-4000-8000-000000000203', '00000000-0000-4000-8000-000000000103', 'Apoio logístico e administrativo', '2025-06-01', null, 'active', 'DEV-NCL-001'),
  ('00000000-0000-4000-8000-000000000204', '00000000-0000-4000-8000-000000000103', 'Projeto de recepção encerrado', '2024-01-01', '2024-12-31', 'ended', 'DEV-NCL-LEG-001')
on conflict (id) do update set client_id = excluded.client_id, name = excluded.name, start_date = excluded.start_date, end_date = excluded.end_date, status = excluded.status, external_reference = excluded.external_reference, updated_at = now();

insert into public.operations (id, contract_id, name, description, start_date, end_date, status, manager_user_id)
values
  ('00000000-0000-4000-8000-000000000301', '00000000-0000-4000-8000-000000000201', 'Apoio de loja região metropolitana', 'Equipe fictícia de promoção, reposição e supervisão em lojas.', '2025-01-01', null, 'active', null),
  ('00000000-0000-4000-8000-000000000302', '00000000-0000-4000-8000-000000000202', 'Limpeza de unidades industriais', 'Equipe fictícia de limpeza para instalações industriais.', '2025-03-01', null, 'active', null),
  ('00000000-0000-4000-8000-000000000303', '00000000-0000-4000-8000-000000000203', 'Apoio logístico regional', 'Equipe fictícia de conferência e movimentação logística.', '2025-06-01', null, 'active', null),
  ('00000000-0000-4000-8000-000000000304', '00000000-0000-4000-8000-000000000203', 'Central administrativa compartilhada', 'Operação fictícia em implantação para suporte administrativo.', '2026-01-15', null, 'implementation', null)
on conflict (id) do update set contract_id = excluded.contract_id, name = excluded.name, description = excluded.description, start_date = excluded.start_date, end_date = excluded.end_date, status = excluded.status, manager_user_id = excluded.manager_user_id, updated_at = now();

insert into public.units (id, operation_id, name, code, address, city, state, timezone, status)
values
  ('00000000-0000-4000-8000-000000000401', '00000000-0000-4000-8000-000000000301', 'Loja Aurora Centro', 'AUR-CEN', 'Rua das Acácias, 120', 'São Paulo', 'SP', 'America/Sao_Paulo', 'active'),
  ('00000000-0000-4000-8000-000000000402', '00000000-0000-4000-8000-000000000301', 'Loja Aurora Norte', 'AUR-NOR', 'Avenida das Palmeiras, 455', 'São Paulo', 'SP', 'America/Sao_Paulo', 'active'),
  ('00000000-0000-4000-8000-000000000403', '00000000-0000-4000-8000-000000000301', 'Loja Aurora Campinas', 'AUR-CPS', 'Rua do Mercado, 88', 'Campinas', 'SP', 'America/Sao_Paulo', 'active'),
  ('00000000-0000-4000-8000-000000000404', '00000000-0000-4000-8000-000000000302', 'Planta Horizonte Leste', 'HZN-LES', 'Rodovia das Indústrias, km 12', 'Campinas', 'SP', 'America/Sao_Paulo', 'active'),
  ('00000000-0000-4000-8000-000000000405', '00000000-0000-4000-8000-000000000302', 'Planta Horizonte Sul', 'HZN-SUL', 'Avenida do Trabalho, 710', 'Curitiba', 'PR', 'America/Sao_Paulo', 'active'),
  ('00000000-0000-4000-8000-000000000406', '00000000-0000-4000-8000-000000000303', 'Centro Logístico Serra', 'NCL-SER', 'Estrada da Serra, 2500', 'Porto Alegre', 'RS', 'America/Sao_Paulo', 'active'),
  ('00000000-0000-4000-8000-000000000407', '00000000-0000-4000-8000-000000000303', 'Hub Logístico Vale', 'NCL-VAL', 'Rua dos Armazéns, 301', 'Curitiba', 'PR', 'America/Sao_Paulo', 'active'),
  ('00000000-0000-4000-8000-000000000408', '00000000-0000-4000-8000-000000000304', 'Central Administrativa Alfa', 'NCL-ADM', 'Avenida Central, 900', 'São Paulo', 'SP', 'America/Sao_Paulo', 'active'),
  ('00000000-0000-4000-8000-000000000409', '00000000-0000-4000-8000-000000000301', 'Loja Aurora Oeste', 'AUR-OES', 'Rua das Flores, 44', 'São Paulo', 'SP', 'America/Sao_Paulo', 'inactive'),
  ('00000000-0000-4000-8000-000000000410', '00000000-0000-4000-8000-000000000302', 'Base Horizonte Norte', 'HZN-NOR', 'Rua da Produção, 78', 'Campinas', 'SP', 'America/Sao_Paulo', 'active')
on conflict (id) do update set operation_id = excluded.operation_id, name = excluded.name, code = excluded.code, address = excluded.address, city = excluded.city, state = excluded.state, timezone = excluded.timezone, status = excluded.status, updated_at = now();

insert into public.job_roles (id, organization_id, name, description, status)
values
  ('00000000-0000-4000-8000-000000000451', '00000000-0000-4000-8000-000000000001', 'Supervisor Operacional', 'Coordenação operacional de campo.', 'active'),
  ('00000000-0000-4000-8000-000000000452', '00000000-0000-4000-8000-000000000001', 'Promotor de Vendas', 'Apoio à promoção e exposição de produtos.', 'active'),
  ('00000000-0000-4000-8000-000000000453', '00000000-0000-4000-8000-000000000001', 'Repositor', 'Reposição e organização de produtos.', 'active'),
  ('00000000-0000-4000-8000-000000000454', '00000000-0000-4000-8000-000000000001', 'Auxiliar de Limpeza', 'Limpeza e conservação de instalações.', 'active'),
  ('00000000-0000-4000-8000-000000000455', '00000000-0000-4000-8000-000000000001', 'Conferente', 'Conferência de recebimento e expedição.', 'active'),
  ('00000000-0000-4000-8000-000000000456', '00000000-0000-4000-8000-000000000001', 'Auxiliar Logístico', 'Movimentação e apoio logístico.', 'active'),
  ('00000000-0000-4000-8000-000000000457', '00000000-0000-4000-8000-000000000001', 'Assistente Administrativo', 'Suporte administrativo operacional.', 'active'),
  ('00000000-0000-4000-8000-000000000458', '00000000-0000-4000-8000-000000000001', 'Líder de Equipe', 'Liderança de equipes operacionais.', 'active')
on conflict (id) do update set organization_id = excluded.organization_id, name = excluded.name, description = excluded.description, status = excluded.status, updated_at = now();

insert into public.positions (id, unit_id, job_role_id, description, base_required_headcount, status)
values
  ('00000000-0000-4000-8000-000000000501', '00000000-0000-4000-8000-000000000401', '00000000-0000-4000-8000-000000000451', 'Supervisão estrutural da unidade.', 1, 'active'),
  ('00000000-0000-4000-8000-000000000502', '00000000-0000-4000-8000-000000000401', '00000000-0000-4000-8000-000000000452', 'Promoção estrutural da unidade.', 4, 'active'),
  ('00000000-0000-4000-8000-000000000503', '00000000-0000-4000-8000-000000000401', '00000000-0000-4000-8000-000000000453', 'Reposição estrutural da unidade.', 3, 'active'),
  ('00000000-0000-4000-8000-000000000504', '00000000-0000-4000-8000-000000000402', '00000000-0000-4000-8000-000000000452', 'Promoção estrutural da unidade.', 2, 'active'),
  ('00000000-0000-4000-8000-000000000505', '00000000-0000-4000-8000-000000000402', '00000000-0000-4000-8000-000000000453', 'Reposição estrutural da unidade.', 2, 'active'),
  ('00000000-0000-4000-8000-000000000506', '00000000-0000-4000-8000-000000000403', '00000000-0000-4000-8000-000000000458', 'Liderança estrutural da unidade.', 1, 'active'),
  ('00000000-0000-4000-8000-000000000507', '00000000-0000-4000-8000-000000000403', '00000000-0000-4000-8000-000000000452', 'Promoção estrutural da unidade.', 3, 'active'),
  ('00000000-0000-4000-8000-000000000508', '00000000-0000-4000-8000-000000000404', '00000000-0000-4000-8000-000000000454', 'Limpeza estrutural da planta.', 4, 'active'),
  ('00000000-0000-4000-8000-000000000509', '00000000-0000-4000-8000-000000000404', '00000000-0000-4000-8000-000000000451', 'Supervisão estrutural da planta.', 1, 'active'),
  ('00000000-0000-4000-8000-000000000510', '00000000-0000-4000-8000-000000000405', '00000000-0000-4000-8000-000000000454', 'Limpeza estrutural da planta.', 6, 'active'),
  ('00000000-0000-4000-8000-000000000511', '00000000-0000-4000-8000-000000000406', '00000000-0000-4000-8000-000000000455', 'Conferência estrutural do centro.', 3, 'active'),
  ('00000000-0000-4000-8000-000000000512', '00000000-0000-4000-8000-000000000406', '00000000-0000-4000-8000-000000000456', 'Apoio logístico estrutural do centro.', 4, 'active'),
  ('00000000-0000-4000-8000-000000000513', '00000000-0000-4000-8000-000000000407', '00000000-0000-4000-8000-000000000455', 'Conferência estrutural do hub.', 2, 'active'),
  ('00000000-0000-4000-8000-000000000514', '00000000-0000-4000-8000-000000000407', '00000000-0000-4000-8000-000000000456', 'Apoio logístico estrutural do hub.', 3, 'active'),
  ('00000000-0000-4000-8000-000000000515', '00000000-0000-4000-8000-000000000408', '00000000-0000-4000-8000-000000000457', 'Apoio administrativo estrutural.', 2, 'active'),
  ('00000000-0000-4000-8000-000000000516', '00000000-0000-4000-8000-000000000409', '00000000-0000-4000-8000-000000000452', 'Posto desativado para referência histórica.', 1, 'inactive')
on conflict (id) do update set unit_id = excluded.unit_id, job_role_id = excluded.job_role_id, description = excluded.description, base_required_headcount = excluded.base_required_headcount, status = excluded.status, updated_at = now();

insert into public.workers (id, organization_id, full_name, document_number, email, phone, status, engagement_start_date, engagement_end_date)
values
  ('00000000-0000-4000-8000-000000000601', '00000000-0000-4000-8000-000000000001', 'Mariana Alves', '10000000108', 'mariana.alves@example.invalid', '(11) 90000-0001', 'active', '2025-01-06', null),
  ('00000000-0000-4000-8000-000000000602', '00000000-0000-4000-8000-000000000001', 'Lucas Ferreira', '10000000280', 'lucas.ferreira@example.invalid', '(11) 90000-0002', 'active', '2025-01-06', null),
  ('00000000-0000-4000-8000-000000000603', '00000000-0000-4000-8000-000000000001', 'Camila Nunes', '10000000361', 'camila.nunes@example.invalid', '(11) 90000-0003', 'active', '2025-02-03', null),
  ('00000000-0000-4000-8000-000000000604', '00000000-0000-4000-8000-000000000001', 'Rafael Moura', '10000000442', 'rafael.moura@example.invalid', '(11) 90000-0004', 'active', '2025-02-03', null),
  ('00000000-0000-4000-8000-000000000605', '00000000-0000-4000-8000-000000000001', 'Bianca Costa', '10000000523', 'bianca.costa@example.invalid', '(11) 90000-0005', 'active', '2025-03-03', null),
  ('00000000-0000-4000-8000-000000000606', '00000000-0000-4000-8000-000000000001', 'Diego Martins', '10000000604', 'diego.martins@example.invalid', '(11) 90000-0006', 'active', '2025-03-03', null),
  ('00000000-0000-4000-8000-000000000607', '00000000-0000-4000-8000-000000000001', 'Juliana Rocha', '10000000795', 'juliana.rocha@example.invalid', '(11) 90000-0007', 'active', '2025-03-10', null),
  ('00000000-0000-4000-8000-000000000608', '00000000-0000-4000-8000-000000000001', 'André Lima', '10000000876', 'andre.lima@example.invalid', '(11) 90000-0008', 'active', '2025-04-07', null),
  ('00000000-0000-4000-8000-000000000609', '00000000-0000-4000-8000-000000000001', 'Renata Gomes', '10000000957', 'renata.gomes@example.invalid', '(11) 90000-0009', 'active', '2025-04-07', null),
  ('00000000-0000-4000-8000-000000000610', '00000000-0000-4000-8000-000000000001', 'Felipe Azevedo', '10000001090', 'felipe.azevedo@example.invalid', '(11) 90000-0010', 'active', '2025-05-05', null),
  ('00000000-0000-4000-8000-000000000611', '00000000-0000-4000-8000-000000000001', 'Patrícia Barros', '10000001171', 'patricia.barros@example.invalid', '(11) 90000-0011', 'active', '2025-05-05', null),
  ('00000000-0000-4000-8000-000000000612', '00000000-0000-4000-8000-000000000001', 'Gabriel Freitas', '10000001252', 'gabriel.freitas@example.invalid', '(11) 90000-0012', 'active', '2025-06-02', null),
  ('00000000-0000-4000-8000-000000000613', '00000000-0000-4000-8000-000000000001', 'Letícia Ramos', '10000001333', 'leticia.ramos@example.invalid', '(11) 90000-0013', 'active', '2025-06-02', null),
  ('00000000-0000-4000-8000-000000000614', '00000000-0000-4000-8000-000000000001', 'Bruno Teixeira', '10000001414', 'bruno.teixeira@example.invalid', '(11) 90000-0014', 'active', '2025-06-09', null),
  ('00000000-0000-4000-8000-000000000615', '00000000-0000-4000-8000-000000000001', 'Carolina Mendes', '10000001503', 'carolina.mendes@example.invalid', '(11) 90000-0015', 'active', '2025-06-09', null),
  ('00000000-0000-4000-8000-000000000616', '00000000-0000-4000-8000-000000000001', 'Vinícius Duarte', '10000001686', 'vinicius.duarte@example.invalid', '(11) 90000-0016', 'active', '2025-07-07', null),
  ('00000000-0000-4000-8000-000000000617', '00000000-0000-4000-8000-000000000001', 'Aline Prado', '10000001767', 'aline.prado@example.invalid', '(11) 90000-0017', 'active', '2025-07-07', null),
  ('00000000-0000-4000-8000-000000000618', '00000000-0000-4000-8000-000000000001', 'Tiago Farias', '10000001848', 'tiago.farias@example.invalid', '(11) 90000-0018', 'active', '2025-08-04', null),
  ('00000000-0000-4000-8000-000000000619', '00000000-0000-4000-8000-000000000001', 'Natália Pires', '10000001929', 'natalia.pires@example.invalid', '(11) 90000-0019', 'active', '2025-08-04', null),
  ('00000000-0000-4000-8000-000000000620', '00000000-0000-4000-8000-000000000001', 'João Vitor Reis', '10000002062', 'joao.reis@example.invalid', '(11) 90000-0020', 'onboarding', null, null),
  ('00000000-0000-4000-8000-000000000621', '00000000-0000-4000-8000-000000000001', 'Larissa Siqueira', '10000002143', 'larissa.siqueira@example.invalid', '(11) 90000-0021', 'onboarding', null, null),
  ('00000000-0000-4000-8000-000000000622', '00000000-0000-4000-8000-000000000001', 'Eduardo Melo', '10000002224', 'eduardo.melo@example.invalid', '(11) 90000-0022', 'inactive', '2025-01-06', '2025-10-31'),
  ('00000000-0000-4000-8000-000000000623', '00000000-0000-4000-8000-000000000001', 'Sofia Cardoso', '10000002305', 'sofia.cardoso@example.invalid', '(11) 90000-0023', 'inactive', '2025-02-03', '2025-09-30'),
  ('00000000-0000-4000-8000-000000000624', '00000000-0000-4000-8000-000000000001', 'Marcelo Bastos', '10000002496', 'marcelo.bastos@example.invalid', '(11) 90000-0024', 'terminated', '2025-03-03', '2025-10-31'),
  ('00000000-0000-4000-8000-000000000625', '00000000-0000-4000-8000-000000000001', 'Isabela Moreira', '10000002577', 'isabela.moreira@example.invalid', '(11) 90000-0025', 'active', '2025-09-01', null)
on conflict (id) do update set organization_id = excluded.organization_id, full_name = excluded.full_name, document_number = excluded.document_number, email = excluded.email, phone = excluded.phone, status = excluded.status, engagement_start_date = excluded.engagement_start_date, engagement_end_date = excluded.engagement_end_date, updated_at = now();

insert into public.assignments (id, worker_id, position_id, start_date, end_date, status)
values
  ('00000000-0000-4000-8000-000000000701', '00000000-0000-4000-8000-000000000601', '00000000-0000-4000-8000-000000000501', '2025-06-02', null, 'active'),
  ('00000000-0000-4000-8000-000000000702', '00000000-0000-4000-8000-000000000602', '00000000-0000-4000-8000-000000000502', '2025-01-06', null, 'active'),
  ('00000000-0000-4000-8000-000000000703', '00000000-0000-4000-8000-000000000603', '00000000-0000-4000-8000-000000000502', '2025-02-03', null, 'active'),
  ('00000000-0000-4000-8000-000000000704', '00000000-0000-4000-8000-000000000604', '00000000-0000-4000-8000-000000000503', '2025-02-03', null, 'active'),
  ('00000000-0000-4000-8000-000000000705', '00000000-0000-4000-8000-000000000605', '00000000-0000-4000-8000-000000000504', '2025-03-03', null, 'active'),
  ('00000000-0000-4000-8000-000000000706', '00000000-0000-4000-8000-000000000606', '00000000-0000-4000-8000-000000000504', '2025-03-03', null, 'active'),
  ('00000000-0000-4000-8000-000000000707', '00000000-0000-4000-8000-000000000607', '00000000-0000-4000-8000-000000000505', '2025-03-10', null, 'active'),
  ('00000000-0000-4000-8000-000000000708', '00000000-0000-4000-8000-000000000608', '00000000-0000-4000-8000-000000000507', '2025-04-07', null, 'active'),
  ('00000000-0000-4000-8000-000000000709', '00000000-0000-4000-8000-000000000609', '00000000-0000-4000-8000-000000000507', '2025-04-07', null, 'active'),
  ('00000000-0000-4000-8000-000000000710', '00000000-0000-4000-8000-000000000610', '00000000-0000-4000-8000-000000000508', '2025-05-05', null, 'active'),
  ('00000000-0000-4000-8000-000000000711', '00000000-0000-4000-8000-000000000611', '00000000-0000-4000-8000-000000000509', '2025-05-05', null, 'active'),
  ('00000000-0000-4000-8000-000000000712', '00000000-0000-4000-8000-000000000612', '00000000-0000-4000-8000-000000000510', '2025-06-02', null, 'active'),
  ('00000000-0000-4000-8000-000000000713', '00000000-0000-4000-8000-000000000613', '00000000-0000-4000-8000-000000000511', '2025-06-02', null, 'active'),
  ('00000000-0000-4000-8000-000000000714', '00000000-0000-4000-8000-000000000614', '00000000-0000-4000-8000-000000000511', '2025-06-09', null, 'active'),
  ('00000000-0000-4000-8000-000000000715', '00000000-0000-4000-8000-000000000615', '00000000-0000-4000-8000-000000000512', '2025-06-09', null, 'active'),
  ('00000000-0000-4000-8000-000000000716', '00000000-0000-4000-8000-000000000616', '00000000-0000-4000-8000-000000000513', '2025-07-07', null, 'active'),
  ('00000000-0000-4000-8000-000000000717', '00000000-0000-4000-8000-000000000617', '00000000-0000-4000-8000-000000000513', '2025-07-07', null, 'active'),
  ('00000000-0000-4000-8000-000000000718', '00000000-0000-4000-8000-000000000619', '00000000-0000-4000-8000-000000000515', '2026-02-02', null, 'pending'),
  ('00000000-0000-4000-8000-000000000719', '00000000-0000-4000-8000-000000000601', '00000000-0000-4000-8000-000000000503', '2025-01-06', '2025-05-30', 'finished'),
  ('00000000-0000-4000-8000-000000000720', '00000000-0000-4000-8000-000000000618', '00000000-0000-4000-8000-000000000514', '2025-08-04', '2025-12-19', 'finished'),
  ('00000000-0000-4000-8000-000000000721', '00000000-0000-4000-8000-000000000624', '00000000-0000-4000-8000-000000000508', '2025-03-03', '2025-10-31', 'finished')
on conflict (id) do update set worker_id = excluded.worker_id, position_id = excluded.position_id, start_date = excluded.start_date, end_date = excluded.end_date, status = excluded.status, updated_at = now();
