-- ============================================================
-- ConectaBr — Sprint 1: Hardening de Segurança, PostGIS, Auth & LGPD
-- Executar no SQL Editor do Supabase (idempotente e seguro)
-- ============================================================

-- ────────────────────────────────────────────────────────────
-- 1. Mover extensão PostGIS para o schema `extensions`
--    Resolve definitivamente o alerta crítico:
--    rls_disabled_in_public (public.spatial_ref_sys)
--    Preserva coordenadas existentes em public.users (sem perda de dados).
-- ────────────────────────────────────────────────────────────
CREATE SCHEMA IF NOT EXISTS extensions;
GRANT USAGE ON SCHEMA extensions TO postgres, anon, authenticated, service_role;

DO $$
DECLARE
  v_ext_schema TEXT;
BEGIN
  SELECT n.nspname
    INTO v_ext_schema
    FROM pg_extension e
    JOIN pg_namespace n ON n.oid = e.extnamespace
   WHERE e.extname = 'postgis';

  IF v_ext_schema = 'public' THEN
    -- Salva lat/lng temporariamente antes de recriar a extensão em extensions
    IF EXISTS (
      SELECT 1
        FROM information_schema.columns
       WHERE table_schema = 'public'
         AND table_name = 'users'
         AND column_name = 'coordenadas'
    ) THEN
      ALTER TABLE public.users ADD COLUMN IF NOT EXISTS _tmp_lat DOUBLE PRECISION;
      ALTER TABLE public.users ADD COLUMN IF NOT EXISTS _tmp_lng DOUBLE PRECISION;

      EXECUTE '
        UPDATE public.users
           SET _tmp_lat = public.ST_Y(coordenadas::public.geometry),
               _tmp_lng = public.ST_X(coordenadas::public.geometry)
         WHERE coordenadas IS NOT NULL
      ';
    END IF;

    DROP INDEX IF EXISTS public.idx_users_coordenadas;
    DROP EXTENSION IF EXISTS postgis CASCADE;
    CREATE EXTENSION postgis SCHEMA extensions;

    IF NOT EXISTS (
      SELECT 1
        FROM information_schema.columns
       WHERE table_schema = 'public'
         AND table_name = 'users'
         AND column_name = 'coordenadas'
    ) THEN
      EXECUTE 'ALTER TABLE public.users ADD COLUMN coordenadas extensions.GEOGRAPHY(POINT, 4326)';
    END IF;

    IF EXISTS (
      SELECT 1
        FROM information_schema.columns
       WHERE table_schema = 'public'
         AND table_name = 'users'
         AND column_name = '_tmp_lat'
    ) THEN
      EXECUTE '
        UPDATE public.users
           SET coordenadas = extensions.ST_SetSRID(extensions.ST_MakePoint(_tmp_lng, _tmp_lat), 4326)::extensions.geography
         WHERE _tmp_lat IS NOT NULL AND _tmp_lng IS NOT NULL
      ';

      ALTER TABLE public.users DROP COLUMN IF EXISTS _tmp_lat;
      ALTER TABLE public.users DROP COLUMN IF EXISTS _tmp_lng;
    END IF;

    CREATE INDEX IF NOT EXISTS idx_users_coordenadas ON public.users USING GIST (coordenadas);
  ELSIF v_ext_schema IS NULL THEN
    CREATE EXTENSION IF NOT EXISTS postgis SCHEMA extensions;
  END IF;
END $$;

-- ────────────────────────────────────────────────────────────
-- 2. Papel de Administrador (`role`) & Proteção anti-escalonamento
-- ────────────────────────────────────────────────────────────
ALTER TABLE public.users
  ADD COLUMN IF NOT EXISTS role TEXT NOT NULL DEFAULT 'cidadao';

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'users_role_check'
  ) THEN
    ALTER TABLE public.users
      ADD CONSTRAINT users_role_check CHECK (role IN ('cidadao', 'admin'));
  END IF;
END $$;

-- Helper anti-recursão para checar admin em policies RLS
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
       AND role = 'admin'
  );
$$;

