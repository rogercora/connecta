-- ============================================================
-- ConectaBr — Sprint 2 Migration:
-- 1. Hierarquia super_admin > admin > cidadao
-- 2. Quórum configurável por cidade (Art. 5º, XXXIV, "a" CF/88)
-- 3. Petições oficiais, assinaturas únicas e moderação real
-- 4. Feed com cidade/estado, curtidas reais e comentários
-- ============================================================
-- Execute este script no SQL Editor do Supabase (idempotente).

-- ────────────────────────────────────────────────────────────
-- 1. Hierarquia de Papéis (`cidadao`, `admin`, `super_admin`)
-- ────────────────────────────────────────────────────────────
DO $$
DECLARE
  v_conname TEXT;
BEGIN
  FOR v_conname IN
    SELECT conname
      FROM pg_constraint
     WHERE conrelid = 'public.users'::regclass
       AND contype = 'c'
       AND pg_get_constraintdef(oid) ILIKE '%role%'
  LOOP
    EXECUTE format('ALTER TABLE public.users DROP CONSTRAINT IF EXISTS %I', v_conname);
  END LOOP;

  ALTER TABLE public.users
    ADD CONSTRAINT users_role_check
    CHECK (role IN ('cidadao', 'admin', 'super_admin'));
END $$;

-- Admin e Super Admin compartilham acesso operacional de moderação
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
      FROM public.users
     WHERE id = auth.uid()
       AND role IN ('admin', 'super_admin')
  );
$$;

-- Exclusivo para ações estruturais (promover admins, alterar quórum/cidades)
CREATE OR REPLACE FUNCTION public.is_super_admin()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
      FROM public.users
     WHERE id = auth.uid()
       AND role = 'super_admin'
  );
$$;

-- ────────────────────────────────────────────────────────────
-- 2. Configuração de Quórum por Cidade (`cidades_config`)
--    Base constitucional: Direito de Petição (Art. 5º, XXXIV, "a" CF/88)
--    não possui mínimo fixo em lei federal; é meta operacional configurável.
-- ────────────────────────────────────────────────────────────
ALTER TABLE public.cidades_config
  ADD COLUMN IF NOT EXISTS quorum_peticao INT NOT NULL DEFAULT 50,
  ADD COLUMN IF NOT EXISTS email_camara_padrao TEXT,
  ADD COLUMN IF NOT EXISTS email_ouvidoria_padrao TEXT;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
     WHERE conrelid = 'public.cidades_config'::regclass
       AND conname = 'cidades_config_quorum_peticao_check'
  ) THEN
    ALTER TABLE public.cidades_config
      ADD CONSTRAINT cidades_config_quorum_peticao_check CHECK (quorum_peticao >= 1);
  END IF;
END $$;

UPDATE public.cidades_config
   SET email_camara_padrao = COALESCE(email_camara_padrao, 'camara@camarasjc.sp.gov.br'),
       email_ouvidoria_padrao = COALESCE(email_ouvidoria_padrao, 'ouvidoria@sjc.sp.gov.br')
 WHERE LOWER(nome) LIKE 'são josé dos campos%'
   AND UPPER(estado) = 'SP';

DROP POLICY IF EXISTS "cidades_config: modificacao admin ou service_role" ON public.cidades_config;
DROP POLICY IF EXISTS "cidades_config: modificacao service_role" ON public.cidades_config;
DROP POLICY IF EXISTS "cidades_config: modificacao super_admin ou service_role" ON public.cidades_config;
CREATE POLICY "cidades_config: modificacao super_admin ou service_role"
  ON public.cidades_config FOR ALL
  USING (current_setting('role', true) = 'service_role' OR public.is_super_admin())
  WITH CHECK (current_setting('role', true) = 'service_role' OR public.is_super_admin());

