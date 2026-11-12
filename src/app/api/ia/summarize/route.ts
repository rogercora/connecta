import { NextResponse } from 'next/server';
import { buildSummarizerPrompt, DiarioOficialInput, PautaIASummarized, SYSTEM_SUMMARIZER_PROMPT } from '@/prompts/summarizer';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const {
      texto_bruto,
      municipio = 'São José dos Campos',
      estado = 'SP',
      fonte_nome = 'Diário Oficial de São José dos Campos',
      apiKey: userApiKey,
      customPrompt,
    } = body;

    if (!texto_bruto || typeof texto_bruto !== 'string' || !texto_bruto.trim()) {
      return NextResponse.json(
        { error: 'O texto bruto da publicação/lei é obrigatório.' },
        { status: 400 }
      );
    }

    const input: DiarioOficialInput = {
      texto_bruto: texto_bruto.trim(),
      municipio,
      estado,
      data_publicacao: new Date().toLocaleDateString('pt-BR'),
      fonte_nome,
    };

    const effectivePrompt = customPrompt
      ? `${customPrompt}\n\nTEXTO:\n${texto_bruto}`
      : buildSummarizerPrompt(input);

    const apiKey = userApiKey || process.env.GEMINI_API_KEY;

    // Se temos uma chave de API do Gemini, faz a chamada real
    if (apiKey) {
      try {
        const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;

        const geminiRes = await fetch(geminiUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [
              {
                role: 'user',
                parts: [{ text: effectivePrompt }],
              },
            ],
            generationConfig: {
              temperature: 0.2,
              responseMimeType: 'application/json',
            },
          }),
        });

        if (geminiRes.ok) {
          const geminiData = await geminiRes.json();
          const rawText = geminiData.candidates?.[0]?.content?.parts?.[0]?.text;

          if (rawText) {
            const parsed = JSON.parse(rawText) as PautaIASummarized;
            return NextResponse.json({
              success: true,
              source: 'gemini-1.5-flash',
              pauta: {
                ...parsed,
                cidade_alvo: parsed.cidade_alvo || municipio,
                estado_alvo: parsed.estado_alvo || estado,
              },
              prompt_used: effectivePrompt,
            });
          }
        } else {
          const errText = await geminiRes.text();
          console.warn('Gemini API call failed, falling back to heuristic engine:', errText);
        }
      } catch (geminiError: any) {
        console.warn('Erro ao conectar ao Gemini, usando motor heurístico local:', geminiError.message);
      }
    }

    // Motor Heurístico Resiliente (para quando não há chave configurada ou modo offline)
    const extrairInfo = (texto: string): PautaIASummarized => {
      const lower = texto.toLowerCase();

      // Detecta Bairro
      let bairro = 'Jardim Aquárius';
      if (lower.includes('urbanova')) bairro = 'Urbanova';
      else if (lower.includes('santana')) bairro = 'Santana';
      else if (lower.includes('vila emma') || lower.includes('vl emma')) bairro = 'Vila Ema';
      else if (lower.includes('satélite') || lower.includes('satelite')) bairro = 'Jardim Satélite';
      else if (lower.includes('bosque')) bairro = 'Bosque dos Eucaliptos';
      else if (lower.includes('centro')) bairro = 'Centro';
      else if (lower.includes('zona leste') || lower.includes('eugênio') || lower.includes('eugenio')) bairro = 'Eugênio de Melo';
      else if (lower.includes('ipiranga')) bairro = 'Ipiranga';

      // Detecta Proponente / Vereador
      let proponente = 'Câmara Municipal de São José dos Campos';
      const autorMatch = texto.match(/(?:vereador|ver\.|autor|proponente|prefeito)\s+([A-ZÁÉÍÓÚÂÊÔÃÕ][a-záéíóúâêôãõ]+(?:\s+[A-ZÁÉÍÓÚÂÊÔÃÕ][a-záéíóúâêôãõ]+){1,3})/i);
      if (autorMatch && autorMatch[1]) {
        proponente = `Vereador ${autorMatch[1].trim()}`;
      } else if (lower.includes('executivo') || lower.includes('prefeito') || lower.includes('prefeitura')) {
        proponente = 'Prefeitura Municipal (Poder Executivo)';
      }

      // Detecta Tags e Tema
      const tags: string[] = [];
      let tema = 'Legislação e Serviços';
      let impacto = 'Mudanças nas diretrizes municipais com impacto direto nos bairros da cidade.';

      if (lower.includes('obra') || lower.includes('asfalto') || lower.includes('paviment')) {
        tags.push('obras', 'infraestrutura');
        tema = 'Obras e Infraestrutura Viária';
        impacto = `Intervenções viárias e obras públicas previstas para a região do ${bairro}.`;
      } else if (lower.includes('zoneamento') || lower.includes('comercial') || lower.includes('residencial') || lower.includes('constru')) {
        tags.push('zoneamento', 'urbanismo');
        tema = 'Zoneamento e Uso do Solo';
        impacto = `Regras de ocupação do solo e potencial alteração de tráfego na região do ${bairro}.`;
      } else if (lower.includes('iptu') || lower.includes('imposto') || lower.includes('taxa') || lower.includes('tribut')) {
        tags.push('tributos', 'finanças');
        tema = 'Tributação Municipal (IPTU/Taxas)';
        impacto = 'Ajuste nos valores de arrecadação municipal que afetam diretamente os imóveis da região.';
      } else if (lower.includes('ônibus') || lower.includes('onibus') || lower.includes('transporte') || lower.includes('linha')) {
        tags.push('transporte', 'mobilidade');
        tema = 'Transporte e Mobilidade';
        impacto = `Possível alteração de itinerários e oferta de linhas de transporte no ${bairro}.`;
      } else if (lower.includes('saúde') || lower.includes('saude') || lower.includes('ubs') || lower.includes('hospital')) {
        tags.push('saúde', 'serviços');
        tema = 'Saúde e Atendimento Público';
        impacto = `Ampliação ou remanejamento de atendimentos nas unidades de saúde do ${bairro}.`;
      } else {
        tags.push('câmara', 'diretrizes');
      }

      // Sintetiza resumo simples
      const primeirasLinhas = texto.split('\n').filter((l) => l.trim().length > 15)[0] || texto.slice(0, 150);
      const resumoCurto = primeirasLinhas.length > 140 ? `${primeirasLinhas.slice(0, 137)}...` : primeirasLinhas;

      return {
        titulo: `ALERTA DE IA: ${tema}`,
        resumo_ia: `Votação em tramitação: ${resumoCurto.replace(/^(artigo|art\.|parágrafo|decreto)\s+/i, '')}`,
        impacto_bairro: impacto,
        vereador_proponente: proponente,
        bairro_alvo: bairro,
        cidade_alvo: municipio,
        estado_alvo: estado,
        relevancia_score: 85,
        tags,
      };
    };

    const pautaHeuristica = extrairInfo(texto_bruto);

    return NextResponse.json({
      success: true,
      source: 'heuristic-engine-fallback',
      pauta: pautaHeuristica,
      prompt_used: effectivePrompt,
      note: apiKey ? 'Chave configurada, mas respondeu com motor de contingência.' : 'Nenhuma chave GEMINI_API_KEY configurada. Para usar o modelo Gemini ao vivo, informe a chave no painel ou no arquivo .env.local.',
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
