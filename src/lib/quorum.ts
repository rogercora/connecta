import type { SupabaseClient } from '@supabase/supabase-js';

export interface CidadeQuorumResolved {
  cidade: string;
  estado: string;
  quorum_peticao: number;
  email_camara_padrao: string | null;
  email_ouvidoria_padrao: string | null;
}

const DEFAULT_QUORUM = 50;

export async function resolveCidadeQuorumConfig(
  supabase: SupabaseClient,
  cidade?: string | null,
  estado?: string | null
): Promise<CidadeQuorumResolved> {
  const cleanCidade = (cidade || 'São José dos Campos').trim();
  const cleanEstado = (estado || 'SP').trim().toUpperCase().slice(0, 2);

  try {
    const { data } = await supabase
      .from('cidades_config')
      .select('nome, estado, quorum_peticao, email_camara_padrao, email_ouvidoria_padrao')
      .ilike('nome', cleanCidade)
      .eq('estado', cleanEstado)
      .maybeSingle();

    if (data) {
      return {
        cidade: data.nome,
        estado: data.estado,
        quorum_peticao: Math.max(1, Number(data.quorum_peticao) || DEFAULT_QUORUM),
        email_camara_padrao: data.email_camara_padrao || null,
        email_ouvidoria_padrao: data.email_ouvidoria_padrao || null,
      };
    }
  } catch {
    // Fallback silencioso para o quórum padrão caso a coluna ainda esteja em rollout
  }

  return {
    cidade: cleanCidade,
    estado: cleanEstado,
    quorum_peticao: DEFAULT_QUORUM,
    email_camara_padrao: null,
    email_ouvidoria_padrao: null,
  };
}

