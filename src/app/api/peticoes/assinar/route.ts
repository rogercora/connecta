import { NextResponse } from 'next/server';
import { requireAuthUser } from '@/lib/auth/serverAuth';
import { getSupabaseAdmin } from '@/lib/supabase/server';

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

// POST: Assina ou remove assinatura única do cidadão em uma petição aberta
export async function POST(req: Request) {
  try {
    const auth = await requireAuthUser();
    if (!auth.ok) return auth.response;

    const body = await req.json();
    const { peticao_id, comentario } = body ?? {};

    if (!peticao_id || typeof peticao_id !== 'string' || !UUID_REGEX.test(peticao_id)) {
      return NextResponse.json({ error: 'ID de petição inválido.' }, { status: 400 });
    }

    const supabaseAdmin = getSupabaseAdmin();
    const { data: peticao, error: petErr } = await supabaseAdmin
      .from('peticoes')
      .select('id, status, total_assinaturas')
      .eq('id', peticao_id)
      .maybeSingle();

    if (petErr || !peticao) {
      return NextResponse.json({ error: 'Petição não encontrada.' }, { status: 404 });
    }
    if (peticao.status !== 'aberta') {
      return NextResponse.json(
        { error: 'Apenas petições abertas aceitam novas assinaturas.' },
        { status: 400 }
      );
    }

    const { data: existente } = await supabaseAdmin
      .from('assinaturas_peticao')
      .select('id')
      .eq('peticao_id', peticao_id)
      .eq('user_id', auth.authUser.id)
      .maybeSingle();

    let assinado = false;
    if (existente) {
      const { error: delErr } = await supabaseAdmin
        .from('assinaturas_peticao')
        .delete()
        .eq('id', existente.id);
      if (delErr) {
        return NextResponse.json({ error: 'Falha ao retirar assinatura.' }, { status: 500 });
      }
      assinado = false;
    } else {
      const { error: insErr } = await supabaseAdmin
        .from('assinaturas_peticao')
        .insert({
          peticao_id,
          user_id: auth.authUser.id,
          comentario: typeof comentario === 'string' && comentario.trim() ? comentario.trim().slice(0, 300) : null,
        });
      if (insErr) {
        return NextResponse.json({ error: 'Falha ao registrar assinatura.' }, { status: 500 });
      }
      assinado = true;
    }

    const { data: atualizada } = await supabaseAdmin
      .from('peticoes')
      .select('total_assinaturas')
      .eq('id', peticao_id)
      .maybeSingle();

    return NextResponse.json({
      success: true,
      assinado,
      total_assinaturas: atualizada?.total_assinaturas ?? peticao.total_assinaturas,
    });
  } catch (error: any) {
    console.error('Erro em POST /api/peticoes/assinar:', error?.message);
    return NextResponse.json({ error: 'Erro interno ao processar assinatura.' }, { status: 500 });
  }
}

