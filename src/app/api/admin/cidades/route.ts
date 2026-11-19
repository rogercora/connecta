import { NextResponse } from 'next/server';
import { requireAdminUser, requireSuperAdminUser } from '@/lib/auth/serverAuth';
import { getSupabaseAdmin } from '@/lib/supabase/server';

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const VALID_STATUS = new Set(['ativa', 'em_espera', 'em_breve']);

// GET: Lista cidades cadastradas com meta de moradores, quórum de petição e contagem atual de usuários
export async function GET() {
  try {
    const auth = await requireAdminUser();
    if (!auth.ok) return auth.response;

    const supabaseAdmin = getSupabaseAdmin();
    const { data: cidades, error } = await supabaseAdmin
      .from('cidades_config')
      .select('*')
      .order('status', { ascending: true })
      .order('nome', { ascending: true });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const { data: usersCountRows } = await supabaseAdmin
      .from('users')
      .select('cidade, estado');

    const contagem = new Map<string, number>();
    for (const row of usersCountRows ?? []) {
      const key = `${String(row.cidade || '').trim().toLowerCase()}|${String(row.estado || '').trim().toUpperCase()}`;
      contagem.set(key, (contagem.get(key) || 0) + 1);
    }

    const enriched = (cidades ?? []).map((c: any) => {
      const key = `${String(c.nome || '').trim().toLowerCase()}|${String(c.estado || '').trim().toUpperCase()}`;
      return {
        ...c,
        quorum_peticao: Number(c.quorum_peticao) || 50,
        total_cadastrados: contagem.get(key) || 0,
      };
    });

    return NextResponse.json({
      cidades: enriched,
      isSuperAdmin: auth.profile?.role === 'super_admin',
    });
  } catch (error: any) {
    console.error('Erro em GET /api/admin/cidades:', error?.message);
    return NextResponse.json({ error: 'Erro ao consultar configurações de cidades.' }, { status: 500 });
  }
}

// POST: Cadastra ou atualiza cidade e quórum (exclusivo Super Admin)
export async function POST(req: Request) {
  try {
    const auth = await requireSuperAdminUser();
    if (!auth.ok) return auth.response;

    const body = await req.json();
    const {
      nome,
      estado,
      codigo_ibge = null,
      status = 'ativa',
      meta_usuarios = 500,
      quorum_peticao = 50,
      email_camara_padrao = null,
      email_ouvidoria_padrao = null,
    } = body ?? {};

    if (typeof nome !== 'string' || nome.trim().length < 2) {
      return NextResponse.json({ error: 'Informe o nome da cidade.' }, { status: 400 });
    }
    const cleanEstado = String(estado || '').trim().toUpperCase();
    if (cleanEstado.length !== 2) {
      return NextResponse.json({ error: 'UF deve ter 2 letras (ex.: SP).' }, { status: 400 });
    }
    if (!VALID_STATUS.has(status)) {
      return NextResponse.json({ error: 'Status de cidade inválido.' }, { status: 400 });
    }

    const quorumNum = Math.max(1, Math.min(1000000, Number(quorum_peticao) || 50));
    const metaNum = Math.max(1, Math.min(10000000, Number(meta_usuarios) || 500));

    const supabaseAdmin = getSupabaseAdmin();
    const { data, error } = await supabaseAdmin
      .from('cidades_config')
      .upsert(
        {
          nome: nome.trim(),
          estado: cleanEstado,
          codigo_ibge: codigo_ibge ? String(codigo_ibge).trim() : null,
          status,
          meta_usuarios: metaNum,
          quorum_peticao: quorumNum,
          email_camara_padrao: email_camara_padrao ? String(email_camara_padrao).trim() : null,
          email_ouvidoria_padrao: email_ouvidoria_padrao ? String(email_ouvidoria_padrao).trim() : null,
        },
        { onConflict: 'nome,estado' }
      )
      .select('*')
      .single();

    if (error || !data) {
      return NextResponse.json({ error: error?.message || 'Erro ao salvar cidade.' }, { status: 500 });
    }

    return NextResponse.json({ success: true, cidade: data });
  } catch (error: any) {
    console.error('Erro em POST /api/admin/cidades:', error?.message);
    return NextResponse.json({ error: 'Erro interno ao salvar cidade.' }, { status: 500 });
  }
}

// PATCH: Atualiza status, meta de liberação, quórum de petição e e-mails oficiais (exclusivo Super Admin)
export async function PATCH(req: Request) {
  try {
    const auth = await requireSuperAdminUser();
    if (!auth.ok) return auth.response;

    const body = await req.json();
    const {
      id,
      status,
      meta_usuarios,
      quorum_peticao,
      email_camara_padrao,
      email_ouvidoria_padrao,
    } = body ?? {};

    if (!id || typeof id !== 'string' || !UUID_REGEX.test(id)) {
      return NextResponse.json({ error: 'ID de cidade inválido.' }, { status: 400 });
    }

    const updates: Record<string, any> = {};

    if (status !== undefined) {
      if (!VALID_STATUS.has(status)) {
        return NextResponse.json({ error: 'Status inválido.' }, { status: 400 });
      }
      updates.status = status;
    }

    if (meta_usuarios !== undefined) {
      const parsed = Number(meta_usuarios);
      if (!Number.isFinite(parsed) || parsed < 1) {
        return NextResponse.json({ error: 'Meta de moradores deve ser >= 1.' }, { status: 400 });
      }
      updates.meta_usuarios = Math.round(parsed);
    }

    if (quorum_peticao !== undefined) {
      const parsed = Number(quorum_peticao);
      if (!Number.isFinite(parsed) || parsed < 1) {
        return NextResponse.json({ error: 'Quórum de petição deve ser >= 1.' }, { status: 400 });
      }
      updates.quorum_peticao = Math.round(parsed);
    }

    if (email_camara_padrao !== undefined) {
      updates.email_camara_padrao = email_camara_padrao ? String(email_camara_padrao).trim() : null;
    }

    if (email_ouvidoria_padrao !== undefined) {
      updates.email_ouvidoria_padrao = email_ouvidoria_padrao ? String(email_ouvidoria_padrao).trim() : null;
    }

    if (Object.keys(updates).length === 0) {
      return NextResponse.json({ error: 'Nenhum campo informado para atualizar.' }, { status: 400 });
    }

    const supabaseAdmin = getSupabaseAdmin();
    const { data, error } = await supabaseAdmin
      .from('cidades_config')
      .update(updates)
      .eq('id', id)
      .select('*')
      .single();

    if (error || !data) {
      return NextResponse.json({ error: error?.message || 'Não foi possível atualizar a cidade.' }, { status: 500 });
    }

    return NextResponse.json({ success: true, cidade: data });
  } catch (error: any) {
    console.error('Erro em PATCH /api/admin/cidades:', error?.message);
    return NextResponse.json({ error: 'Erro interno ao atualizar cidade.' }, { status: 500 });
  }
}

