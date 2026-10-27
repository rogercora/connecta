-- ============================================================
-- Connecta — Schema SQL completo (Supabase / PostgreSQL + PostGIS)
-- ============================================================

-- ────────────────────────────────────────────────────────────
-- 1. Extensões
-- ────────────────────────────────────────────────────────────
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "postgis";

-- ────────────────────────────────────────────────────────────
-- 2. Tabelas
-- ────────────────────────────────────────────────────────────

-- ▸ users
CREATE TABLE users (
  id                UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
  phone             TEXT        UNIQUE,
  email             TEXT        UNIQUE NOT NULL,
  nome_completo     TEXT        NOT NULL,
  avatar_url        TEXT,
  cep               TEXT        NOT NULL,
  bairro            TEXT        NOT NULL,
  cidade            TEXT        NOT NULL,
  estado            TEXT        NOT NULL CHECK (char_length(estado) = 2),
  coordenadas       GEOGRAPHY(POINT, 4326),
  nivel_verificacao SMALLINT    DEFAULT 1 CHECK (nivel_verificacao BETWEEN 0 AND 2),
  cpf_hash          TEXT        UNIQUE,
  created_at        TIMESTAMPTZ DEFAULT NOW()
);

-- ▸ pautas_ia
CREATE TABLE pautas_ia (
  id                   UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
  cep_alvo             TEXT        NOT NULL,
  bairro_alvo          TEXT        NOT NULL,
  cidade_alvo          TEXT        NOT NULL,
  estado_alvo          TEXT        NOT NULL CHECK (char_length(estado_alvo) = 2),
  titulo               TEXT        NOT NULL,
  resumo_ia            TEXT        NOT NULL,
  impacto_bairro       TEXT        NOT NULL,
  vereador_proponente  TEXT        NOT NULL,
  link_pdf_original    TEXT,
  fonte_diario         TEXT,
  votos_concordar      INT         DEFAULT 0,
  votos_discordar      INT         DEFAULT 0,
  status               TEXT        DEFAULT 'ativa' CHECK (status IN ('ativa', 'encerrada', 'peticao_gerada')),
  data_votacao         TIMESTAMPTZ,
  created_at           TIMESTAMPTZ DEFAULT NOW()
);

-- ▸ posts_comunidade
CREATE TABLE posts_comunidade (
  id                UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id           UUID        NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  foto_url          TEXT,
  descricao         TEXT        NOT NULL,
  cep               TEXT        NOT NULL,
  bairro            TEXT        NOT NULL,
  categoria         TEXT        DEFAULT 'outro' CHECK (
                      categoria IN (
                        'buraco', 'iluminacao', 'lixo', 'alagamento',
                        'transporte', 'seguranca', 'saude', 'educacao', 'outro'
                      )
                    ),
  numero_protocolo  TEXT        UNIQUE NOT NULL,
  curtidas          INT         DEFAULT 0,
  created_at        TIMESTAMPTZ DEFAULT NOW()
);

-- ▸ votos_pauta
CREATE TABLE votos_pauta (
  id                  UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
  pauta_id            UUID        NOT NULL REFERENCES pautas_ia(id) ON DELETE CASCADE,
  user_id             UUID        NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  opcao_voto          TEXT        NOT NULL CHECK (opcao_voto IN ('concordar', 'discordar')),
  motivo_discordancia TEXT,
  created_at          TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (pauta_id, user_id)
);