-- Impede que usuários comuns promovam o próprio role, nivel_verificacao ou cpf_hash via API
CREATE OR REPLACE FUNCTION public.fn_protect_user_privileged_fields()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF current_setting('role', true) IN ('anon', 'authenticated') THEN
    IF TG_OP = 'INSERT' THEN
      NEW.role := 'cidadao';
      NEW.nivel_verificacao := LEAST(COALESCE(NEW.nivel_verificacao, 1), 1);
      NEW.cpf_hash := NULL;
    ELSIF TG_OP = 'UPDATE' THEN
      NEW.id := OLD.id;
      NEW.role := OLD.role;
      NEW.nivel_verificacao := OLD.nivel_verificacao;
      NEW.cpf_hash := OLD.cpf_hash;
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_protect_user_privileged_fields ON public.users;
CREATE TRIGGER trg_protect_user_privileged_fields
  BEFORE INSERT OR UPDATE ON public.users
  FOR EACH ROW
  EXECUTE FUNCTION public.fn_protect_user_privileged_fields();

-- ────────────────────────────────────────────────────────────
-- 3. Correção LGPD: Tabela pública `perfis_publicos` (sem PII)
--    Separa dados públicos (nome, avatar, bairro, nível)
--    de dados sensíveis (email, phone, cep, cpf_hash, coordenadas, role).
-- ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.perfis_publicos (
  id                UUID PRIMARY KEY REFERENCES public.users(id) ON DELETE CASCADE,
  nome_completo     TEXT NOT NULL,
  avatar_url        TEXT,
  bairro            TEXT NOT NULL,
  cidade            TEXT NOT NULL,
  estado            TEXT NOT NULL,
  nivel_verificacao SMALLINT NOT NULL DEFAULT 1,
  updated_at        TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.perfis_publicos ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "perfis_publicos: leitura publica" ON public.perfis_publicos;
CREATE POLICY "perfis_publicos: leitura publica"
  ON public.perfis_publicos FOR SELECT
  USING (true);

CREATE OR REPLACE FUNCTION public.fn_sync_perfil_publico()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.perfis_publicos (
    id, nome_completo, avatar_url, bairro, cidade, estado, nivel_verificacao, updated_at
  )
  VALUES (
    NEW.id,
    NEW.nome_completo,
    NEW.avatar_url,
    NEW.bairro,
    NEW.cidade,
    NEW.estado,
    COALESCE(NEW.nivel_verificacao, 1),
    NOW()
  )
  ON CONFLICT (id) DO UPDATE
    SET nome_completo     = EXCLUDED.nome_completo,
        avatar_url        = EXCLUDED.avatar_url,
        bairro            = EXCLUDED.bairro,
        cidade            = EXCLUDED.cidade,
        estado            = EXCLUDED.estado,
        nivel_verificacao = EXCLUDED.nivel_verificacao,
        updated_at        = NOW();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_sync_perfil_publico ON public.users;
CREATE TRIGGER trg_sync_perfil_publico
  AFTER INSERT OR UPDATE OF nome_completo, avatar_url, bairro, cidade, estado, nivel_verificacao
  ON public.users
  FOR EACH ROW
  EXECUTE FUNCTION public.fn_sync_perfil_publico();

-- Backfill inicial para perfis já existentes no banco
INSERT INTO public.perfis_publicos (id, nome_completo, avatar_url, bairro, cidade, estado, nivel_verificacao)
SELECT id, nome_completo, avatar_url, bairro, cidade, estado, COALESCE(nivel_verificacao, 1)
  FROM public.users
ON CONFLICT (id) DO UPDATE
  SET nome_completo     = EXCLUDED.nome_completo,
      avatar_url        = EXCLUDED.avatar_url,
      bairro            = EXCLUDED.bairro,
      cidade            = EXCLUDED.cidade,
      estado            = EXCLUDED.estado,
      nivel_verificacao = EXCLUDED.nivel_verificacao,
      updated_at        = NOW();

-- FK para permitir join PostgREST em posts_comunidade e comentarios sem expor public.users
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'posts_comunidade_perfil_publico_fkey'
  ) THEN
    ALTER TABLE public.posts_comunidade
      ADD CONSTRAINT posts_comunidade_perfil_publico_fkey
      FOREIGN KEY (user_id) REFERENCES public.perfis_publicos(id) ON DELETE CASCADE;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'comentarios_perfil_publico_fkey'
  ) THEN
    ALTER TABLE public.comentarios
      ADD CONSTRAINT comentarios_perfil_publico_fkey
      FOREIGN KEY (user_id) REFERENCES public.perfis_publicos(id) ON DELETE CASCADE;
  END IF;
