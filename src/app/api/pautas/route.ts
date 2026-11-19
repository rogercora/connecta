import { NextResponse } from 'next/server';
import { requireAdminUser } from '@/lib/auth/serverAuth';
import { createSupabaseServerClient, getSupabaseAdmin } from '@/lib/supabase/server';

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const ALLOWED_STATUS = new Set(['pendente_revisao', 'ativa', 'encerrada', 'peticao_gerada']);

function sanitizeExternalHttpsUrl(raw: unknown): string | null {
  if (typeof raw !== 'string' || !raw.trim()) return null;
  try {
    const parsed = new URL(raw.trim());
    if (parsed.protocol !== 'https:') return null;
    return parsed.toString();
  } catch {
    return null;
  }
}

// GET: Lista pautas cadastradas (leitura pública via cliente server com RLS)
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const cidade = searchParams.get('cidade');
    const status = searchParams.get('status');

    const supabase = await createSupabaseServerClient();

    let query = supabase
      .from('pautas_ia')
      .select('*')
      .order('created_at', { ascending: false });

    if (cidade && cidade !== 'todas') {
      query = query.ilike('cidade_alvo', `%${cidade}%`);
    }

    if (status && status !== 'todos') {
      query = query.eq('status', status);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Erro ao consultar pautas no Supabase:', error.message);
      return NextResponse.json(
        { error: 'Não foi possível carregar as pautas.' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      pautas: data ?? [],
      source: 'supabase',
    });
  } catch (error: any) {
    console.error('Exceção em GET /api/pautas:', error?.message);
    return NextResponse.json({ error: 'Erro interno ao buscar pautas.' }, { status: 500 });
  }
}

