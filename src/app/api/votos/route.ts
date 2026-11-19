import { NextResponse } from 'next/server';
import { resolveCidadeQuorumConfig } from '@/lib/quorum';
import { gerarMinutaPeticaoComIA } from '@/lib/ia/peticaoGenerator';
import { requireAuthUser } from '@/lib/auth/serverAuth';
import { getSupabaseAdmin } from '@/lib/supabase/server';

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export async function POST(req: Request) {
  try {
    const auth = await requireAuthUser();
    if (!auth.ok) return auth.response;

    if (!auth.profile) {
      return NextResponse.json(
        { error: 'Perfil de cidadão não encontrado. Conclua seu cadastro antes de votar.' },
        { status: 403 }
      );
    }

    if ((auth.profile.nivel_verificacao ?? 0) < 2) {
      return NextResponse.json(
        { error: 'Apenas cidadãos verificados (Nível 2) podem votar nas decisões da Câmara.' },
        { status: 403 }
      );
    }

    const body = await req.json();
    const { pauta_id, opcao_voto, motivo_discordancia } = body ?? {};

    if (!pauta_id || typeof pauta_id !== 'string' || !UUID_REGEX.test(pauta_id)) {
      return NextResponse.json(
        { error: 'Identificador de pauta inválido.' },
        { status: 400 }
      );
    }

    if (opcao_voto !== 'concordar' && opcao_voto !== 'discordar') {
      return NextResponse.json(
        { error: 'Opção de voto inválida. Escolha concordar ou discordar.' },
        { status: 400 }
      );
    }

    const motivoLimpo =
      typeof motivo_discordancia === 'string' ? motivo_discordancia.trim() : '';

    if (opcao_voto === 'discordar' && !motivoLimpo) {
      return NextResponse.json(
        { error: 'Informe o motivo da discordância para registrar sua assinatura de oposição.' },
        { status: 400 }
      );
    }

    if (motivoLimpo.length > 1000) {
      return NextResponse.json(
        { error: 'O motivo deve ter no máximo 1.000 caracteres.' },
        { status: 400 }
      );
    }

    const supabaseAdmin = getSupabaseAdmin();

    // Verifica se a pauta existe e está ativa
    const { data: pautaExistente, error: pautaError } = await supabaseAdmin
      .from('pautas_ia')
      .select('id, status, votos_concordar, votos_discordar')
      .eq('id', pauta_id)
      .maybeSingle();

    if (pautaError || !pautaExistente) {
      return NextResponse.json(
        { error: 'Pauta não encontrada.' },
        { status: 404 }
      );
    }

    // Insere voto único (sem upsert). O trigger trg_votos_pauta_after_insert incrementa pautas_ia.
    const { error: insertError } = await supabaseAdmin
      .from('votos_pauta')
      .insert({
        pauta_id,
        user_id: auth.authUser.id,
        opcao_voto,
        motivo_discordancia: opcao_voto === 'discordar' ? motivoLimpo : null,
      });

    if (insertError) {
      if (insertError.code === '23505') {
        return NextResponse.json(
          {
            error: 'Você já registrou seu voto nesta pauta.',
            already_voted: true,
            contadores: {
              votos_concordar: pautaExistente.votos_concordar || 0,
              votos_discordar: pautaExistente.votos_discordar || 0,
            },
          },
          { status: 409 }
        );
      }

      console.error('Erro ao inserir voto:', insertError.message);
      return NextResponse.json(
        { error: 'Não foi possível registrar seu voto no momento.' },
        { status: 500 }
      );
    }

    // Lê os contadores atualizados atomicamente pelo trigger do PostgreSQL
    const { data: pautaAtualizada } = await supabaseAdmin
      .from('pautas_ia')
      .select('*')
      .eq('id', pauta_id)
      .maybeSingle();

    let peticaoGeradaInfo: { id: string; status: string; titulo: string | null } | null = null;

    if (pautaAtualizada) {
      try {
        const cidadeCfg = await resolveCidadeQuorumConfig(
          supabaseAdmin,
          pautaAtualizada.cidade_alvo,
          pautaAtualizada.estado_alvo
        );
        const quorumEfetivo = Number(pautaAtualizada.quorum_meta) || cidadeCfg.quorum_peticao || 50;

        if ((pautaAtualizada.votos_discordar ?? 0) >= quorumEfetivo) {
          await supabaseAdmin.rpc('check_peticao_threshold', {
            pauta_uuid: pauta_id,
            threshold: quorumEfetivo,
          });

          const { data: peticaoExistente } = await supabaseAdmin
            .from('peticoes')
            .select('id, status, titulo, minuta_texto')
            .eq('pauta_id', pauta_id)
            .maybeSingle();

          if (peticaoExistente) {
            if (!peticaoExistente.minuta_texto) {
              const { data: motivosRows } = await supabaseAdmin
                .from('votos_pauta')
                .select('motivo_discordancia')
                .eq('pauta_id', pauta_id)
                .eq('opcao_voto', 'discordar')
                .not('motivo_discordancia', 'is', null)
                .order('created_at', { ascending: false })
                .limit(30);

              const motivosReais = (motivosRows ?? [])
                .map((r: any) => r.motivo_discordancia)
                .filter(Boolean);

              const minuta = await gerarMinutaPeticaoComIA({
                tituloPauta: pautaAtualizada.titulo,
                resumoPauta: pautaAtualizada.resumo_ia,
                impactoBairro: pautaAtualizada.impacto_bairro,
                vereadorAlvo: pautaAtualizada.vereador_proponente,
                bairro: pautaAtualizada.bairro_alvo,
                cidade: pautaAtualizada.cidade_alvo,
                estado: pautaAtualizada.estado_alvo,
                totalDiscordancias: pautaAtualizada.votos_discordar ?? quorumEfetivo,
                quorumMeta: quorumEfetivo,
                motivosReais,
              });

              await supabaseAdmin
                .from('peticoes')
                .update({
                  titulo: minuta.tituloPeticao,
                  resumo: minuta.resumoExecutivo,
                  minuta_texto: minuta.minutaTexto,
                  argumentos_moradores: minuta.argumentosSintetizados,
                  email_destino: cidadeCfg.email_camara_padrao || cidadeCfg.email_ouvidoria_padrao,
                  meta_assinaturas: quorumEfetivo,
                })
                .eq('id', peticaoExistente.id)
                .is('minuta_texto', null);

              peticaoGeradaInfo = {
                id: peticaoExistente.id,
                status: peticaoExistente.status,
                titulo: minuta.tituloPeticao,
              };
            } else {
              peticaoGeradaInfo = {
                id: peticaoExistente.id,
                status: peticaoExistente.status,
                titulo: peticaoExistente.titulo,
              };
            }
          }
        }
      } catch (quorumErr: any) {
        console.warn('Aviso ao verificar quórum/gerar minuta de petição:', quorumErr?.message);
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Voto computado com sucesso.',
      voto: {
        pauta_id,
        user_id: auth.authUser.id,
        opcao_voto,
        motivo_discordancia: opcao_voto === 'discordar' ? motivoLimpo : null,
        created_at: new Date().toISOString(),
      },
      contadores: {
        votos_concordar: pautaAtualizada?.votos_concordar ?? pautaExistente.votos_concordar ?? 0,
        votos_discordar: pautaAtualizada?.votos_discordar ?? pautaExistente.votos_discordar ?? 0,
      },
      peticao_gerada: peticaoGeradaInfo,
      db_persisted: true,
    });
  } catch (error: any) {
    console.error('Erro em POST /api/votos:', error?.message);
    return NextResponse.json({ error: 'Erro interno ao processar voto.' }, { status: 500 });
  }
}

export async function GET(req: Request) {
  try {
    const auth = await requireAuthUser();
    if (!auth.ok) return auth.response;

    const { searchParams } = new URL(req.url);
    const pauta_id = searchParams.get('pauta_id');

    const supabaseAdmin = getSupabaseAdmin();

    if (pauta_id) {
      if (!UUID_REGEX.test(pauta_id)) {
        return NextResponse.json({ has_voted: false, voto: null });
      }

      const { data } = await supabaseAdmin
        .from('votos_pauta')
        .select('pauta_id, opcao_voto, motivo_discordancia, created_at')
        .eq('pauta_id', pauta_id)
        .eq('user_id', auth.authUser.id)
        .maybeSingle();

      return NextResponse.json({
        has_voted: !!data,
        voto: data || null,
      });
    }

    const { data: userVotos } = await supabaseAdmin
      .from('votos_pauta')
      .select('pauta_id, opcao_voto, motivo_discordancia, created_at')
      .eq('user_id', auth.authUser.id);

    return NextResponse.json({
      votos: userVotos || [],
    });
  } catch (error: any) {
    console.error('Erro em GET /api/votos:', error?.message);
    return NextResponse.json({ error: 'Erro ao consultar votos.' }, { status: 500 });
  }
}
