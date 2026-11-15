import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/server';

export async function POST(req: Request) {
  try {
    const { pauta_id, user_id, opcao_voto, motivo_discordancia } = await req.json();

    if (!pauta_id || !opcao_voto) {
      return NextResponse.json(
        { error: 'Campos obrigatórios ausentes: pauta_id e opcao_voto são necessários.' },
        { status: 400 }
      );
    }

    const effectiveUserId = user_id || 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11';

    let dbSuccess = false;
    let votosConcordarAtual = 0;
    let votosDiscordarAtual = 0;

    // 1. Tenta gravar ou atualizar em votos_pauta no Supabase
    try {
      const { error: insertError } = await supabaseAdmin
        .from('votos_pauta')
        .upsert(
          {
            pauta_id,
            user_id: effectiveUserId,
            opcao_voto,
            motivo_discordancia: motivo_discordancia || null,
          },
          { onConflict: 'pauta_id,user_id' }
        );

      if (!insertError) {
        dbSuccess = true;
      } else {
        console.warn('Aviso: Supabase votos_pauta:', insertError.message);
      }

      // 2. Busca e atualiza a contagem na tabela pautas_ia
      const { data: pautaData } = await supabaseAdmin
        .from('pautas_ia')
        .select('votos_concordar, votos_discordar')
        .eq('id', pauta_id)
        .maybeSingle();

      if (pautaData) {
        votosConcordarAtual = pautaData.votos_concordar || 0;
        votosDiscordarAtual = pautaData.votos_discordar || 0;

        const novoConcordar =
          opcao_voto === 'concordar' ? votosConcordarAtual + 1 : votosConcordarAtual;
        const novoDiscordar =
          opcao_voto === 'discordar' ? votosDiscordarAtual + 1 : votosDiscordarAtual;

        await supabaseAdmin
          .from('pautas_ia')
          .update({
            votos_concordar: novoConcordar,
            votos_discordar: novoDiscordar,
          })
          .eq('id', pauta_id);

        votosConcordarAtual = novoConcordar;
        votosDiscordarAtual = novoDiscordar;
      }
    } catch (dbErr) {
      console.warn('Exceção ao persistir no Supabase:', dbErr);
    }

    return NextResponse.json({
      success: true,
      message: 'Voto computado com sucesso no quórum auditado.',
      voto: {
        pauta_id,
        user_id: effectiveUserId,
        opcao_voto,
        motivo_discordancia: motivo_discordancia || null,
        created_at: new Date().toISOString(),
      },
      contadores: {
        votos_concordar: votosConcordarAtual,
        votos_discordar: votosDiscordarAtual,
      },
      db_persisted: dbSuccess,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const pauta_id = searchParams.get('pauta_id');
    const user_id = searchParams.get('user_id') || 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11';

    if (pauta_id) {
      const { data } = await supabaseAdmin
        .from('votos_pauta')
        .select('*')
        .eq('pauta_id', pauta_id)
        .eq('user_id', user_id)
        .maybeSingle();

      return NextResponse.json({
        has_voted: !!data,
        voto: data || null,
      });
    }

    // Se passou apenas user_id, retorna todos os votos desse usuário
    const { data: userVotos } = await supabaseAdmin
      .from('votos_pauta')
      .select('pauta_id, opcao_voto, motivo_discordancia, created_at')
      .eq('user_id', user_id);

    return NextResponse.json({
      votos: userVotos || [],
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