-- Atualiza RPC de lista de espera para incluir quorum_peticao
CREATE OR REPLACE FUNCTION public.get_or_create_cidade_espera(
  p_nome   TEXT,
  p_estado TEXT,
  p_ibge   TEXT DEFAULT NULL
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_cidade_record RECORD;
  v_total_users   INT;
  v_meta          INT;
  v_status        TEXT;
BEGIN
  INSERT INTO public.cidades_config (nome, estado, codigo_ibge, status, meta_usuarios)
  VALUES (TRIM(p_nome), UPPER(TRIM(p_estado)), p_ibge, 'em_espera', 500)
  ON CONFLICT (nome, estado) DO UPDATE
    SET codigo_ibge = COALESCE(public.cidades_config.codigo_ibge, EXCLUDED.codigo_ibge)
  RETURNING * INTO v_cidade_record;

  SELECT COUNT(*)
    INTO v_total_users
    FROM public.users
   WHERE LOWER(TRIM(cidade)) = LOWER(TRIM(p_nome))
     AND UPPER(TRIM(estado)) = UPPER(TRIM(p_estado));

  v_meta := v_cidade_record.meta_usuarios;
  v_status := v_cidade_record.status;

  RETURN json_build_object(
    'cidade', v_cidade_record.nome,
    'estado', v_cidade_record.estado,
    'codigo_ibge', v_cidade_record.codigo_ibge,
    'status', v_status,
    'is_liberada', (v_status = 'ativa'),
    'total_cadastrados', v_total_users,
    'meta_usuarios', v_meta,
    'quorum_peticao', v_cidade_record.quorum_peticao,
    'faltam', GREATEST(0, v_meta - v_total_users),
    'porcentagem', LEAST(100, ROUND((v_total_users::NUMERIC / GREATEST(1, v_meta)::NUMERIC) * 100))
  );
END;
$$;

-- ────────────────────────────────────────────────────────────
-- 3. Extensão de `pautas_ia` (quorum por pauta, fila de revisão, edição)
-- ────────────────────────────────────────────────────────────
ALTER TABLE public.pautas_ia
  ADD COLUMN IF NOT EXISTS quorum_meta INT,
  ADD COLUMN IF NOT EXISTS categoria TEXT DEFAULT 'geral',
  ADD COLUMN IF NOT EXISTS edicao_diario TEXT;

DO $$
DECLARE
  v_conname TEXT;
BEGIN
  FOR v_conname IN
    SELECT conname
      FROM pg_constraint
     WHERE conrelid = 'public.pautas_ia'::regclass
       AND contype = 'c'
       AND pg_get_constraintdef(oid) ILIKE '%status%'
  LOOP
    EXECUTE format('ALTER TABLE public.pautas_ia DROP CONSTRAINT IF EXISTS %I', v_conname);
  END LOOP;

  ALTER TABLE public.pautas_ia
    ADD CONSTRAINT pautas_ia_status_check
    CHECK (status IN ('pendente_revisao', 'ativa', 'encerrada', 'peticao_gerada'));

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
     WHERE conrelid = 'public.pautas_ia'::regclass
       AND conname = 'pautas_ia_quorum_meta_check'
  ) THEN
    ALTER TABLE public.pautas_ia
      ADD CONSTRAINT pautas_ia_quorum_meta_check CHECK (quorum_meta IS NULL OR quorum_meta >= 1);
  END IF;
END $$;

DROP POLICY IF EXISTS "pautas_ia: leitura pública" ON public.pautas_ia;
CREATE POLICY "pautas_ia: leitura pública"
  ON public.pautas_ia FOR SELECT
  USING (
    status <> 'pendente_revisao'
    OR current_setting('role', true) = 'service_role'
    OR public.is_admin()
  );

-- ────────────────────────────────────────────────────────────
-- 4. Petições Oficiais (`peticoes`) e Assinaturas (`assinaturas_peticao`)
-- ────────────────────────────────────────────────────────────
ALTER TABLE public.peticoes
  ALTER COLUMN pauta_id DROP NOT NULL;

