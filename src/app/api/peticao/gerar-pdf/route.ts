import { NextResponse } from 'next/server';
import { requireAuthUser } from '@/lib/auth/serverAuth';
import { buildPeticaoPrompt } from '@/prompts/summarizer';

export async function POST(req: Request) {
  try {
    const auth = await requireAuthUser();
    if (!auth.ok) return auth.response;

    const { pauta_titulo, pauta_resumo, total_votos, tipo_consenso, bairro, cidade, estado } =
      await req.json();

    const minutaTexto = buildPeticaoPrompt({
      pauta_titulo,
      pauta_resumo,
      total_votos: total_votos || 50,
      tipo_consenso: tipo_consenso || 'discordar',
      bairro: bairro || auth.profile?.bairro || 'Centro',
      cidade: cidade || auth.profile?.cidade || 'São José dos Campos',
      estado: estado || auth.profile?.estado || 'SP',
      motivos_discordancia: [
        'Aumento expressivo do fluxo de veículos pesados em vias estritamente residenciais.',
        'Falta de estudo prévio de impacto de vizinhança no bairro.',
      ],
    });

    return NextResponse.json({
      success: true,
      minuta: minutaTexto,
      pdf_url: null,
    });
  } catch (error: any) {
    console.error('Erro em POST /api/peticao/gerar-pdf:', error?.message);
    return NextResponse.json({ error: 'Erro ao gerar minuta da petição.' }, { status: 500 });
  }
}