// POST: Publica uma nova pauta (restrito a Administradores)
export async function POST(req: Request) {
  try {
    const auth = await requireAdminUser();
    if (!auth.ok) return auth.response;

    const body = await req.json();
    const {
      titulo,
      resumo_ia,
      impacto_bairro,
      vereador_proponente,
      bairro_alvo = 'Jardim Aquárius',
      cidade_alvo = 'São José dos Campos',
      estado_alvo = 'SP',
      cep_alvo = '12246-021',
      link_pdf_original = null,
      fonte_diario = 'Diário Oficial de São José dos Campos',
      status = 'ativa',
      quorum_meta = null,
      categoria = 'geral',
      edicao_diario = null,
      data_votacao = new Date(Date.now() + 86400000 * 2).toISOString(),
    } = body ?? {};

    if (
      typeof titulo !== 'string' || !titulo.trim() ||
      typeof resumo_ia !== 'string' || !resumo_ia.trim() ||
      typeof impacto_bairro !== 'string' || !impacto_bairro.trim() ||
      typeof vereador_proponente !== 'string' || !vereador_proponente.trim()
    ) {
      return NextResponse.json(
        { error: 'Campos obrigatórios ausentes (título, resumo, impacto, vereador proponente).' },
        { status: 400 }
      );
    }

    const estadoLimpo = String(estado_alvo || 'SP').trim().toUpperCase().slice(0, 2);
    if (estadoLimpo.length !== 2) {
      return NextResponse.json({ error: 'UF inválida.' }, { status: 400 });
    }

    const statusFinal = ALLOWED_STATUS.has(status) ? status : 'ativa';
    const parsedQuorum =
      quorum_meta !== null && quorum_meta !== undefined && Number(quorum_meta) >= 1
        ? Math.round(Number(quorum_meta))
        : null;

    if (parsedQuorum !== null && auth.profile?.role !== 'super_admin') {
      return NextResponse.json(
        { error: 'Apenas o Super Admin pode definir quórum customizado por projeto.' },
        { status: 403 }
      );
    }

    const novaPauta = {
      titulo: titulo.trim().slice(0, 300),
      resumo_ia: resumo_ia.trim().slice(0, 2000),
      impacto_bairro: impacto_bairro.trim().slice(0, 1000),
      vereador_proponente: vereador_proponente.trim().slice(0, 200),
      bairro_alvo: String(bairro_alvo).trim().slice(0, 120),
      cidade_alvo: String(cidade_alvo).trim().slice(0, 120),
      estado_alvo: estadoLimpo,
      cep_alvo: String(cep_alvo).trim().slice(0, 20),
      link_pdf_original: sanitizeExternalHttpsUrl(link_pdf_original),
      fonte_diario: typeof fonte_diario === 'string' ? fonte_diario.trim().slice(0, 250) : null,
      quorum_meta: parsedQuorum,
      categoria: typeof categoria === 'string' && categoria.trim() ? categoria.trim().slice(0, 60) : 'geral',
      edicao_diario: typeof edicao_diario === 'string' && edicao_diario.trim() ? edicao_diario.trim().slice(0, 120) : null,
      status: statusFinal,
      data_votacao,
      votos_concordar: 0,
      votos_discordar: 0,
    };

    const supabaseAdmin = getSupabaseAdmin();
    const { data, error } = await supabaseAdmin
      .from('pautas_ia')
      .insert([novaPauta])
      .select()
      .single();

    if (error || !data) {
      console.error('Erro ao gravar pauta no Supabase:', error?.message);
      return NextResponse.json(
        { error: 'Não foi possível gravar a pauta no banco de dados Supabase.' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      pauta: data,
    });
  } catch (error: any) {
    console.error('Exceção em POST /api/pautas:', error?.message);
    return NextResponse.json({ error: 'Erro interno ao publicar pauta.' }, { status: 500 });
  }
}

// PATCH: Publica, encerra ou altera quórum customizado de uma pauta
export async function PATCH(req: Request) {
  try {
    const auth = await requireAdminUser();
    if (!auth.ok) return auth.response;

    const body = await req.json();
    const { id, status, quorum_meta } = body ?? {};

    if (!id || typeof id !== 'string' || !UUID_REGEX.test(id)) {
      return NextResponse.json({ error: 'ID da pauta inválido.' }, { status: 400 });
    }

    const updates: Record<string, any> = {};

    if (status !== undefined) {
      if (!ALLOWED_STATUS.has(status)) {
        return NextResponse.json({ error: 'Status inválido.' }, { status: 400 });
      }
      updates.status = status;
    }

    if (quorum_meta !== undefined) {
      if (auth.profile?.role !== 'super_admin') {
        return NextResponse.json(
          { error: 'Apenas o Super Admin pode ajustar quórum específico de pauta.' },
          { status: 403 }
        );
      }
      if (quorum_meta === null || quorum_meta === '') {
        updates.quorum_meta = null;
      } else {
        const num = Number(quorum_meta);
        if (!Number.isFinite(num) || num < 1) {
          return NextResponse.json({ error: 'Quórum deve ser >= 1.' }, { status: 400 });
        }
        updates.quorum_meta = Math.round(num);
      }
    }

    if (Object.keys(updates).length === 0) {
      return NextResponse.json({ error: 'Nada para atualizar.' }, { status: 400 });
    }

    const supabaseAdmin = getSupabaseAdmin();
    const { data, error } = await supabaseAdmin
      .from('pautas_ia')
      .update(updates)
      .eq('id', id)
      .select('*')
      .single();

    if (error || !data) {
      return NextResponse.json({ error: 'Falha ao atualizar pauta.' }, { status: 500 });
    }

    return NextResponse.json({ success: true, pauta: data });
  } catch (error: any) {
    console.error('Exceção em PATCH /api/pautas:', error?.message);
    return NextResponse.json({ error: 'Erro interno ao atualizar pauta.' }, { status: 500 });
  }
}

// DELETE: Remove uma pauta do ar (restrito a Administradores)
export async function DELETE(req: Request) {
  try {
    const auth = await requireAdminUser();
    if (!auth.ok) return auth.response;

    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id || !UUID_REGEX.test(id)) {
      return NextResponse.json({ error: 'ID da pauta inválido ou ausente.' }, { status: 400 });
    }

    const supabaseAdmin = getSupabaseAdmin();
    const { error } = await supabaseAdmin
      .from('pautas_ia')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Erro ao deletar pauta:', error.message);
      return NextResponse.json({ error: 'Falha ao remover pauta.' }, { status: 500 });
    }

    return NextResponse.json({ success: true, message: 'Pauta removida com sucesso.' });
  } catch (error: any) {
    console.error('Exceção em DELETE /api/pautas:', error?.message);
    return NextResponse.json({ error: 'Erro interno ao remover pauta.' }, { status: 500 });
  }
}