ALTER TABLE public.peticoes
  ADD COLUMN IF NOT EXISTS tipo TEXT NOT NULL DEFAULT 'oposicao_ato',
  ADD COLUMN IF NOT EXISTS titulo TEXT,
  ADD COLUMN IF NOT EXISTS resumo TEXT,
  ADD COLUMN IF NOT EXISTS minuta_texto TEXT,
  ADD COLUMN IF NOT EXISTS argumentos_moradores JSONB NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS email_destino TEXT,
  ADD COLUMN IF NOT EXISTS vereador_alvo TEXT,
  ADD COLUMN IF NOT EXISTS bairro TEXT,
  ADD COLUMN IF NOT EXISTS cidade TEXT NOT NULL DEFAULT 'São José dos Campos',
  ADD COLUMN IF NOT EXISTS estado TEXT NOT NULL DEFAULT 'SP',
  ADD COLUMN IF NOT EXISTS meta_assinaturas INT NOT NULL DEFAULT 50,
  ADD COLUMN IF NOT EXISTS protocolo_digital TEXT,
  ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES public.users(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS aprovada_por UUID REFERENCES public.users(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS aprovada_em TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS enviada_em TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS resposta_camara TEXT;

DO $$
DECLARE
  v_conname TEXT;
BEGIN
  FOR v_conname IN
    SELECT conname
      FROM pg_constraint
     WHERE conrelid = 'public.peticoes'::regclass
       AND contype = 'c'
       AND pg_get_constraintdef(oid) ILIKE '%status%'
  LOOP
    EXECUTE format('ALTER TABLE public.peticoes DROP CONSTRAINT IF EXISTS %I', v_conname);
  END LOOP;

  ALTER TABLE public.peticoes
    ADD CONSTRAINT peticoes_status_check
    CHECK (status IN ('rascunho', 'pendente_revisao', 'aberta', 'entregue', 'respondida', 'arquivada'));

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
     WHERE conrelid = 'public.peticoes'::regclass
       AND conname = 'peticoes_tipo_check'
  ) THEN
    ALTER TABLE public.peticoes
      ADD CONSTRAINT peticoes_tipo_check CHECK (tipo IN ('oposicao_ato', 'comunitaria'));
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
     WHERE conrelid = 'public.peticoes'::regclass
       AND conname = 'peticoes_meta_assinaturas_check'
  ) THEN
    ALTER TABLE public.peticoes
      ADD CONSTRAINT peticoes_meta_assinaturas_check CHECK (meta_assinaturas >= 1);
  END IF;
END $$;

CREATE UNIQUE INDEX IF NOT EXISTS idx_peticoes_pauta_unique
  ON public.peticoes (pauta_id)
  WHERE pauta_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_peticoes_status_cidade
  ON public.peticoes (status, LOWER(cidade), UPPER(estado));

DROP POLICY IF EXISTS "peticoes: leitura pública" ON public.peticoes;
CREATE POLICY "peticoes: leitura pública"
  ON public.peticoes FOR SELECT
  USING (
    status IN ('aberta', 'entregue', 'respondida')
    OR auth.uid() = created_by
    OR current_setting('role', true) = 'service_role'
    OR public.is_admin()
  );

DROP POLICY IF EXISTS "peticoes: delete apenas admin ou service_role" ON public.peticoes;
CREATE POLICY "peticoes: delete apenas admin ou service_role"
  ON public.peticoes FOR DELETE
  USING (current_setting('role', true) = 'service_role' OR public.is_admin());