-- ▸ comentarios
CREATE TABLE comentarios (
  id          UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
  post_id     UUID        NOT NULL REFERENCES posts_comunidade(id) ON DELETE CASCADE,
  user_id     UUID        NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  conteudo    TEXT        NOT NULL,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- ▸ peticoes
CREATE TABLE peticoes (
  id                UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
  pauta_id          UUID        NOT NULL REFERENCES pautas_ia(id),
  cep_alvo          TEXT        NOT NULL,
  total_assinaturas INT         DEFAULT 0,
  pdf_url           TEXT,
  status            TEXT        DEFAULT 'rascunho' CHECK (status IN ('rascunho', 'aberta', 'entregue', 'respondida')),
  created_at        TIMESTAMPTZ DEFAULT NOW()
);

-- ────────────────────────────────────────────────────────────
-- 3. Índices
-- ────────────────────────────────────────────────────────────

-- users
CREATE INDEX idx_users_cep    ON users (cep);
CREATE INDEX idx_users_bairro ON users (bairro);
CREATE INDEX idx_users_cidade ON users (cidade);
CREATE INDEX idx_users_coordenadas ON users USING GIST (coordenadas);

-- pautas_ia
CREATE INDEX idx_pautas_ia_cep_alvo    ON pautas_ia (cep_alvo);
CREATE INDEX idx_pautas_ia_cidade_alvo ON pautas_ia (cidade_alvo);
CREATE INDEX idx_pautas_ia_status      ON pautas_ia (status);

-- posts_comunidade
CREATE INDEX idx_posts_comunidade_cep     ON posts_comunidade (cep);
CREATE INDEX idx_posts_comunidade_user_id ON posts_comunidade (user_id);

-- votos_pauta
CREATE INDEX idx_votos_pauta_pauta_id ON votos_pauta (pauta_id);
CREATE INDEX idx_votos_pauta_user_id  ON votos_pauta (user_id);

-- ────────────────────────────────────────────────────────────
-- 4. Trigger: auto-incremento de votos em pautas_ia
-- ────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION fn_incrementar_votos_pauta()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.opcao_voto = 'concordar' THEN
    UPDATE pautas_ia
       SET votos_concordar = votos_concordar + 1
     WHERE id = NEW.pauta_id;
  ELSIF NEW.opcao_voto = 'discordar' THEN
    UPDATE pautas_ia
       SET votos_discordar = votos_discordar + 1
     WHERE id = NEW.pauta_id;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trg_votos_pauta_after_insert
  AFTER INSERT ON votos_pauta
  FOR EACH ROW
  EXECUTE FUNCTION fn_incrementar_votos_pauta();

-- ────────────────────────────────────────────────────────────
-- 5. Função: verificar limiar de petição
-- ────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION check_peticao_threshold(
  pauta_uuid UUID,
  threshold  INT
)
RETURNS BOOLEAN AS $$
DECLARE
  v_concordar INT;
  v_discordar INT;
  v_cep       TEXT;
  v_exists    BOOLEAN;
BEGIN
  -- Busca contagens e CEP da pauta
  SELECT votos_concordar, votos_discordar, cep_alvo
    INTO v_concordar, v_discordar, v_cep
    FROM pautas_ia
   WHERE id = pauta_uuid;

  -- Se a pauta não existe, retorna FALSE
  IF NOT FOUND THEN
    RETURN FALSE;
  END IF;

  -- Verifica se algum lado excede o limiar
  IF v_concordar >= threshold OR v_discordar >= threshold THEN
    -- Verifica se já existe petição para esta pauta
    SELECT EXISTS (
      SELECT 1 FROM peticoes WHERE pauta_id = pauta_uuid
    ) INTO v_exists;

    IF NOT v_exists THEN
      -- Cria a petição automaticamente
      INSERT INTO peticoes (pauta_id, cep_alvo, total_assinaturas, status)
      VALUES (
        pauta_uuid,
        v_cep,
        GREATEST(v_concordar, v_discordar),
        'rascunho'
      );

      -- Atualiza status da pauta
      UPDATE pautas_ia
         SET status = 'peticao_gerada'
       WHERE id = pauta_uuid;
    END IF;

    RETURN TRUE;
  END IF;

  RETURN FALSE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ────────────────────────────────────────────────────────────
-- 6. Row Level Security (RLS)
-- ────────────────────────────────────────────────────────────

-- ╌╌╌╌╌ users ╌╌╌╌╌
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

CREATE POLICY "users: leitura pública"
  ON users FOR SELECT
  USING (true);

CREATE POLICY "users: atualizar próprio perfil"
  ON users FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- ╌╌╌╌╌ pautas_ia ╌╌╌╌╌
ALTER TABLE pautas_ia ENABLE ROW LEVEL SECURITY;

CREATE POLICY "pautas_ia: leitura pública"
  ON pautas_ia FOR SELECT
  USING (true);

CREATE POLICY "pautas_ia: insert apenas service_role"
  ON pautas_ia FOR INSERT
  WITH CHECK (
    current_setting('role', true) = 'service_role'
  );

CREATE POLICY "pautas_ia: update apenas service_role"
  ON pautas_ia FOR UPDATE
  USING (
    current_setting('role', true) = 'service_role'
  )
  WITH CHECK (
    current_setting('role', true) = 'service_role'
  );

-- ╌╌╌╌╌ posts_comunidade ╌╌╌╌╌
ALTER TABLE posts_comunidade ENABLE ROW LEVEL SECURITY;

CREATE POLICY "posts_comunidade: leitura pública"
  ON posts_comunidade FOR SELECT
  USING (true);

CREATE POLICY "posts_comunidade: insert autenticado"
  ON posts_comunidade FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "posts_comunidade: update dono"
  ON posts_comunidade FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "posts_comunidade: delete dono"
  ON posts_comunidade FOR DELETE
  USING (auth.uid() = user_id);

-- ╌╌╌╌╌ votos_pauta ╌╌╌╌╌
ALTER TABLE votos_pauta ENABLE ROW LEVEL SECURITY;

CREATE POLICY "votos_pauta: leitura pública"
  ON votos_pauta FOR SELECT
  USING (true);

CREATE POLICY "votos_pauta: insert cidadão verificado"
  ON votos_pauta FOR INSERT
  WITH CHECK (
    auth.uid() = user_id
    AND EXISTS (
      SELECT 1 FROM users
       WHERE users.id = auth.uid()
         AND users.nivel_verificacao >= 2
    )
  );

-- Sem UPDATE ou DELETE em votos_pauta (voto é imutável)

-- ╌╌╌╌╌ comentarios ╌╌╌╌╌
ALTER TABLE comentarios ENABLE ROW LEVEL SECURITY;

CREATE POLICY "comentarios: leitura pública"
  ON comentarios FOR SELECT
  USING (true);

CREATE POLICY "comentarios: insert autenticado"
  ON comentarios FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "comentarios: delete dono"
  ON comentarios FOR DELETE
  USING (auth.uid() = user_id);

-- ╌╌╌╌╌ peticoes ╌╌╌╌╌
ALTER TABLE peticoes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "peticoes: leitura pública"
  ON peticoes FOR SELECT
  USING (true);

CREATE POLICY "peticoes: insert apenas service_role"
  ON peticoes FOR INSERT
  WITH CHECK (
    current_setting('role', true) = 'service_role'
  );

CREATE POLICY "peticoes: update apenas service_role"
  ON peticoes FOR UPDATE
  USING (
    current_setting('role', true) = 'service_role'
  )
  WITH CHECK (
    current_setting('role', true) = 'service_role'
  );
