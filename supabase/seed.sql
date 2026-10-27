-- ============================================================
-- Connecta — Seed Data (Demonstração / Testes)
-- ============================================================

-- 1. Usuários
INSERT INTO users (id, phone, email, nome_completo, avatar_url, cep, bairro, cidade, estado, nivel_verificacao, cpf_hash)
VALUES
  (
    'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
    '11987654321',
    'maria.silva@exemplo.com',
    'Maria Silva',
    'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=250&q=80',
    '04266-000',
    'Ipiranga',
    'São Paulo',
    'SP',
    2, -- Cidadã Verificada
    'hash_cpf_maria_ipiranga_123'
  ),
  (
    'b0eebc99-9c0b-4ef8-bb6d-6bb9bd380a22',
    '11976543210',
    'joao.santos@exemplo.com',
    'João Santos',
    'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=250&q=80',
    '05422-000',
    'Pinheiros',
    'São Paulo',
    'SP',
    1, -- Usuário Cadastrado
    'hash_cpf_joao_pinheiros_456'
  ),
  (
    'c0eebc99-9c0b-4ef8-bb6d-6bb9bd380a33',
    '21998877665',
    'ana.costa@exemplo.com',
    'Ana Costa',
    'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=250&q=80',
    '22070-000',
    'Copacabana',
    'Rio de Janeiro',
    'RJ',
    2,
    'hash_cpf_ana_copa_789'
  )
ON CONFLICT (id) DO NOTHING;

-- 2. Pautas de IA
INSERT INTO pautas_ia (id, cep_alvo, bairro_alvo, cidade_alvo, estado_alvo, titulo, resumo_ia, impacto_bairro, vereador_proponente, link_pdf_original, fonte_diario, votos_concordar, votos_discordar, status, data_votacao)
VALUES
  (
    'd0eebc99-9c0b-4ef8-bb6d-6bb9bd380a44',
    '04266-000',
    'Ipiranga',
    'São Paulo',
    'SP',
    'ALERTA DE IA: Pauta na Câmara',
    'Votação amanhã sobre o novo Plano de Zoneamento da Rua Silva Bueno (R$ 5M).',
    'Potencial aumento de tráfego e novas áreas comerciais.',
    'Carlos Silva',
    'https://diariooficial.saopaulo.sp.leg.br/exemplo-pauta-123.pdf',
    'Diário Oficial da Cidade de São Paulo - Ed. 248',
    142,
    38,
    'ativa',
    NOW() + INTERVAL '1 day'
  ),
  (
    'e0eebc99-9c0b-4ef8-bb6d-6bb9bd380a55',
    '01000-000',
    'Centro',
    'São Paulo',
    'SP',
    'ALERTA DE IA: Revisão da Tarifa de Ônibus',
    'Projeto de subsídio tarifário para linhas circulares noturnas.',
    'Melhoria do transporte noturno para trabalhadores e estudantes.',
    'Mariana Prado',
    'https://diariooficial.saopaulo.sp.leg.br/exemplo-tarifa-456.pdf',
    'Câmara Municipal de SP - Projeto de Lei 412/2026',
    320,
    15,
    'ativa',
    NOW() + INTERVAL '3 days'
  )
ON CONFLICT (id) DO NOTHING;

-- 3. Posts da Comunidade (Zeladoria)
INSERT INTO posts_comunidade (id, user_id, foto_url, descricao, cep, bairro, categoria, numero_protocolo, curtidas)
VALUES
  (
    'f0eebc99-9c0b-4ef8-bb6d-6bb9bd380a66',
    'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', -- Maria Silva
    'https://images.unsplash.com/photo-1515162816999-a0c47dc192f7?auto=format&fit=crop&w=800&q=80',
    'Gente, esse buraco na Rua Agostinho Gomes está enorme! Já protocolado na Prefeitura (nº 12345). #ZeladoriaUrbana #ipiranga',
    '04266-000',
    'Ipiranga',
    'buraco',
    '12345',
    31
  ),
  (
    'f1eebc99-9c0b-4ef8-bb6d-6bb9bd380a77',
    'b0eebc99-9c0b-4ef8-bb6d-6bb9bd380a22', -- João Santos
    'https://images.unsplash.com/photo-1509198397868-475647b2a1e5?auto=format&fit=crop&w=800&q=80',
    'Poste sem luz há 4 noites seguidas na esquina da Teodoro Sampaio com Fradique Coutinho. Insegurança total. #Pinheiros #Iluminacao',
    '05422-000',
    'Pinheiros',
    'iluminacao',
    '12346',
    19
  )
ON CONFLICT (id) DO NOTHING;

-- 4. Comentários
INSERT INTO comentarios (id, post_id, user_id, conteudo)
VALUES
  (
    'c1eebc99-9c0b-4ef8-bb6d-6bb9bd380a88',
    'f0eebc99-9c0b-4ef8-bb6d-6bb9bd380a66',
    'b0eebc99-9c0b-4ef8-bb6d-6bb9bd380a22',
    'Passei aí hoje de manhã e quase quebrei a suspensão do carro!'
  ),
  (
    'c2eebc99-9c0b-4ef8-bb6d-6bb9bd380a99',
    'f0eebc99-9c0b-4ef8-bb6d-6bb9bd380a66',
    'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
    'Já cobrei a Subprefeitura pelo canal oficial do 156 também.'
  )
ON CONFLICT (id) DO NOTHING;

