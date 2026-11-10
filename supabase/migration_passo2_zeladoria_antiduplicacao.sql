-- ============================================================
-- Connecta — Passo 2: Zeladoria, Storage e Anti-Duplicação
-- Executar no Supabase SQL Editor
-- ============================================================

-- 1. CAMPO DE MORADORES AFETADOS EM posts_comunidade
ALTER TABLE public.posts_comunidade
  ADD COLUMN IF NOT EXISTS moradores_afetados INT DEFAULT 1;

-- 2. TABELA DE APOIOS/AFETADOS ("Também me afeta / +1")
CREATE TABLE IF NOT EXISTS public.post_apoios (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  post_id UUID NOT NULL REFERENCES public.posts_comunidade(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (post_id, user_id)
);

-- RLS para post_apoios
ALTER TABLE public.post_apoios ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "post_apoios: leitura pública" ON public.post_apoios;
CREATE POLICY "post_apoios: leitura pública"
  ON public.post_apoios FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "post_apoios: insert permitido" ON public.post_apoios;
CREATE POLICY "post_apoios: insert permitido"
  ON public.post_apoios FOR INSERT
  WITH CHECK (true);

DROP POLICY IF EXISTS "post_apoios: delete permitido" ON public.post_apoios;
CREATE POLICY "post_apoios: delete permitido"
  ON public.post_apoios FOR DELETE
  USING (true);

-- 3. FUNÇÃO RPC: toggle_apoiar_post
-- Permite ao cidadão dar "+1 / Também me afeta" ou remover se já clicou
CREATE OR REPLACE FUNCTION public.toggle_apoiar_post(
  p_post_id UUID,
  p_user_id UUID
)
RETURNS JSONB AS $$
DECLARE
  v_ja_apoiou BOOLEAN;
  v_total INT;
BEGIN
  -- Verifica se o usuário já apoiou
  SELECT EXISTS (
    SELECT 1 FROM public.post_apoios
    WHERE post_id = p_post_id AND user_id = p_user_id
  ) INTO v_ja_apoiou;

  IF v_ja_apoiou THEN
    -- Remove apoio
    DELETE FROM public.post_apoios
    WHERE post_id = p_post_id AND user_id = p_user_id;
  ELSE
    -- Adiciona apoio
    INSERT INTO public.post_apoios (post_id, user_id)
    VALUES (p_post_id, p_user_id)
    ON CONFLICT (post_id, user_id) DO NOTHING;
  END IF;

  -- Conta total de apoios (+ 1 do autor original)
  SELECT (COALESCE(COUNT(*), 0) + 1)
    INTO v_total
    FROM public.post_apoios
   WHERE post_id = p_post_id;

  -- Atualiza o contador na tabela posts_comunidade
  UPDATE public.posts_comunidade
     SET moradores_afetados = v_total
   WHERE id = p_post_id;

  RETURN jsonb_build_object(
    'apoiado', NOT v_ja_apoiou,
    'moradores_afetados', v_total
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. FUNÇÃO RPC: criar_post_zeladoria
-- Cria um novo chamado oficial de zeladoria com número de protocolo
CREATE OR REPLACE FUNCTION public.criar_post_zeladoria(
  p_user_id UUID,
  p_foto_url TEXT,
  p_descricao TEXT,
  p_cep TEXT,
  p_bairro TEXT,
  p_categoria TEXT,
  p_protocolo TEXT
)
RETURNS JSONB AS $$
DECLARE
  v_novo_id UUID;
BEGIN
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
  ) VALUES (
    p_user_id,
    p_foto_url,
    p_descricao,
    p_cep,
    p_bairro,
    p_categoria,
    p_protocolo,
    0,
    1
  ) RETURNING id INTO v_novo_id;

  RETURN jsonb_build_object(
    'success', true,
    'post_id', v_novo_id,
    'numero_protocolo', p_protocolo
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5. STORAGE BUCKET: zeladoria-fotos
-- Permite upload e visualização pública de fotos de zeladoria
INSERT INTO storage.buckets (id, name, public)
VALUES ('zeladoria-fotos', 'zeladoria-fotos', true)
ON CONFLICT (id) DO NOTHING;

-- Políticas de Storage
DROP POLICY IF EXISTS "zeladoria-fotos: leitura pública" ON storage.objects;
CREATE POLICY "zeladoria-fotos: leitura pública"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'zeladoria-fotos');

DROP POLICY IF EXISTS "zeladoria-fotos: upload público" ON storage.objects;
CREATE POLICY "zeladoria-fotos: upload público"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'zeladoria-fotos');
