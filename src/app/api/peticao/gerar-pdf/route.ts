import { NextResponse } from 'next/server';
import { createSupabaseServerClient, getSupabaseAdmin } from '@/lib/supabase/server';
import { requireAuthUser } from '@/lib/auth/serverAuth';
import { renderPeticaoPdfBuffer } from '@/lib/pdf/peticaoPdf';

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function buildMinutaFallback(p: any): string {
  if (p.minuta_texto && String(p.minuta_texto).trim().length > 20) {
    return String(p.minuta_texto).trim();
  }
  const titulo = p.titulo || p.pauta?.titulo || 'Demanda Comunitária';
  const resumo = p.resumo || p.pauta?.resumo_ia || 'Solicitação formal registrada pelos moradores locais.';
  return [
    `EXCELENTÍSSIMO(A) SENHOR(A) PRESIDENTE DA CÂMARA MUNICIPAL DE ${String(p.cidade || 'São José dos Campos').toUpperCase()} - ${String(p.estado || 'SP').toUpperCase()}`,
    '',
    `ASSUNTO: Direito de Petição (Art. 5º, XXXIV, "a" da CF/88) — ${titulo}`,
    '',
    resumo,
    '',
    `Submetido com ${p.total_assinaturas ?? 0} assinaturas únicas verificadas pela plataforma ConectaBr.`,
  ].join('\n');
}

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const peticaoId = searchParams.get('peticao_id');

    if (!peticaoId || !UUID_REGEX.test(peticaoId)) {
      return NextResponse.json({ error: 'ID de petição inválido.' }, { status: 400 });
    }

    const supabase = await createSupabaseServerClient();
    const { data: peticao, error } = await supabase
      .from('peticoes')
      .select('*, pauta:pautas_ia(titulo, resumo_ia, impacto_bairro, vereador_proponente, fonte_diario)')
      .eq('id', peticaoId)
      .maybeSingle();

    if (error || !peticao) {
      return NextResponse.json(
        { error: 'Petição não encontrada ou ainda aguardando moderação.' },
        { status: 404 }
      );
    }

    const protocolo =
      peticao.protocolo_digital ||
      `CON-PET-${new Date(peticao.created_at || Date.now()).getFullYear()}-${peticao.id.slice(0, 6).toUpperCase()}`;

    const argumentos: string[] = Array.isArray(peticao.argumentos_moradores)
      ? peticao.argumentos_moradores.map((a: any) => String(a))
      : [];

    const pdfBuffer = await renderPeticaoPdfBuffer({
      id: peticao.id,
      protocoloDigital: protocolo,
      titulo: peticao.titulo || peticao.pauta?.titulo || 'Petição Cívica ConectaBr',
      resumo: peticao.resumo || peticao.pauta?.impacto_bairro || null,
      minutaTexto: buildMinutaFallback(peticao),
      argumentos,
      cidade: peticao.cidade || 'São José dos Campos',
      estado: peticao.estado || 'SP',
      bairro: peticao.bairro,
      cepAlvo: peticao.cep_alvo,
      vereadorAlvo: peticao.vereador_alvo || peticao.pauta?.vereador_proponente,
      emailDestino: peticao.email_destino,
      totalAssinaturas: Number(peticao.total_assinaturas) || 0,
      metaAssinaturas: Number(peticao.meta_assinaturas) || 50,
      status: peticao.status,
      createdAt: peticao.created_at,
      fonteDiario: peticao.pauta?.fonte_diario || null,
    });

    return new NextResponse(new Uint8Array(pdfBuffer), {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `inline; filename="${protocolo}.pdf"`,
        'Cache-Control': 'no-store',
      },
    });
  } catch (error: any) {
    console.error('Erro em GET /api/peticao/gerar-pdf:', error?.message);
    return NextResponse.json({ error: 'Falha ao gerar PDF da petição.' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const auth = await requireAuthUser();
    if (!auth.ok) return auth.response;

    const { peticao_id } = await req.json();
    if (!peticao_id || !UUID_REGEX.test(peticao_id)) {
      return NextResponse.json({ error: 'ID de petição inválido.' }, { status: 400 });
    }

    const supabaseAdmin = getSupabaseAdmin();
    const { data: peticao } = await supabaseAdmin
      .from('peticoes')
      .select('*, pauta:pautas_ia(titulo, resumo_ia, impacto_bairro, vereador_proponente, fonte_diario)')
      .eq('id', peticao_id)
      .maybeSingle();

    if (!peticao) {
      return NextResponse.json({ error: 'Petição não encontrada.' }, { status: 404 });
    }

    const isAdmin = auth.profile?.role === 'admin' || auth.profile?.role === 'super_admin';
    const isPublic = ['aberta', 'entregue', 'respondida'].includes(peticao.status);
    if (!isPublic && !isAdmin && peticao.created_by !== auth.authUser.id) {
      return NextResponse.json({ error: 'Acesso negado a este rascunho.' }, { status: 403 });
    }

    const protocolo =
      peticao.protocolo_digital ||
      `CON-PET-${new Date(peticao.created_at || Date.now()).getFullYear()}-${peticao.id.slice(0, 6).toUpperCase()}`;

    const argumentos: string[] = Array.isArray(peticao.argumentos_moradores)
      ? peticao.argumentos_moradores.map((a: any) => String(a))
      : [];

    const pdfBuffer = await renderPeticaoPdfBuffer({
      id: peticao.id,
      protocoloDigital: protocolo,
      titulo: peticao.titulo || peticao.pauta?.titulo || 'Petição Cívica ConectaBr',
      resumo: peticao.resumo || peticao.pauta?.impacto_bairro || null,
      minutaTexto: buildMinutaFallback(peticao),
      argumentos,
      cidade: peticao.cidade || 'São José dos Campos',
      estado: peticao.estado || 'SP',
      bairro: peticao.bairro,
      cepAlvo: peticao.cep_alvo,
      vereadorAlvo: peticao.vereador_alvo || peticao.pauta?.vereador_proponente,
      emailDestino: peticao.email_destino,
      totalAssinaturas: Number(peticao.total_assinaturas) || 0,
      metaAssinaturas: Number(peticao.meta_assinaturas) || 50,
      status: peticao.status,
      createdAt: peticao.created_at,
      fonteDiario: peticao.pauta?.fonte_diario || null,
    });

    const pdfUrl = `/api/peticao/gerar-pdf?peticao_id=${peticao.id}`;
    return NextResponse.json({
      success: true,
      protocolo_digital: protocolo,
      pdf_url: pdfUrl,
      pdf_size_bytes: pdfBuffer.byteLength,
      minuta_texto: buildMinutaFallback(peticao),
    });
  } catch (error: any) {
    console.error('Erro em POST /api/peticao/gerar-pdf:', error?.message);
    return NextResponse.json({ error: 'Falha ao gerar PDF protocolar.' }, { status: 500 });
  }
}
