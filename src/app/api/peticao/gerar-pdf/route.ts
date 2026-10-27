import { NextResponse } from 'next/server';
import { buildPeticaoPrompt } from '@/prompts/summarizer';

export async function POST(req: Request) {
  try {
    const { pauta_titulo, pauta_resumo, total_votos, tipo_consenso, bairro, cidade, estado } = await req.json();

    const minutaTexto = buildPeticaoPrompt({
      pauta_titulo,
      pauta_resumo,
      total_votos: total_votos || 50,
      tipo_consenso: tipo_consenso || 'discordar',
      bairro: bairro || 'Ipiranga',
      cidade: cidade || 'São Paulo',
      estado: estado || 'SP',
      motivos_discordancia: [
        'Aumento expressivo do fluxo de veículos pesados em vias estritamente residenciais.',
        'Falta de estudo prévio de impacto de vizinhança no bairro.',
      ],
    });

    return NextResponse.json({
      success: true,
      minuta: minutaTexto,
      pdf_url: 'https://exemplo.com/peticoes/peticao-ipiranga-123.pdf',
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