END $$;

-- Restringe leitura de `public.users` apenas ao próprio dono ou administrador
DROP POLICY IF EXISTS "users: leitura pública" ON public.users;
DROP POLICY IF EXISTS "users: ler próprio perfil" ON public.users;
CREATE POLICY "users: ler próprio perfil"
  ON public.users FOR SELECT
  USING (auth.uid() = id OR public.is_admin());

DROP POLICY IF EXISTS "users: inserir próprio perfil" ON public.users;
CREATE POLICY "users: inserir próprio perfil"
  ON public.users FOR INSERT
  WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "users: atualizar próprio perfil" ON public.users;
CREATE POLICY "users: atualizar próprio perfil"
  ON public.users FOR UPDATE
  USING (auth.uid() = id OR public.is_admin())
  WITH CHECK (auth.uid() = id OR public.is_admin());

-- ────────────────────────────────────────────────────────────
-- 4. Sincronização automática Auth -> public.users no Cadastro
-- ────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.fn_handle_new_auth_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_nome        TEXT;
  v_phone       TEXT;
  v_cep         TEXT;
  v_bairro      TEXT;
  v_cidade      TEXT;
  v_estado      TEXT;
  v_codigo_ibge TEXT;
BEGIN
  v_nome := COALESCE(
    NULLIF(TRIM(NEW.raw_user_meta_data->>'nome_completo'), ''),
    split_part(COALESCE(NEW.email, ''), '@', 1),
    'Cidadão'
  );
  v_phone := NULLIF(REGEXP_REPLACE(COALESCE(NEW.raw_user_meta_data->>'phone', ''), '\D', '', 'g'), '');
  v_cep := COALESCE(NULLIF(TRIM(NEW.raw_user_meta_data->>'cep'), ''), '00000-000');
  v_bairro := COALESCE(NULLIF(TRIM(NEW.raw_user_meta_data->>'bairro'), ''), 'Centro');
  v_cidade := COALESCE(NULLIF(TRIM(NEW.raw_user_meta_data->>'cidade'), ''), 'São José dos Campos');
  v_estado := UPPER(LEFT(COALESCE(NULLIF(TRIM(NEW.raw_user_meta_data->>'estado'), ''), 'SP'), 2));
  v_codigo_ibge := NULLIF(TRIM(NEW.raw_user_meta_data->>'codigo_ibge'), '');

  INSERT INTO public.users (
    id, email, phone, nome_completo, cep, bairro, cidade, estado, codigo_ibge, nivel_verificacao, role
  )
  VALUES (
    NEW.id,
    LOWER(TRIM(NEW.email)),
    v_phone,
    v_nome,
    v_cep,
    v_bairro,
    v_cidade,
    v_estado,
    v_codigo_ibge,
    1,
    'cidadao'
  )
  ON CONFLICT (id) DO NOTHING;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.fn_handle_new_auth_user();

-- ────────────────────────────────────────────────────────────
-- 5. Hardening de `votos_pauta`, `pautas_ia`, `peticoes` e `cidades_config`
-- ────────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "votos_pauta: leitura pública" ON public.votos_pauta;
DROP POLICY IF EXISTS "votos_pauta: leitura proprio ou admin" ON public.votos_pauta;
CREATE POLICY "votos_pauta: leitura proprio ou admin"
  ON public.votos_pauta FOR SELECT
  USING (auth.uid() = user_id OR public.is_admin());

DROP POLICY IF EXISTS "pautas_ia: insert apenas service_role" ON public.pautas_ia;
CREATE POLICY "pautas_ia: insert apenas admin ou service_role"
  ON public.pautas_ia FOR INSERT
  WITH CHECK (current_setting('role', true) = 'service_role' OR public.is_admin());