-- Tabela de assinaturas únicas por cidadão
CREATE TABLE IF NOT EXISTS public.assinaturas_peticao (
  id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  peticao_id UUID NOT NULL REFERENCES public.peticoes(id) ON DELETE CASCADE,
  user_id    UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  comentario TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (peticao_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_assinaturas_peticao_peticao_id
  ON public.assinaturas_peticao (peticao_id);

ALTER TABLE public.assinaturas_peticao ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "assinaturas_peticao: leitura proprio ou admin" ON public.assinaturas_peticao;
CREATE POLICY "assinaturas_peticao: leitura proprio ou admin"
  ON public.assinaturas_peticao FOR SELECT
  USING (
    auth.uid() = user_id
    OR current_setting('role', true) = 'service_role'
    OR public.is_admin()
  );

DROP POLICY IF EXISTS "assinaturas_peticao: insert proprio" ON public.assinaturas_peticao;
CREATE POLICY "assinaturas_peticao: insert proprio"
  ON public.assinaturas_peticao FOR INSERT
  WITH CHECK (
    auth.uid() = user_id
    AND EXISTS (
      SELECT 1 FROM public.peticoes p
       WHERE p.id = peticao_id
         AND p.status = 'aberta'
    )
  );

DROP POLICY IF EXISTS "assinaturas_peticao: delete proprio" ON public.assinaturas_peticao;
CREATE POLICY "assinaturas_peticao: delete proprio"
  ON public.assinaturas_peticao FOR DELETE
  USING (auth.uid() = user_id);

-- Mantém peticoes.total_assinaturas sincronizado com assinaturas_peticao
CREATE OR REPLACE FUNCTION public.fn_sync_peticao_total_assinaturas()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_peticao_id UUID;
BEGIN
  v_peticao_id := COALESCE(NEW.peticao_id, OLD.peticao_id);

  UPDATE public.peticoes
     SET total_assinaturas = (
       SELECT COUNT(*)::INT
         FROM public.assinaturas_peticao
        WHERE peticao_id = v_peticao_id
     )
   WHERE id = v_peticao_id;

  RETURN NULL;
END;
$$;

DROP TRIGGER IF EXISTS trg_sync_peticao_total_assinaturas ON public.assinaturas_peticao;
CREATE TRIGGER trg_sync_peticao_total_assinaturas
  AFTER INSERT OR DELETE ON public.assinaturas_peticao
  FOR EACH ROW
  EXECUTE FUNCTION public.fn_sync_peticao_total_assinaturas();

-- Corrige trigger de quórum: apenas votos "discordar" disparam petição de oposição
CREATE OR REPLACE FUNCTION public.check_peticao_threshold(
  pauta_uuid UUID,
  threshold  INT DEFAULT NULL
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_pauta           RECORD;
  v_quorum_efetivo  INT;
  v_peticao_id      UUID;
BEGIN
  SELECT *
    INTO v_pauta
    FROM public.pautas_ia
   WHERE id = pauta_uuid;

  IF NOT FOUND THEN
    RETURN FALSE;
  END IF;

  SELECT COALESCE(
    threshold,
    v_pauta.quorum_meta,
    (
      SELECT c.quorum_peticao
        FROM public.cidades_config c
       WHERE LOWER(TRIM(c.nome)) = LOWER(TRIM(v_pauta.cidade_alvo))
         AND UPPER(TRIM(c.estado)) = UPPER(TRIM(v_pauta.estado_alvo))
       LIMIT 1
    ),
    50
  ) INTO v_quorum_efetivo;

  IF v_pauta.votos_discordar >= v_quorum_efetivo THEN
    SELECT id INTO v_peticao_id
      FROM public.peticoes
     WHERE pauta_id = pauta_uuid
     LIMIT 1;

    IF v_peticao_id IS NULL THEN
      INSERT INTO public.peticoes (
        pauta_id,
        tipo,
        titulo,
        resumo,
        cep_alvo,
        bairro,
        cidade,
        estado,
        vereador_alvo,
        meta_assinaturas,
        total_assinaturas,
        status
      )
      VALUES (
        pauta_uuid,
        'oposicao_ato',
        'Solicitação Popular de Revisão: ' || v_pauta.titulo,
        v_pauta.impacto_bairro,
        v_pauta.cep_alvo,
        v_pauta.bairro_alvo,
        v_pauta.cidade_alvo,
        v_pauta.estado_alvo,
        v_pauta.vereador_proponente,
        v_quorum_efetivo,
        v_pauta.votos_discordar,
        'rascunho'
      )
      RETURNING id INTO v_peticao_id;

      -- Importa os votos de oposição iniciais como assinaturas únicas
      INSERT INTO public.assinaturas_peticao (peticao_id, user_id, comentario)
      SELECT v_peticao_id, vp.user_id, vp.motivo_discordancia
        FROM public.votos_pauta vp
       WHERE vp.pauta_id = pauta_uuid
         AND vp.opcao_voto = 'discordar'
      ON CONFLICT (peticao_id, user_id) DO NOTHING;

      UPDATE public.pautas_ia
         SET status = 'peticao_gerada'
       WHERE id = pauta_uuid;
    END IF;

    RETURN TRUE;
  END IF;

  RETURN FALSE;
END;
$$;

-- ────────────────────────────────────────────────────────────
-- 5. Feed de Zeladoria: cidade/estado, curtidas reais e comentários
-- ────────────────────────────────────────────────────────────
ALTER TABLE public.posts_comunidade
  ADD COLUMN IF NOT EXISTS cidade TEXT NOT NULL DEFAULT 'São José dos Campos',
  ADD COLUMN IF NOT EXISTS estado TEXT NOT NULL DEFAULT 'SP';

CREATE INDEX IF NOT EXISTS idx_posts_comunidade_cidade_estado
  ON public.posts_comunidade (LOWER(cidade), UPPER(estado));

-- Preenche cidade/estado dos posts existentes com base no cadastro do autor
UPDATE public.posts_comunidade p
   SET cidade = u.cidade,
       estado = u.estado
  FROM public.users u
 WHERE p.user_id = u.id
   AND (p.cidade IS NULL OR p.cidade = 'São José dos Campos');

-- Tabela e RPC de curtidas reais
CREATE TABLE IF NOT EXISTS public.post_curtidas (
  id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  post_id    UUID NOT NULL REFERENCES public.posts_comunidade(id) ON DELETE CASCADE,
  user_id    UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (post_id, user_id)
);

ALTER TABLE public.post_curtidas ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "post_curtidas: leitura publica" ON public.post_curtidas;
CREATE POLICY "post_curtidas: leitura publica"
  ON public.post_curtidas FOR SELECT
  USING (auth.uid() = user_id OR public.is_admin());

DROP POLICY IF EXISTS "post_curtidas: insert proprio" ON public.post_curtidas;
CREATE POLICY "post_curtidas: insert proprio"
  ON public.post_curtidas FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "post_curtidas: delete proprio" ON public.post_curtidas;
CREATE POLICY "post_curtidas: delete proprio"
  ON public.post_curtidas FOR DELETE
  USING (auth.uid() = user_id);

CREATE OR REPLACE FUNCTION public.toggle_curtir_post(p_post_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_uid        UUID;
  v_ja_curtiu  BOOLEAN;
  v_total      INT;
BEGIN
  v_uid := auth.uid();
  IF v_uid IS NULL THEN
    RAISE EXCEPTION 'Usuário não autenticado';
  END IF;

  SELECT EXISTS (
    SELECT 1 FROM public.post_curtidas
     WHERE post_id = p_post_id AND user_id = v_uid
  ) INTO v_ja_curtiu;

  IF v_ja_curtiu THEN
    DELETE FROM public.post_curtidas
     WHERE post_id = p_post_id AND user_id = v_uid;
  ELSE
    INSERT INTO public.post_curtidas (post_id, user_id)
    VALUES (p_post_id, v_uid)
    ON CONFLICT (post_id, user_id) DO NOTHING;
  END IF;

  SELECT COUNT(*)::INT
    INTO v_total
    FROM public.post_curtidas
   WHERE post_id = p_post_id;

  UPDATE public.posts_comunidade
     SET curtidas = v_total
   WHERE id = p_post_id;

  RETURN jsonb_build_object(
    'curtido', NOT v_ja_curtiu,
    'curtidas', v_total
  );
END;
$$;

-- Atualiza criar_post_zeladoria para salvar cidade e estado corretamente
DROP FUNCTION IF EXISTS public.criar_post_zeladoria(TEXT, TEXT, TEXT, TEXT, TEXT, TEXT);
DROP FUNCTION IF EXISTS public.criar_post_zeladoria(TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT);

CREATE OR REPLACE FUNCTION public.criar_post_zeladoria(
  p_foto_url  TEXT,
  p_descricao TEXT,
  p_cep       TEXT,
  p_bairro    TEXT,
  p_categoria TEXT,
  p_protocolo TEXT,
  p_cidade    TEXT DEFAULT NULL,
  p_estado    TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_uid     UUID;
  v_cidade  TEXT;
  v_estado  TEXT;
  v_novo_id UUID;
BEGIN
  v_uid := auth.uid();
  IF v_uid IS NULL THEN
    RAISE EXCEPTION 'Usuário não autenticado';
  END IF;

  IF NULLIF(TRIM(COALESCE(p_descricao, '')), '') IS NULL THEN
    RAISE EXCEPTION 'Descrição obrigatória';
  END IF;

  SELECT COALESCE(NULLIF(TRIM(p_cidade), ''), u.cidade),
         UPPER(COALESCE(NULLIF(TRIM(p_estado), ''), u.estado))
    INTO v_cidade, v_estado
    FROM public.users u
   WHERE u.id = v_uid;

  IF v_cidade IS NULL THEN
    RAISE EXCEPTION 'Perfil de cidadão não encontrado';
  END IF;

  INSERT INTO public.posts_comunidade (
    user_id,
    foto_url,
    descricao,
    cep,
    bairro,
    cidade,
    estado,
    categoria,
    numero_protocolo,
    curtidas,
    moradores_afetados
  )
  VALUES (
    v_uid,
    p_foto_url,
    TRIM(p_descricao),
    p_cep,
    p_bairro,
    v_cidade,
    v_estado,
    p_categoria,
    p_protocolo,
    0,
    1
  )
  RETURNING id INTO v_novo_id;

  RETURN jsonb_build_object(
    'success', true,
    'post_id', v_novo_id,
    'numero_protocolo', p_protocolo,
    'cidade', v_cidade,
    'estado', v_estado
  );
END;
$$;

-- Permite que admin também remova comentários abusivos
DROP POLICY IF EXISTS "comentarios: delete dono" ON public.comentarios;
CREATE POLICY "comentarios: delete dono ou admin"
  ON public.comentarios FOR DELETE
  USING (auth.uid() = user_id OR public.is_admin());

-- ────────────────────────────────────────────────────────────
-- 6. Promove a conta fundadora para Super Admin
-- ────────────────────────────────────────────────────────────
UPDATE public.users
   SET role = 'super_admin',
       nivel_verificacao = 2
 WHERE LOWER(email) = 'geremps@gmail.com';

