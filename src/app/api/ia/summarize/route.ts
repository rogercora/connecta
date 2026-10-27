import { NextResponse } from 'next/server';
import { buildSummarizerPrompt, DiarioOficialInput, PautaIASummarized } from '@/prompts/summarizer';

export async function POST(req: Request) {
  try {
    const body: DiarioOficialInput = await req.json();

    if (!body.texto_bruto) {
      return NextResponse.json({ error: 'Texto bruto é obrigatório' }, { status: 400 });
    }

    const promptGerado = buildSummarizerPrompt(body);

    // Mock de resposta estruturada gerada pelo LLM para simulação
    const mockPauta: PautaIASummarized = {
      titulo: 'ALERTA DE IA: Pauta na Câmara',
      resumo_ia: 'Votação sobre plano de zoneamento urbano e diretrizes orçamentárias na via indicada.',
      impacto_bairro: 'Potencial alteração de tráfego e estímulo ao comércio local no bairro.',
      vereador_proponente: 'Vereador Carlos Silva',
      bairro_alvo: 'Ipiranga',
      cidade_alvo: body.municipio || 'São Paulo',
      estado_alvo: body.estado || 'SP',
      relevancia_score: 85,
      tags: ['zoneamento', 'orçamento', 'obras'],
    };

    return NextResponse.json({
      success: true,
      prompt: promptGerado,
      pauta: mockPauta,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