DROP POLICY IF EXISTS "pautas_ia: update apenas service_role" ON public.pautas_ia;
CREATE POLICY "pautas_ia: update apenas admin ou service_role"
  ON public.pautas_ia FOR UPDATE
  USING (current_setting('role', true) = 'service_role' OR public.is_admin())
  WITH CHECK (current_setting('role', true) = 'service_role' OR public.is_admin());

DROP POLICY IF EXISTS "pautas_ia: delete apenas admin ou service_role" ON public.pautas_ia;
CREATE POLICY "pautas_ia: delete apenas admin ou service_role"
  ON public.pautas_ia FOR DELETE
  USING (current_setting('role', true) = 'service_role' OR public.is_admin());

DROP POLICY IF EXISTS "peticoes: insert apenas service_role" ON public.peticoes;
CREATE POLICY "peticoes: insert apenas admin ou service_role"
  ON public.peticoes FOR INSERT
  WITH CHECK (current_setting('role', true) = 'service_role' OR public.is_admin());

DROP POLICY IF EXISTS "peticoes: update apenas service_role" ON public.peticoes;
CREATE POLICY "peticoes: update apenas admin ou service_role"
  ON public.peticoes FOR UPDATE
  USING (current_setting('role', true) = 'service_role' OR public.is_admin())
  WITH CHECK (current_setting('role', true) = 'service_role' OR public.is_admin());

DROP POLICY IF EXISTS "cidades_config: modificacao service_role" ON public.cidades_config;
CREATE POLICY "cidades_config: modificacao admin ou service_role"
  ON public.cidades_config FOR ALL
  USING (current_setting('role', true) = 'service_role' OR public.is_admin())
  WITH CHECK (current_setting('role', true) = 'service_role' OR public.is_admin());

-- ────────────────────────────────────────────────────────────
-- 6. Hardening de `post_apoios`, RPCs e Storage (`zeladoria-fotos`)
-- ────────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "post_apoios: insert permitido" ON public.post_apoios;
CREATE POLICY "post_apoios: insert proprio"
  ON public.post_apoios FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "post_apoios: delete permitido" ON public.post_apoios;
CREATE POLICY "post_apoios: delete proprio"
  ON public.post_apoios FOR DELETE
  USING (auth.uid() = user_id);

-- Remove assinaturas antigas que aceitavam p_user_id arbitrário do cliente
DROP FUNCTION IF EXISTS public.toggle_apoiar_post(UUID, UUID);
DROP FUNCTION IF EXISTS public.toggle_apoiar_post(UUID);

