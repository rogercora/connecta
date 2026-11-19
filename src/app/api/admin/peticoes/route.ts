import { NextResponse } from 'next/server';
import { requireAdminUser } from '@/lib/auth/serverAuth';
import { getSupabaseAdmin } from '@/lib/supabase/server';
import { gerarMinutaPeticaoComIA } from '@/lib/ia/peticaoGenerator';
import { renderPeticaoPdfBuffer } from '@/lib/pdf/peticaoPdf';
import { sendProtocoloEmail } from '@/lib/email/sendProtocolo';

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

// GET: Lista todas as petições para fila de moderação no Admin
export async function GET() {
  try {
    const auth = await requireAdminUser();
    if (!auth.ok) return auth.response;

    const supabaseAdmin = getSupabaseAdmin();
    const { data, error } = await supabaseAdmin
      .from('peticoes')
      .select('*, pauta:pautas_ia(id, titulo, resumo_ia, impacto_bairro, vereador_proponente, fonte_diario, votos_concordar, votos_discordar)')
      .order('created_at', { ascending: false })
      .limit(100);

    if (error) {
      return NextResponse.json({ error: `Erro ao consultar petições: ${error.message}` }, { status: 500 });
    }

    return NextResponse.json({
      peticoes: data ?? [],
      resendConfigured: Boolean((process.env.RESEND_API_KEY || '').trim()),
    });
  } catch (error: any) {
    console.error('Erro em GET /api/admin/peticoes:', error?.message);
    return NextResponse.json({ error: 'Erro interno ao listar petições.' }, { status: 500 });
  }
}

