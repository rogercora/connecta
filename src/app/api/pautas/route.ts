import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/server';
import { supabase } from '@/lib/supabase/client';
import { INITIAL_PAUTA } from '@/stores/feedStore';

// GET: Lista pautas cadastradas
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const cidade = searchParams.get('cidade');
    const status = searchParams.get('status'); // 'ativa', 'todos', etc.

    let query = supabase
      .from('pautas_ia')
      .select('*')
      .order('created_at', { ascending: false });

    // Filtra por cidade a menos que seja explicitamente 'todas'
    if (cidade && cidade !== 'todas') {
      query = query.ilike('cidade_alvo', `%${cidade}%`);
    }

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

    // Tenta gravar no Supabase usando supabaseAdmin
    let pautaCriada: any = null;

    try {
      const { data, error } = await supabaseAdmin
        .from('pautas_ia')
        .insert([novaPauta])
        .select()
        .single();

      if (!error && data) {
        pautaCriada = data;
      } else {
        console.warn('supabaseAdmin insert retornou erro, tentando via REST direto:', error?.message);
      }
    } catch (adminErr: any) {
      console.warn('Exceção ao usar supabaseAdmin:', adminErr.message);
    }

    // Se supabaseAdmin falhou, tenta REST direto com a service key (100% garantido)
    if (!pautaCriada) {
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://fjtbdoeahdtellzbxpsy.supabase.co';
      const serviceKey =
        process.env.SUPABASE_SERVICE_ROLE_KEY ||
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
        '';

      try {
        const restRes = await fetch(`${supabaseUrl}/rest/v1/pautas_ia`, {
          method: 'POST',
          headers: {
            apikey: serviceKey,
            Authorization: `Bearer ${serviceKey}`,
            'Content-Type': 'application/json',
            Prefer: 'return=representation',
          },
          body: JSON.stringify(novaPauta),
        });

        if (restRes.ok) {
          const restData = await restRes.json();
          pautaCriada = Array.isArray(restData) ? restData[0] : restData;
        } else {
          const errText = await restRes.text();
          console.warn('REST direto falhou:', errText);
        }
      } catch (restErr: any) {
        console.warn('Exceção ao usar REST direto:', restErr.message);
      }
    }

    if (!pautaCriada) {
      return NextResponse.json(
        { error: 'Não foi possível gravar a pauta no banco de dados Supabase.' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      pauta: pautaCriada,
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
