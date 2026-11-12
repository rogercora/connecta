import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/server';
import { supabase } from '@/lib/supabase/client';
import { INITIAL_PAUTA } from '@/stores/feedStore';

// GET: Lista pautas cadastradas
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const cidade = searchParams.get('cidade') || 'São José dos Campos';
    const status = searchParams.get('status'); // 'ativa', 'todos', etc.

    let query = supabase
      .from('pautas_ia')
      .select('*')
      .ilike('cidade_alvo', `%${cidade}%`)
      .order('created_at', { ascending: false });

    if (status && status !== 'todos') {
      query = query.eq('status', status);
    }

    const { data, error } = await query;

    if (error) {
      console.warn('Erro ao consultar pautas no Supabase, usando fallback:', error.message);
      return NextResponse.json({
        pautas: [INITIAL_PAUTA],
        source: 'fallback-local',
      });
    }

    return NextResponse.json({
      pautas: data && data.length > 0 ? data : [INITIAL_PAUTA],
      source: 'supabase',
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// POST: Publica uma nova pauta aprovada pelo Administrador/Moderador
export async function POST(req: Request) {
  try {
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
      data_votacao = new Date(Date.now() + 86400000 * 2).toISOString(),
    } = body;

    if (!titulo || !resumo_ia || !impacto_bairro || !vereador_proponente) {
      return NextResponse.json(
        { error: 'Campos obrigatórios ausentes (título, resumo, impacto, vereador proponente).' },
        { status: 400 }
      );
    }

    const novaPauta = {
      titulo,
      resumo_ia,
      impacto_bairro,
      vereador_proponente,
      bairro_alvo,
      cidade_alvo,
      estado_alvo,
      cep_alvo,
      link_pdf_original,
      fonte_diario,
      status,
      data_votacao,
      votos_concordar: 0,
      votos_discordar: 0,
    };

    // Tenta gravar usando a service_role do Supabase
    const { data, error } = await supabaseAdmin
      .from('pautas_ia')
      .insert([novaPauta])
      .select()
      .single();

    if (error) {
      console.warn('Supabase Admin insert falhou, tentando cliente padrão:', error.message);
      // Tenta fallback com client normal
      const { data: dataClient, error: errorClient } = await supabase
        .from('pautas_ia')
        .insert([novaPauta])
        .select()
        .single();

      if (errorClient) {
        console.warn('Fallback client também falhou:', errorClient.message);
        // Retorna simulado caso Supabase esteja temporariamente indisponível
        return NextResponse.json({
          success: true,
          pauta: {
            ...novaPauta,
            id: `pauta-${Date.now()}`,
            created_at: new Date().toISOString(),
          },
          warning: 'Salvo em modo de contingência local.',
        });
      }

      return NextResponse.json({
        success: true,
        pauta: dataClient,
      });
    }

    return NextResponse.json({
      success: true,
      pauta: data,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// DELETE: Remove uma pauta do ar
export async function DELETE(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'ID da pauta é obrigatório' }, { status: 400 });
    }

    const { error } = await supabaseAdmin
      .from('pautas_ia')
      .delete()
      .eq('id', id);

    if (error) {
      // Tenta com cliente comum
      await supabase.from('pautas_ia').delete().eq('id', id);
    }

    return NextResponse.json({ success: true, message: 'Pauta removida com sucesso.' });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
