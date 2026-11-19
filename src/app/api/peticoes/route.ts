import { NextResponse } from 'next/server';
import { createSupabaseServerClient, getSupabaseAdmin } from '@/lib/supabase/server';
import { requireAuthUser } from '@/lib/auth/serverAuth';
import { resolveCidadeQuorumConfig } from '@/lib/quorum';

// GET: Lista petições oficiais públicas (e rascunhos criados pelo próprio usuário logado) + assinatura do usuário
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const cidade = searchParams.get('cidade')?.trim();
    const estado = searchParams.get('estado')?.trim();

    const supabase = await createSupabaseServerClient();
    const {
      data: { user: authUser },
    } = await supabase.auth.getUser();

    let query = supabase
      .from('peticoes')
      .select('*, pauta:pautas_ia(id, titulo, resumo_ia, impacto_bairro, vereador_proponente, fonte_diario, link_pdf_original, bairro_alvo)')
      .in('status', ['aberta', 'entregue', 'respondida', 'pendente_revisao'])
      .order('created_at', { ascending: false });

    if (cidade && cidade.toLowerCase() !== 'todas') {
      query = query.ilike('cidade', `%${cidade}%`);
    }
    if (estado && estado.length === 2) {
      query = query.eq('estado', estado.toUpperCase());
    }

    const { data: rows, error } = await query;
    if (error) {
      return NextResponse.json({ error: 'Não foi possível carregar as petições.' }, { status: 500 });
    }

    const assinadasSet = new Set<string>();
    if (authUser) {
      const { data: minhasAssinaturas } = await supabase
        .from('assinaturas_peticao')
        .select('peticao_id')
        .eq('user_id', authUser.id);
      for (const a of minhasAssinaturas ?? []) {
        assinadasSet.add(a.peticao_id);
      }
    }

    const quorumCidade = await resolveCidadeQuorumConfig(supabase, cidade, estado);

    const peticoes = (rows ?? [])
      .filter((p: any) => p.status !== 'pendente_revisao' || (authUser && p.created_by === authUser.id))
      .map((p: any) => ({
        ...p,
        user_assinou: assinadasSet.has(p.id),
      }));

    return NextResponse.json({
      peticoes,
      quorumCidade: quorumCidade.quorum_peticao,
    });
  } catch (error: any) {
    console.error('Erro em GET /api/peticoes:', error?.message);
    return NextResponse.json({ error: 'Erro interno ao buscar petições.' }, { status: 500 });
  }
}

// POST: Cidadão cria proposta de abaixo-assinado comunitário -> entra na fila do /admin (pendente_revisao)
export async function POST(req: Request) {
  try {
    const auth = await requireAuthUser();
    if (!auth.ok) return auth.response;

    const body = await req.json();
    const {
      titulo,
      resumo,
      bairro,
      vereador_alvo,
      argumentos = [],
    } = body ?? {};

    if (typeof titulo !== 'string' || titulo.trim().length < 6) {
      return NextResponse.json(
        { error: 'Informe um título claro com pelo menos 6 caracteres.' },
        { status: 400 }
      );
    }
    if (typeof resumo !== 'string' || resumo.trim().length < 15) {
      return NextResponse.json(
        { error: 'Descreva o pedido à Câmara com pelo menos 15 caracteres.' },
        { status: 400 }
      );
    }

    const cidadeUser = auth.profile?.cidade || 'São José dos Campos';
    const estadoUser = auth.profile?.estado || 'SP';
    const bairroFinal =
      typeof bairro === 'string' && bairro.trim() ? bairro.trim() : auth.profile?.bairro || 'Centro';
    const cepFinal = auth.profile?.cep || '12200-000';

    const supabaseAdmin = getSupabaseAdmin();
    const cidadeCfg = await resolveCidadeQuorumConfig(supabaseAdmin, cidadeUser, estadoUser);

    const argsLimpos = Array.isArray(argumentos)
      ? argumentos.map((a: any) => String(a || '').trim()).filter(Boolean).slice(0, 6)
      : [];

    const minutaInicial = [
      `EXCELENTÍSSIMO(A) SENHOR(A) PRESIDENTE DA CÂMARA MUNICIPAL DE ${cidadeCfg.cidade.toUpperCase()} - ${cidadeCfg.estado.toUpperCase()}`,
      vereador_alvo ? `DESTINATÁRIO INDICADO: ${String(vereador_alvo).trim()}` : '',
      '',
      `ASSUNTO: Direito de Petição (Art. 5º, XXXIV, "a" da CF/88) — ${titulo.trim()}`,
      '',
      `Moradores de ${cidadeCfg.cidade}/${cidadeCfg.estado} (foco em ${bairroFinal}) apresentam à apreciação do Poder Público a seguinte demanda comunitária:`,
      '',
      resumo.trim(),
      '',
      argsLimpos.length > 0 ? 'PONTOS PRINCIPAIS:' : '',
      ...argsLimpos.map((a, idx) => `${idx + 1}. ${a}`),
      '',
      'Requeremos análise, transparência e resposta oficial a este protocolo cívico.',
    ]
      .filter((line) => line !== undefined)
      .join('\n');

    const { data: criada, error: insertErr } = await supabaseAdmin
      .from('peticoes')
      .insert({
        pauta_id: null,
        tipo: 'comunitaria',
        titulo: titulo.trim().slice(0, 200),
        resumo: resumo.trim().slice(0, 800),
        minuta_texto: minutaInicial,
        argumentos_moradores: argsLimpos,
        email_destino: cidadeCfg.email_camara_padrao || cidadeCfg.email_ouvidoria_padrao,
        vereador_alvo: typeof vereador_alvo === 'string' && vereador_alvo.trim() ? vereador_alvo.trim().slice(0, 120) : 'Câmara Municipal',
        bairro: bairroFinal.slice(0, 120),
        cidade: cidadeCfg.cidade,
        estado: cidadeCfg.estado,
        cep_alvo: cepFinal,
        meta_assinaturas: cidadeCfg.quorum_peticao,
        total_assinaturas: 1,
        status: 'pendente_revisao',
        created_by: auth.authUser.id,
      })
      .select('*')
      .single();

    if (insertErr || !criada) {
      console.error('Erro ao criar petição comunitária:', insertErr?.message);
      return NextResponse.json({ error: 'Não foi possível salvar sua petição.' }, { status: 500 });
    }

    await supabaseAdmin.from('assinaturas_peticao').upsert(
      {
        peticao_id: criada.id,
        user_id: auth.authUser.id,
        comentario: 'Autor(a) proponente da petição comunitária',
      },
      { onConflict: 'peticao_id,user_id' }
    );

    return NextResponse.json({
      success: true,
      peticao: { ...criada, user_assinou: true },
      message: 'Petição enviada para análise rápida da moderação antes da coleta pública.',
    });
  } catch (error: any) {
    console.error('Erro em POST /api/peticoes:', error?.message);
    return NextResponse.json({ error: 'Erro interno ao criar petição.' }, { status: 500 });
  }
}

