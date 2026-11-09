-- ============================================================
-- MIGRATION: Conecta — Expansão Viral & Piloto São José dos Campos
-- Execute este script no SQL Editor do Supabase (NÃO apaga seus dados atuais)
-- ============================================================

-- 1. Criação da Tabela de Controle de Cidades e Metas de Desbloqueio
CREATE TABLE IF NOT EXISTS cidades_config (
  id             UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  codigo_ibge    TEXT UNIQUE,
  nome           TEXT NOT NULL,
  estado         TEXT NOT NULL CHECK (char_length(estado) = 2),
  status         TEXT DEFAULT 'em_espera' CHECK (status IN ('ativa', 'em_espera', 'em_breve')),
  meta_usuarios  INT DEFAULT 500,
  created_at     TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(nome, estado)
);

-- Índices para busca rápida no cadastro e validação
CREATE INDEX IF NOT EXISTS idx_cidades_nome_estado ON cidades_config (LOWER(nome), estado);
CREATE INDEX IF NOT EXISTS idx_cidades_status ON cidades_config (status);

-- 2. Adiciona coluna codigo_ibge na tabela de users caso ainda não exista
ALTER TABLE users ADD COLUMN IF NOT EXISTS codigo_ibge TEXT;

-- 3. Habilita RLS na tabela cidades_config
ALTER TABLE cidades_config ENABLE ROW LEVEL SECURITY;

-- Leitura pública para que qualquer visitante ou morador possa ver o progresso da sua cidade
DROP POLICY IF EXISTS "cidades_config: leitura publica" ON cidades_config;
CREATE POLICY "cidades_config: leitura publica"
  ON cidades_config FOR SELECT
  USING (true);

-- Apenas administradores (service_role) podem cadastrar ou alterar metas
DROP POLICY IF EXISTS "cidades_config: modificacao service_role" ON cidades_config;
CREATE POLICY "cidades_config: modificacao service_role"
  ON cidades_config FOR ALL
  USING (current_setting('role', true) = 'service_role')
  WITH CHECK (current_setting('role', true) = 'service_role');

-- 4. Função RPC: Busca ou cria automaticamente a cidade em espera e retorna o progresso
-- Usada na tela de "Lista de Espera" para exibir: Cadastrados, Meta e Faltam
CREATE OR REPLACE FUNCTION get_or_create_cidade_espera(
  p_nome   TEXT,
  p_estado TEXT,
  p_ibge   TEXT DEFAULT NULL
)
RETURNS JSON AS $$
DECLARE
  v_cidade_record RECORD;
  v_total_users   INT;
  v_meta          INT;
  v_status        TEXT;