// PATCH: Ações de moderação, regeneração com IA, publicação e protocolo por e-mail+PDF
export async function PATCH(req: Request) {
  try {
    const auth = await requireAdminUser();
    if (!auth.ok) return auth.response;

    const body = await req.json();
    const {
      id,
      action,
      titulo,
      resumo,
      minuta_texto,
      email_destino,
      vereador_alvo,
      meta_assinaturas,
      resposta_camara,
    } = body ?? {};

    if (!id || typeof id !== 'string' || !UUID_REGEX.test(id)) {
      return NextResponse.json({ error: 'ID de petição inválido.' }, { status: 400 });
    }

    const supabaseAdmin = getSupabaseAdmin();
    const { data: peticao, error: findErr } = await supabaseAdmin
      .from('peticoes')
      .select('*, pauta:pautas_ia(*)')
      .eq('id', id)
      .maybeSingle();

    if (findErr || !peticao) {
      return NextResponse.json({ error: 'Petição não encontrada.' }, { status: 404 });
    }

    const buildProtocoloCode = () =>
      peticao.protocolo_digital ||
      `CON-PET-${new Date(peticao.created_at || Date.now()).getFullYear()}-${peticao.id.slice(0, 6).toUpperCase()}`;

    const baseEdits: Record<string, any> = {};
    if (typeof titulo === 'string' && titulo.trim()) baseEdits.titulo = titulo.trim().slice(0, 200);
    if (typeof resumo === 'string') baseEdits.resumo = resumo.trim().slice(0, 1000);
    if (typeof minuta_texto === 'string' && minuta_texto.trim()) baseEdits.minuta_texto = minuta_texto.trim();
    if (typeof email_destino === 'string') baseEdits.email_destino = email_destino.trim() || null;
    if (typeof vereador_alvo === 'string' && vereador_alvo.trim()) {
      baseEdits.vereador_alvo = vereador_alvo.trim().slice(0, 120);
    }
    if (meta_assinaturas !== undefined && auth.profile?.role === 'super_admin') {
      const parsedMeta = Number(meta_assinaturas);
      if (Number.isFinite(parsedMeta) && parsedMeta >= 1) {
        baseEdits.meta_assinaturas = Math.round(parsedMeta);
      }
    }

    if (action === 'save_draft') {
      const { data: saved, error: updErr } = await supabaseAdmin
        .from('peticoes')
        .update(baseEdits)
        .eq('id', id)
        .select('*, pauta:pautas_ia(*)')
        .single();
      if (updErr) return NextResponse.json({ error: updErr.message }, { status: 500 });
      return NextResponse.json({ success: true, peticao: saved, message: 'Alterações salvas.' });
    }

    if (action === 'regenerar_ia') {
      const pautaRel = peticao.pauta;
      let motivosReais: string[] = [];

      if (peticao.pauta_id) {
        const { data: motivosRows } = await supabaseAdmin
          .from('votos_pauta')
          .select('motivo_discordancia')
          .eq('pauta_id', peticao.pauta_id)
          .eq('opcao_voto', 'discordar')
          .not('motivo_discordancia', 'is', null)
          .order('created_at', { ascending: false })
          .limit(30);
        motivosReais = (motivosRows ?? []).map((m: any) => m.motivo_discordancia).filter(Boolean);
      } else if (Array.isArray(peticao.argumentos_moradores)) {
        motivosReais = peticao.argumentos_moradores.map((a: any) => String(a));
      }

      const gerada = await gerarMinutaPeticaoComIA({
        tituloPauta: pautaRel?.titulo || peticao.titulo || 'Demanda Comunitária',
        resumoPauta: pautaRel?.resumo_ia || peticao.resumo || '',
        impactoBairro: pautaRel?.impacto_bairro || peticao.resumo || '',
        vereadorAlvo: peticao.vereador_alvo || pautaRel?.vereador_proponente || 'Câmara Municipal',
        bairro: peticao.bairro || pautaRel?.bairro_alvo || 'Centro',
        cidade: peticao.cidade || 'São José dos Campos',
        estado: peticao.estado || 'SP',
        totalDiscordancias: Number(peticao.total_assinaturas) || 1,
        quorumMeta: Number(peticao.meta_assinaturas) || 50,
        motivosReais,
      });

      const { data: updated, error: updErr } = await supabaseAdmin
        .from('peticoes')
        .update({
          titulo: gerada.tituloPeticao,
          resumo: gerada.resumoExecutivo,
          minuta_texto: gerada.minutaTexto,
          argumentos_moradores: gerada.argumentosSintetizados,
        })
        .eq('id', id)
        .select('*, pauta:pautas_ia(*)')
        .single();

      if (updErr) return NextResponse.json({ error: updErr.message }, { status: 500 });
      return NextResponse.json({
        success: true,
        peticao: updated,
        message: gerada.geradoPorIA
          ? `Minuta sintetizada via IA (${gerada.modeloIA}).`
          : 'Minuta estruturada via extrator local.',
      });
    }

    if (action === 'aprovar_publicar') {
      const protocolo = buildProtocoloCode();
      const updates = {
        ...baseEdits,
        protocolo_digital: protocolo,
        pdf_url: `/api/peticao/gerar-pdf?peticao_id=${id}`,
        status: 'aberta',
        aprovada_por: auth.authUser.id,
        aprovada_em: new Date().toISOString(),
      };
      const { data: updated, error: updErr } = await supabaseAdmin
        .from('peticoes')
        .update(updates)
        .eq('id', id)
        .select('*, pauta:pautas_ia(*)')
        .single();

      if (updErr) return NextResponse.json({ error: updErr.message }, { status: 500 });
      return NextResponse.json({
        success: true,
        peticao: updated,
        message: 'Petição aprovada e publicada para coleta de assinaturas em /acoes.',
      });
    }

    if (action === 'protocolar_envio') {
      const destinoFinal =
        (typeof email_destino === 'string' && email_destino.trim()) || peticao.email_destino || '';
      if (!destinoFinal.includes('@')) {
        return NextResponse.json(
          { error: 'Informe um e-mail institucional válido do gabinete ou Câmara.' },
          { status: 400 }
        );
      }

      const protocolo = buildProtocoloCode();
      const tituloFinal =
        (typeof titulo === 'string' && titulo.trim()) ||
        peticao.titulo ||
        peticao.pauta?.titulo ||
        'Petição Cívica ConectaBr';
      const minutaFinal =
        (typeof minuta_texto === 'string' && minuta_texto.trim()) ||
        peticao.minuta_texto ||
        peticao.resumo ||
        tituloFinal;
      const args: string[] = Array.isArray(peticao.argumentos_moradores)
        ? peticao.argumentos_moradores.map((a: any) => String(a))
        : [];

      const pdfBuffer = await renderPeticaoPdfBuffer({
        id: peticao.id,
        protocoloDigital: protocolo,
        titulo: tituloFinal,
        resumo: (typeof resumo === 'string' ? resumo.trim() : peticao.resumo) || null,
        minutaTexto: minutaFinal,
        argumentos: args,
        cidade: peticao.cidade || 'São José dos Campos',
        estado: peticao.estado || 'SP',
        bairro: peticao.bairro,
        cepAlvo: peticao.cep_alvo,
        vereadorAlvo: (typeof vereador_alvo === 'string' && vereador_alvo.trim()) || peticao.vereador_alvo,
        emailDestino: destinoFinal,
        totalAssinaturas: Number(peticao.total_assinaturas) || 0,
        metaAssinaturas: Number(peticao.meta_assinaturas) || 50,
        status: 'entregue',
        createdAt: peticao.created_at,
        fonteDiario: peticao.pauta?.fonte_diario || null,
      });

      const emailRes = await sendProtocoloEmail({
        to: destinoFinal,
        subject: `[ConectaBr ${protocolo}] Petição Cívica: ${tituloFinal}`,
        protocoloDigital: protocolo,
        tituloPeticao: tituloFinal,
        cidade: peticao.cidade || 'São José dos Campos',
        estado: peticao.estado || 'SP',
        totalAssinaturas: Number(peticao.total_assinaturas) || 0,
        minutaTexto: minutaFinal,
        pdfBuffer,
      });

      const { data: updated, error: updErr } = await supabaseAdmin
        .from('peticoes')
        .update({
          ...baseEdits,
          email_destino: destinoFinal,
          protocolo_digital: protocolo,
          pdf_url: `/api/peticao/gerar-pdf?peticao_id=${id}`,
          status: 'entregue',
          aprovada_por: peticao.aprovada_por || auth.authUser.id,
          aprovada_em: peticao.aprovada_em || new Date().toISOString(),
          enviada_em: new Date().toISOString(),
        })
        .eq('id', id)
        .select('*, pauta:pautas_ia(*)')
        .single();

      if (updErr) return NextResponse.json({ error: updErr.message }, { status: 500 });
      return NextResponse.json({
        success: true,
        peticao: updated,
        emailResult: emailRes,
        message: emailRes.notice,
      });
    }

    if (action === 'registrar_resposta') {
      const { data: updated, error: updErr } = await supabaseAdmin
        .from('peticoes')
        .update({
          status: 'respondida',
          resposta_camara:
            typeof resposta_camara === 'string' && resposta_camara.trim()
              ? resposta_camara.trim().slice(0, 2000)
              : 'Resposta institucional registrada pela Câmara/Prefeitura.',
        })
        .eq('id', id)
        .select('*, pauta:pautas_ia(*)')
        .single();
      if (updErr) return NextResponse.json({ error: updErr.message }, { status: 500 });
      return NextResponse.json({ success: true, peticao: updated, message: 'Resposta oficial registrada.' });
    }

    if (action === 'arquivar') {
      const { data: updated, error: updErr } = await supabaseAdmin
        .from('peticoes')
        .update({ status: 'arquivada' })
        .eq('id', id)
        .select('*, pauta:pautas_ia(*)')
        .single();
      if (updErr) return NextResponse.json({ error: updErr.message }, { status: 500 });
      return NextResponse.json({ success: true, peticao: updated, message: 'Petição arquivada.' });
    }

    return NextResponse.json({ error: 'Ação de moderação desconhecida.' }, { status: 400 });
  } catch (error: any) {
    console.error('Erro em PATCH /api/admin/peticoes:', error?.message);
    return NextResponse.json({ error: 'Erro interno na moderação de petições.' }, { status: 500 });
  }
}

