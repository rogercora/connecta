-- ============================================================
-- Connecta — Correção de Vulnerabilidade Supabase Security Advisor
-- Resolve: Critical issue: rls_disabled_in_public (spatial_ref_sys)
-- ============================================================

-- A extensão PostGIS cria a tabela spatial_ref_sys no schema public por padrão.
-- Como o PostgREST expõe tabelas do schema public na API, o Supabase emite um
-- alerta crítico se o Row Level Security (RLS) estiver desativado nessa tabela.

-- 1. Habilita RLS na tabela spatial_ref_sys
ALTER TABLE IF EXISTS public.spatial_ref_sys ENABLE ROW LEVEL SECURITY;

-- 2. Cria política estrita de apenas leitura (SELECT) pública
-- Bloqueia qualquer tentativa de INSERT, UPDATE ou DELETE via API pública/anônima.
DROP POLICY IF EXISTS "spatial_ref_sys_read_only" ON public.spatial_ref_sys;
CREATE POLICY "spatial_ref_sys_read_only"
  ON public.spatial_ref_sys
  FOR SELECT
  USING (true);