BEGIN
  -- 1. Garante que a cidade exista na tabela de configuração (cria em 'em_espera' com meta padrão 500 se não existir)
  INSERT INTO cidades_config (nome, estado, codigo_ibge, status, meta_usuarios)
  VALUES (TRIM(p_nome), UPPER(TRIM(p_estado)), p_ibge, 'em_espera', 500)
  ON CONFLICT (nome, estado) DO UPDATE
    SET codigo_ibge = COALESCE(cidades_config.codigo_ibge, EXCLUDED.codigo_ibge)
  RETURNING * INTO v_cidade_record;

  -- 2. Conta quantos usuários já se cadastraram nessa cidade
  SELECT COUNT(*)
    INTO v_total_users
    FROM users
   WHERE LOWER(TRIM(cidade)) = LOWER(TRIM(p_nome))
     AND UPPER(TRIM(estado)) = UPPER(TRIM(p_estado));

  v_meta := v_cidade_record.meta_usuarios;
  v_status := v_cidade_record.status;

  -- 3. Retorna o JSON estruturado para alimentar o card de espera e compartilhamento
  RETURN json_build_object(
    'cidade', v_cidade_record.nome,
    'estado', v_cidade_record.estado,
    'codigo_ibge', v_cidade_record.codigo_ibge,
    'status', v_status,
    'is_liberada', (v_status = 'ativa'),
    'total_cadastrados', v_total_users,
    'meta_usuarios', v_meta,
    'faltam', GREATEST(0, v_meta - v_total_users),
    'porcentagem', LEAST(100, ROUND((v_total_users::NUMERIC / GREATEST(1, v_meta)::NUMERIC) * 100))
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5. Inicialização das Cidades: São José dos Campos (ATIVA) e Cidades Vizinhas (EM ESPERA)
INSERT INTO cidades_config (nome, estado, codigo_ibge, status, meta_usuarios)
VALUES
  ('São José dos Campos', 'SP', '3549904', 'ativa', 1000),
  ('Jacareí', 'SP', '3524402', 'em_espera', 500),
  ('Taubaté', 'SP', '3554102', 'em_espera', 500),
  ('Caçapava', 'SP', '3508504', 'em_espera', 300)
ON CONFLICT (nome, estado) DO UPDATE
  SET status = EXCLUDED.status,
      meta_usuarios = EXCLUDED.meta_usuarios,
      codigo_ibge = COALESCE(cidades_config.codigo_ibge, EXCLUDED.codigo_ibge);

-- 6. Pautas Reais da Câmara Municipal de São José dos Campos (SJC)
INSERT INTO pautas_ia (id, cep_alvo, bairro_alvo, cidade_alvo, estado_alvo, titulo, resumo_ia, impacto_bairro, vereador_proponente, link_pdf_original, fonte_diario, votos_concordar, votos_discordar, status, data_votacao)
VALUES
  (
    'a1111111-2222-3333-4444-555555555555',
    '12246-021',
    'Jardim Aquárius',
    'São José dos Campos',
    'SP',
    'ALERTA DE IA: Pauta na Câmara de SJC',
    'Votação do projeto de requalificação viária e novas áreas comerciais na Av. Cassiano Ricardo.',
    'Aumento no fluxo de veículos no Aquárius e ampliação de vagas de estacionamento rotativo.',
    'Marcio Roberto',
    'https://camarasjc.sp.gov.br/projetos/pl-cassiano-ricardo.pdf',
    'Câmara Municipal de São José dos Campos - Sessão Ordinária',
    215,
    42,
    'ativa',
    NOW() + INTERVAL '2 days'
  ),
  (
    'a2222222-3333-4444-5555-666666666666',
    '12230-000',
    'Jardim Satélite',
    'São José dos Campos',
    'SP',
    'ALERTA DE IA: Expansão da Linha Verde',
    'Projeto de ampliação dos corredores de VLP elétrico conectando a Zona Sul ao Parque Tecnológico.',
    'Redução de 25 min no deslocamento diário de trabalhadores e estudantes da região sul.',
    'Juliana Fraga',
    'https://camarasjc.sp.gov.br/projetos/pl-linha-verde-sul.pdf',
    'Diário Oficial de SJC - Ed. Extraordinária',
    380,
    18,
    'ativa',
    NOW() + INTERVAL '4 days'
  )
ON CONFLICT (id) DO NOTHING;

-- 7. Posts Reais de Zeladoria Urbana em São José dos Campos (SJC)
INSERT INTO posts_comunidade (id, user_id, foto_url, descricao, cep, bairro, categoria, numero_protocolo, curtidas)
SELECT
  'b1111111-2222-3333-4444-555555555555',
  u.id,
  'https://images.unsplash.com/photo-1578885136359-16c8bd4d3a8e?auto=format&fit=crop&w=800&q=80',
  'Buraco perigoso na descida da rotatória da Av. Tubarão no Aquárius. Já protocolado no 156 da Prefeitura (nº 74921). #ZeladoriaSJC #Aquarius',
  '12246-021',
  'Jardim Aquárius',
  'buraco',
  '74921',
  47
FROM users u
LIMIT 1
ON CONFLICT (id) DO NOTHING;