CREATE FUNCTION public.toggle_apoiar_post(p_post_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_uid        UUID;
  v_ja_apoiou  BOOLEAN;
  v_total      INT;
BEGIN
  v_uid := auth.uid();
  IF v_uid IS NULL THEN
    RAISE EXCEPTION 'Usuário não autenticado';
  END IF;

  SELECT EXISTS (
    SELECT 1 FROM public.post_apoios
     WHERE post_id = p_post_id AND user_id = v_uid
  ) INTO v_ja_apoiou;

  IF v_ja_apoiou THEN
    DELETE FROM public.post_apoios
     WHERE post_id = p_post_id AND user_id = v_uid;
  ELSE
    INSERT INTO public.post_apoios (post_id, user_id)
    VALUES (p_post_id, v_uid)
    ON CONFLICT (post_id, user_id) DO NOTHING;
  END IF;

  SELECT (COALESCE(COUNT(*), 0) + 1)
    INTO v_total
    FROM public.post_apoios
   WHERE post_id = p_post_id;

  UPDATE public.posts_comunidade
     SET moradores_afetados = v_total
   WHERE id = p_post_id;

  RETURN jsonb_build_object(
    'apoiado', NOT v_ja_apoiou,
    'moradores_afetados', v_total
  );
END;
$$;

DROP FUNCTION IF EXISTS public.criar_post_zeladoria(UUID, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT);
DROP FUNCTION IF EXISTS public.criar_post_zeladoria(TEXT, TEXT, TEXT, TEXT, TEXT, TEXT);

CREATE FUNCTION public.criar_post_zeladoria(
  p_foto_url  TEXT,
  p_descricao TEXT,
  p_cep       TEXT,
  p_bairro    TEXT,
  p_categoria TEXT,
  p_protocolo TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_uid     UUID;
  v_novo_id UUID;
BEGIN
  v_uid := auth.uid();
  IF v_uid IS NULL THEN
    RAISE EXCEPTION 'Usuário não autenticado';
  END IF;

  IF NULLIF(TRIM(COALESCE(p_descricao, '')), '') IS NULL THEN
    RAISE EXCEPTION 'Descrição obrigatória';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM public.users WHERE id = v_uid) THEN
    RAISE EXCEPTION 'Perfil de cidadão não encontrado';
  END IF;

  INSERT INTO public.posts_comunidade (
    user_id,
    foto_url,
    descricao,
    cep,
    bairro,
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
    p_categoria,
    p_protocolo,
    0,
    1
  )
  RETURNING id INTO v_novo_id;

  RETURN jsonb_build_object(
    'success', true,
    'post_id', v_novo_id,
    'numero_protocolo', p_protocolo
  );
END;
$$;

-- Restringe uploads no bucket zeladoria-fotos (somente usuário logado, na própria pasta, imagem até 5 MB)
UPDATE storage.buckets
   SET public = true,
       file_size_limit = 5242880,
       allowed_mime_types = ARRAY['image/jpeg', 'image/png', 'image/webp']
 WHERE id = 'zeladoria-fotos';

DROP POLICY IF EXISTS "zeladoria-fotos: upload público" ON storage.objects;
DROP POLICY IF EXISTS "zeladoria-fotos: upload autenticado proprio" ON storage.objects;
CREATE POLICY "zeladoria-fotos: upload autenticado proprio"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'zeladoria-fotos'
    AND auth.role() = 'authenticated'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

DROP POLICY IF EXISTS "zeladoria-fotos: delete proprio" ON storage.objects;
CREATE POLICY "zeladoria-fotos: delete proprio"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'zeladoria-fotos'
    AND auth.role() = 'authenticated'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

-- ────────────────────────────────────────────────────────────
-- 7. Fixar search_path nas funções existentes (Security Advisor)
-- ────────────────────────────────────────────────────────────
ALTER FUNCTION public.fn_incrementar_votos_pauta() SET search_path = public;
ALTER FUNCTION public.check_peticao_threshold(UUID, INT) SET search_path = public;
ALTER FUNCTION public.get_or_create_cidade_espera(TEXT, TEXT, TEXT) SET search_path = public;

-- ────────────────────────────────────────────────────────────
-- 8. Storage Bucket `avatars` para foto de perfil
-- ────────────────────────────────────────────────────────────
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'avatars',
  'avatars',
  true,
  2097152,
  ARRAY['image/jpeg', 'image/png', 'image/webp']
)
ON CONFLICT (id) DO UPDATE
  SET public = true,
      file_size_limit = 2097152,
      allowed_mime_types = ARRAY['image/jpeg', 'image/png', 'image/webp'];

DROP POLICY IF EXISTS "avatars: leitura pública" ON storage.objects;
CREATE POLICY "avatars: leitura pública"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'avatars');

DROP POLICY IF EXISTS "avatars: upload autenticado proprio" ON storage.objects;
CREATE POLICY "avatars: upload autenticado proprio"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'avatars'
    AND auth.role() = 'authenticated'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

DROP POLICY IF EXISTS "avatars: update proprio" ON storage.objects;
CREATE POLICY "avatars: update proprio"
  ON storage.objects FOR UPDATE
  USING (
    bucket_id = 'avatars'
    AND auth.role() = 'authenticated'
    AND (storage.foldername(name))[1] = auth.uid()::text
  )
  WITH CHECK (
    bucket_id = 'avatars'
    AND auth.role() = 'authenticated'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

DROP POLICY IF EXISTS "avatars: delete proprio" ON storage.objects;
CREATE POLICY "avatars: delete proprio"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'avatars'
    AND auth.role() = 'authenticated'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

